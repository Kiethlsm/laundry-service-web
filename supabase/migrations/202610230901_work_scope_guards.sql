begin;
-- Never infer work/QC approval for rows created before this migration.
alter table public.orders add column work_quote_id uuid;
alter table public.orders add column qc_quote_id uuid;
alter table public.orders add constraint work_quote_same_order foreign key(work_quote_id,id) references public.order_quotes(id,order_id);
alter table public.orders add constraint qc_quote_same_order foreign key(qc_quote_id,id) references public.order_quotes(id,order_id);
alter function app_private.workflow(uuid,text,jsonb) rename to workflow_v03;
create function app_private.workflow(p_order uuid,p_action text,p_data jsonb) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare o public.orders%rowtype;q public.order_quotes%rowtype;
begin
 select * into strict o from public.orders where id=p_order;
 select * into strict q from public.order_quotes where id=o.active_quote_id;
 if p_action='qc' and o.work_quote_id is distinct from o.active_quote_id then raise exception 'WORK_SCOPE_REQUIRED';end if;
 if p_action='start_work' and o.status='ready' then
  if public.current_profile_role()<>'admin' or not q.is_amendment then raise exception 'INVALID_TRANSITION';end if;
  if not app_private.quote_eligible(q.id) or o.active_settlement_id is null then raise exception 'QUOTE_NOT_APPROVED';end if;
  if exists(select from public.order_issues where order_id=p_order and blocking and state='open') then raise exception 'BLOCKING_ISSUE';end if;
 elsif p_action='qc' and o.status='ready' then
  if public.current_profile_role()<>'admin' or not q.is_amendment then raise exception 'INVALID_TRANSITION';end if;
  if not app_private.quote_eligible(q.id) or o.active_settlement_id is null then raise exception 'QUOTE_NOT_APPROVED';end if;
  if exists(select from public.order_issues where order_id=p_order and blocking and state='open') then raise exception 'BLOCKING_ISSUE';end if;
  perform app_private.reconcile(p_order,p_data);
  update public.laundry_bags set qc_completed=true where order_id=p_order;
  update public.flagged_items set qc_completed=true where order_id=p_order;
  insert into public.custody_events(order_id,bag_id,kind,actor_id) select p_order,id,'qc',auth.uid() from public.laundry_bags where order_id=p_order;
  insert into public.custody_events(order_id,flagged_item_id,kind,actor_id) select p_order,id,'qc',auth.uid() from public.flagged_items where order_id=p_order;
 else perform app_private.workflow_v03(p_order,p_action,p_data);
 end if;
 if p_action='issue_quote' then
  update public.orders set work_quote_id=null,qc_quote_id=null where id=p_order;
  update public.laundry_bags set qc_completed=false where order_id=p_order;
  update public.flagged_items set qc_completed=false where order_id=p_order;
 elsif p_action='start_work' then update public.orders set work_quote_id=active_quote_id where id=p_order;
 elsif p_action='qc' then update public.orders set qc_quote_id=active_quote_id where id=p_order;
 end if;
end $$;
create function app_private.delivery_scope() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if new.is_synthetic and new.status='delivered' and old.status is distinct from new.status then
  if old.status<>'ready' then raise exception 'INVALID_TRANSITION';end if;
  if new.qc_quote_id is distinct from new.active_quote_id or new.work_quote_id is distinct from new.active_quote_id or new.active_quote_id is null then raise exception 'QC_REQUIRED';end if;
  if not exists(select from public.order_settlements s join public.order_quotes q on q.id=s.quote_id where s.id=new.active_settlement_id and s.order_id=new.id and q.id=new.active_quote_id and s.quote_hash=q.content_hash) then raise exception 'QUOTE_REQUIRED';end if;
 end if;return new;
end $$;
create trigger delivery_scope before update of status on public.orders for each row execute function app_private.delivery_scope();
alter function public.demo_order_detail(uuid) set schema app_private;
alter function app_private.demo_order_detail(uuid) rename to detail_v03;
create function public.demo_order_detail(p_order uuid) returns jsonb language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare v_result jsonb;
begin
 v_result:=app_private.detail_v03(p_order);
 return jsonb_set(v_result,'{order}',v_result->'order'||(select jsonb_build_object('work_quote_id',work_quote_id,'qc_quote_id',qc_quote_id) from public.orders where id=p_order));
