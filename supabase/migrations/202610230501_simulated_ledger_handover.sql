begin;
create table public.payment_transactions (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),
 kind text not null check(kind in ('receipt','refund','reversal')),amount bigint not null check(amount>0 and amount<=1000000000000),
 signed_effect bigint not null,method public.payment_method not null,currency text not null check(currency='VND'),
 environment text not null check(environment in ('demo','mock')),original_id uuid,
 provider text,external_id text,actor_id uuid not null references public.profiles(id),effective_at timestamptz not null default now(),
 operation_key uuid not null,correction_reason text,unique(id,order_id),unique(order_id,operation_key),unique(environment,provider,external_id),
 foreign key(original_id,order_id) references public.payment_transactions(id,order_id),
 check((kind='receipt' and original_id is null) or (kind in ('refund','reversal') and original_id is not null)),
 check(kind='receipt' or (correction_reason is not null and length(correction_reason)>=5)),check((provider is null)=(external_id is null))
);
create unique index one_reversal_per_original on public.payment_transactions(original_id) where kind='reversal';
create index payments_by_order on public.payment_transactions(order_id,effective_at);
create function app_private.validate_payment() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_original public.payment_transactions%rowtype;v_net bigint;
begin
 perform 1 from public.orders where id=new.order_id and is_synthetic and active_settlement_id is not null for update;
 if not found then raise exception 'DEMO_SETTLEMENT_REQUIRED';end if;
 if not app_private.actor_can(new.actor_id,new.order_id,case when new.kind='receipt' then 'deliver_collect' else 'refund' end) then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if new.kind='receipt' then new.signed_effect:=new.amount;
 else
  select * into v_original from public.payment_transactions where id=new.original_id and order_id=new.order_id for update;
  if not found then raise exception 'INVALID_REFERENCE';end if;
  if new.kind='refund' then
   if v_original.kind<>'receipt' or exists(select from public.payment_transactions where original_id=v_original.id and kind='reversal') then raise exception 'INVALID_REFERENCE';end if;
   select coalesce(sum(signed_effect),0) into v_net from public.payment_transactions where order_id=new.order_id;
   if new.amount>v_net then raise exception 'REFUND_EXCEEDS_AVAILABLE';end if;
   new.signed_effect:=-new.amount;
  else
   if v_original.kind not in ('receipt','refund') or new.amount<>v_original.amount or new.method<>v_original.method then raise exception 'INVALID_REVERSAL';end if;
   if exists(select from public.payment_transactions where original_id=v_original.id and kind='reversal') then raise exception 'ALREADY_REVERSED';end if;
   new.signed_effect:=-v_original.signed_effect;
  end if;
 end if;return new;
end $$;
create trigger payment_validate before insert on public.payment_transactions for each row execute function app_private.validate_payment();
create trigger payment_immutable before update or delete on public.payment_transactions for each row execute function app_private.append_only();
alter table public.payment_transactions enable row level security;
revoke all on public.payment_transactions from public,anon,authenticated,service_role;
grant select on public.payment_transactions to authenticated,service_role;
create policy payment_scope on public.payment_transactions for select to authenticated using(public.can_order_action(auth.uid(),order_id,'read'));

alter table public.laundry_bags drop constraint laundry_bags_custody_state_check;
alter table public.laundry_bags add constraint laundry_bags_custody_state_check check(custody_state in ('received','returned','waived'));
alter table public.flagged_items add column custody_state text not null default 'received' check(custody_state in ('received','returned','waived'));
alter table public.custody_events drop constraint custody_events_kind_check;
alter table public.custody_events add constraint custody_events_kind_check check(kind in ('received','condition','retag','qc','returned','waived'));

create function public.demo_payment_summary(p_order uuid) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare v_total bigint;v_net bigint;v_balance bigint;
begin
 if not public.can_order_action(auth.uid(),p_order,'read') then raise exception 'FORBIDDEN' using errcode='42501';end if;
 select s.total into v_total from public.orders o join public.order_settlements s on s.id=o.active_settlement_id where o.id=p_order;
 select coalesce(sum(signed_effect),0) into v_net from public.payment_transactions where order_id=p_order;
 v_balance:=v_total-v_net;
 return jsonb_build_object('settlement_total',v_total,'net_received',v_net,'balance',v_balance,
 'status',case when v_total is null then 'awaiting_settlement' when v_balance=0 then 'paid' when v_balance<0 then 'refund_due' when v_net>0 then 'partial' else 'unpaid' end,
 'entries',(select coalesce(jsonb_agg(p order by effective_at,id),'[]') from public.payment_transactions p where order_id=p_order));
end $$;
create function app_private.financial(p_order uuid,p_action text,p_data jsonb,p_key uuid) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare o public.orders%rowtype;v_net bigint;v_balance bigint;v_amount numeric;v_method public.payment_method;
 v_original public.payment_transactions%rowtype;e_id uuid;q public.order_quotes%rowtype;v_target uuid;