end $$;
-- Recompile the public dispatcher below after replacing its private callee.
create or replace function public.order_command(p_order uuid,p_revision bigint,p_key uuid,p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare o public.orders%rowtype;v_cap text;v_actor uuid:=auth.uid();v_hash bytea;v_scope text;v_saved public.idempotency_keys%rowtype;v_result jsonb;v_permanent public.audit_events%rowtype;
begin
 perform 1 from public.profiles where id=v_actor and is_active for share;
 if not found then raise exception 'FORBIDDEN' using errcode='42501';end if;
 select * into o from public.orders where id=p_order for update;
 if not found or not o.is_synthetic or o.legacy_review_required then raise exception 'DEMO_ORDER_REQUIRED';end if;
 perform 1 from public.order_assignments where order_id=p_order and ended_at is null for share;
 v_cap:=case p_action when 'receipt' then 'manage_order' when 'refund' then 'refund' when 'reverse' then 'reverse' when 'cancel' then 'cancel'
 when 'phone_note' then 'incident' when 'retag' then 'intake' when 'charge' then 'manage_order' when 'resolve_issue' then 'manage_order' when 'quote_state' then 'manage_order'
 when 'issue_quote' then case when o.status in ('processing','ready','delivered') then 'issue_amendment' else 'issue_quote' end else p_action end;
 if not public.can_order_action(v_actor,p_order,v_cap) then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if p_key is null or p_revision is null or p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'INVALID_COMMAND';end if;
 v_scope:='order:'||p_order||':'||v_actor;v_hash:=sha256(convert_to(jsonb_build_array(p_action,p_data,p_revision)::text,'UTF8'));
 if p_action in ('receipt','refund','reverse','deliver_collect') then
  select * into v_permanent from public.audit_events where resource_id=p_order and operation_key=p_key and action in ('receipt','refund','reverse','deliver_collect');
  if found then
   if v_permanent.actor_id<>v_actor or v_permanent.action<>p_action or v_permanent.redacted_change->>'request_hash' is distinct from encode(v_hash,'hex') then raise exception 'IDEMPOTENCY_CONFLICT';end if;
   return v_permanent.redacted_change->'result';
  end if;
 end if;
 select * into v_saved from public.idempotency_keys where scope=v_scope and key=p_key;
 if found then
  if v_hash<>v_saved.request_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;
  if v_saved.expires_at<=now() then raise exception 'OPERATION_EXPIRED';end if;return v_saved.result_ref;
 end if;
 if o.revision<>p_revision then raise exception 'REVISION_CONFLICT';end if;
 perform set_config('app.order_actor',v_actor::text,true);
 if p_action in ('receipt','refund','reverse','deliver_collect','cancel') then perform app_private.financial(p_order,p_action,p_data,p_key);
 else perform app_private.workflow(p_order,p_action,p_data);end if;
 update public.orders set revision=revision+1 where id=p_order returning * into o;
 v_result:=jsonb_build_object('order_id',o.id,'revision',o.revision,'status',o.status,'total',o.total,'quote_id',o.active_quote_id,'settlement_id',o.active_settlement_id,
 'transaction_id',(select id from public.payment_transactions where order_id=p_order and operation_key=p_key));
 insert into public.audit_events(actor_id,action,resource_type,resource_id,operation_key,redacted_change) values(v_actor,p_action,'order',p_order,p_key,jsonb_build_object('request_hash',encode(v_hash,'hex'),'result',v_result));
 insert into public.idempotency_keys(scope,key,request_hash,order_revision,result_ref) values(v_scope,p_key,v_hash,p_revision,v_result);
 return v_result;
end $$;

revoke all on all functions in schema app_private from public,anon,authenticated,service_role;
revoke all on function public.demo_order_detail(uuid) from public,anon,authenticated,service_role;
grant execute on function public.demo_order_detail(uuid) to authenticated;
commit;