begin
 select * into strict o from public.orders where id=p_order;
 select * into strict q from public.order_quotes where id=o.active_quote_id;
 select coalesce(sum(signed_effect),0) into v_net from public.payment_transactions where order_id=p_order;
 if p_action='cancel' then
  if o.status not in ('pending','picked_up') then raise exception 'INVALID_TRANSITION';end if;
  if coalesce(length(p_data->>'reason'),0)<5 then raise exception 'REASON_REQUIRED';end if;
  if o.status='picked_up' and coalesce(length(p_data->>'return_plan'),0)<5 then raise exception 'RETURN_PLAN_REQUIRED';end if;
  if o.status='picked_up' then insert into public.order_issues(order_id,type,blocking,remedy,actor_id) values(p_order,'return_required',true,p_data->>'return_plan',auth.uid());end if;
  insert into public.order_settlements(order_id,version,quote_id,quote_hash,total,actor_id,reason)
  select p_order,coalesce(max(version)+1,0),q.id,q.content_hash,0,auth.uid(),'cancellation' from public.order_settlements where order_id=p_order returning id into v_target;
  update public.orders set active_settlement_id=v_target,total=0,status='cancelled' where id=p_order;
  return;
 end if;
 if o.active_settlement_id is null then raise exception 'SETTLEMENT_REQUIRED';end if;
 select total-v_net into v_balance from public.order_settlements where id=o.active_settlement_id;
 if p_action='reverse' then
  select * into v_original from public.payment_transactions where id=(p_data->>'original_id')::uuid and order_id=p_order;
  if not found or v_original.kind='reversal' then raise exception 'INVALID_REVERSAL';end if;
  v_amount:=v_original.amount;v_method:=v_original.method;
 else
  if jsonb_typeof(p_data->'amount') is distinct from 'number' then raise exception 'INVALID_AMOUNT';end if;
  v_amount:=(p_data->>'amount')::numeric;
  if v_amount is null or v_amount<>trunc(v_amount) or v_amount>1000000000000 or v_amount<0 or (p_action<>'deliver_collect' and v_amount=0) or (p_data ? 'currency' and p_data->>'currency'<>'VND') then raise exception 'INVALID_AMOUNT';end if;
  v_method:=(p_data->>'method')::public.payment_method;
  if v_method is null then raise exception 'INVALID_METHOD';end if;
 end if;
 if p_action in ('refund','reverse') and coalesce(length(p_data->>'reason'),0)<5 then raise exception 'REASON_REQUIRED';end if;
 if p_action='deliver_collect' then
  if o.status<>'ready' then raise exception 'INVALID_TRANSITION';end if;
  if not app_private.quote_eligible(q.id) then raise exception 'QUOTE_NOT_APPROVED';end if;
  if exists(select from public.order_issues where order_id=p_order and blocking and state='open') then raise exception 'BLOCKING_ISSUE';end if;
  perform app_private.reconcile(p_order,p_data);
  if exists(select from public.laundry_bags where order_id=p_order and not qc_completed) or exists(select from public.flagged_items where order_id=p_order and not qc_completed) then raise exception 'QC_REQUIRED';end if;
  if coalesce(length(p_data->>'recipient_evidence'),0) not between 5 and 2000 then raise exception 'RECIPIENT_EVIDENCE_REQUIRED';end if;
  if v_balance<0 then raise exception 'REFUND_DUE';end if;
  if v_amount<>v_balance or v_method<>'cash' then raise exception 'CASH_MISMATCH';end if;
  insert into public.evidence(order_id,kind,body,verification_state,recorded_by) values(p_order,'simulated_recipient_acknowledgement',p_data->>'recipient_evidence','verified',auth.uid()) returning id into e_id;
  update public.laundry_bags set custody_state=case when p_data->'bags' ? id::text then 'returned' else 'waived' end where order_id=p_order;
  update public.flagged_items set custody_state=case when p_data->'items' ? id::text then 'returned' else 'waived' end where order_id=p_order;
  insert into public.custody_events(order_id,bag_id,kind,actor_id,evidence_id)
  select p_order,b.id,case when b.custody_state='returned' then 'returned' else 'waived' end,auth.uid(),case when b.custody_state='returned' then e_id else (select w.evidence_id from public.custody_waivers w where w.bag_id=b.id limit 1) end from public.laundry_bags b where b.order_id=p_order;
  insert into public.custody_events(order_id,flagged_item_id,kind,actor_id,evidence_id)
  select p_order,f.id,case when f.custody_state='returned' then 'returned' else 'waived' end,auth.uid(),case when f.custody_state='returned' then e_id else (select w.evidence_id from public.custody_waivers w where w.flagged_item_id=f.id limit 1) end from public.flagged_items f where f.order_id=p_order;
  update public.orders set status='delivered',delivered_at=now(),delivery_time=now() where id=p_order;
 end if;
 if v_amount>0 then
  insert into public.payment_transactions(order_id,kind,amount,method,currency,environment,original_id,actor_id,operation_key,correction_reason)
  values(p_order,case when p_action='deliver_collect' then 'receipt' when p_action='reverse' then 'reversal' else p_action end,v_amount,v_method,'VND','demo',case when p_action in ('refund','reverse') then (p_data->>'original_id')::uuid end,auth.uid(),p_key,p_data->>'reason');
 end if;
end $$;

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

create function public.demo_financial_report() returns jsonb language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if public.current_profile_role() is distinct from 'admin' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 return jsonb_build_object(
 'cash_flow',(select coalesce(jsonb_agg(t order by day),'[]') from (select (effective_at at time zone 'Asia/Ho_Chi_Minh')::date as day,sum(signed_effect) as amount from public.payment_transactions group by 1)t),
 'delivered_value',(select coalesce(jsonb_agg(t order by day),'[]') from (select (occurred_at at time zone 'Asia/Ho_Chi_Minh')::date as day,sum((redacted_change->'result'->>'total')::bigint) as amount from public.audit_events where action='deliver_collect' group by 1)t),
 'unverified_approvals',(select count(*) from public.quote_approvals where verification_state='unverified'));
end $$;
revoke all on all functions in schema app_private from public,anon,authenticated,service_role;
revoke all on function public.demo_payment_summary(uuid),public.demo_financial_report(),public.order_command(uuid,bigint,uuid,text,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.demo_payment_summary(uuid),public.demo_financial_report(),public.order_command(uuid,bigint,uuid,text,jsonb) to authenticated;
commit;
