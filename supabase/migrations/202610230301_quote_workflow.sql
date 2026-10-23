begin;
alter table public.order_items add constraint order_item_same_order unique(id,order_id);
alter table public.order_quotes add column is_amendment boolean not null default false;
create or replace function app_private.quote_immutable() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare v_state text;
begin
 if tg_table_name='order_quotes' then
  if old.state<>'draft' and (tg_op='DELETE' or new.state='draft' or
   (old.state in ('rejected','expired') and new.state<>old.state) or to_jsonb(new)-'state'<>to_jsonb(old)-'state') then raise exception 'IMMUTABLE_QUOTE';end if;
 else select state into v_state from public.order_quotes where id=old.quote_id;if v_state<>'draft' then raise exception 'IMMUTABLE_QUOTE';end if;
 end if;if tg_op='DELETE' then return old;end if;return new;
end $$;
create table public.evidence (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),
 kind text not null,body text not null check(length(body) between 5 and 2000),
 verification_state text not null check(verification_state in ('verified','unverified')),
 recorded_by uuid not null references public.profiles(id),created_at timestamptz not null default now(),unique(id,order_id)
);
alter table public.quote_approvals add constraint approval_evidence foreign key(evidence_id) references public.evidence(id);
create table public.laundry_bags (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),
 tag_id text not null unique check(length(tag_id) between 3 and 80),service_group text not null,
 item_count integer not null check(item_count between 1 and 1000),intake_condition text not null check(length(intake_condition) between 5 and 1000),
 custody_state text not null default 'received' check(custody_state in ('received','returned')),qc_completed boolean not null default false,
 created_at timestamptz not null default now(),actor_id uuid not null references public.profiles(id),unique(id,order_id)
);
create table public.flagged_items (
 id uuid primary key default gen_random_uuid(),bag_id uuid not null,order_id uuid not null references public.orders(id),
 tag_id text not null unique check(length(tag_id) between 3 and 80),description text not null check(length(description) between 2 and 500),
 condition text not null check(length(condition) between 5 and 1000),qc_completed boolean not null default false,
 created_at timestamptz not null default now(),actor_id uuid not null references public.profiles(id),unique(id,order_id),
 foreign key(bag_id,order_id) references public.laundry_bags(id,order_id)
);
create table public.registered_tags (
 tag_id text primary key,order_id uuid not null references public.orders(id),bag_id uuid,flagged_item_id uuid,
 check((bag_id is null)<>(flagged_item_id is null)),created_at timestamptz not null default now(),
 foreign key(bag_id,order_id) references public.laundry_bags(id,order_id),
 foreign key(flagged_item_id,order_id) references public.flagged_items(id,order_id)
);
create table public.custody_events (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),bag_id uuid,flagged_item_id uuid,
 kind text not null check(kind in ('received','condition','retag','qc','returned')),actor_id uuid not null references public.profiles(id),
 evidence_id uuid,replaced_tag_id text references public.registered_tags(tag_id),new_tag_id text references public.registered_tags(tag_id),created_at timestamptz not null default now(),
 check((bag_id is null)<>(flagged_item_id is null)),
 foreign key(bag_id,order_id) references public.laundry_bags(id,order_id),
 foreign key(flagged_item_id,order_id) references public.flagged_items(id,order_id),
 foreign key(evidence_id,order_id) references public.evidence(id,order_id)
);
create table public.order_issues (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),type text not null,
 blocking boolean not null,state text not null default 'open' check(state in ('open','resolved')),remedy text,
 evidence_id uuid,actor_id uuid not null references public.profiles(id),created_at timestamptz not null default now(),unique(id,order_id),
 foreign key(evidence_id,order_id) references public.evidence(id,order_id)
);
create table public.order_requests (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),type text not null,
 requester_id uuid not null references public.profiles(id),payload jsonb not null,created_at timestamptz not null default now()
);
create table public.custody_waivers (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),bag_id uuid,flagged_item_id uuid,
 issue_id uuid not null,evidence_id uuid not null,approved_by uuid not null references public.profiles(id),created_at timestamptz not null default now(),
 check((bag_id is null)<>(flagged_item_id is null)),
 foreign key(bag_id,order_id) references public.laundry_bags(id,order_id),
 foreign key(flagged_item_id,order_id) references public.flagged_items(id,order_id),
 foreign key(issue_id,order_id) references public.order_issues(id,order_id),
 foreign key(evidence_id,order_id) references public.evidence(id,order_id)
);
create table public.order_charges (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),type text not null,
 signed_amount bigint not null check(signed_amount<>0),evidence_id uuid not null,actor_id uuid not null references public.profiles(id),
 reason text not null,created_at timestamptz not null default now(),unique(id,order_id),
 foreign key(evidence_id,order_id) references public.evidence(id,order_id)
);
create table public.order_settlements (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),version integer not null check(version>=0),
 quote_id uuid not null,quote_hash text not null,total bigint not null check(total>=0),actor_id uuid references public.profiles(id),reason text not null,
 created_at timestamptz not null default now(),unique(order_id,version),unique(id,order_id),
 foreign key(quote_id,order_id) references public.order_quotes(id,order_id)
);
create table public.settlement_items (
 settlement_id uuid not null,order_item_id integer not null,order_id uuid not null,actual_qty numeric not null,
 rate bigint not null check(rate>=0),line_total bigint not null check(line_total>=0),primary key(settlement_id,order_item_id),
 check(actual_qty>0 and actual_qty<=1000 and actual_qty=round(actual_qty,2)),
 foreign key(settlement_id,order_id) references public.order_settlements(id,order_id),
 foreign key(order_item_id,order_id) references public.order_items(id,order_id)
);
create table public.settlement_charges (
 settlement_id uuid not null,charge_id uuid not null,order_id uuid not null,primary key(settlement_id,charge_id),
 foreign key(settlement_id,order_id) references public.order_settlements(id,order_id),
 foreign key(charge_id,order_id) references public.order_charges(id,order_id)
);
alter table public.orders add column active_settlement_id uuid;
alter table public.orders add constraint active_settlement_same_order foreign key(active_settlement_id,id) references public.order_settlements(id,order_id);

create function app_private.permanent_order() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin if to_jsonb(new)-array['tag_id','custody_state','qc_completed']<>to_jsonb(old)-array['tag_id','custody_state','qc_completed'] then raise exception 'PERMANENT_ORDER';end if;return new;end $$;
create trigger bag_permanent_order before update on public.laundry_bags for each row execute function app_private.permanent_order();
create trigger item_permanent_order before update on public.flagged_items for each row execute function app_private.permanent_order();
create function app_private.register_tag() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if tg_op='INSERT' or new.tag_id<>old.tag_id then
  if exists(select from public.registered_tags where tag_id=new.tag_id) then raise exception 'TAG_EXISTS';end if;
  insert into public.registered_tags(tag_id,order_id,bag_id,flagged_item_id) values(new.tag_id,new.order_id,case when tg_table_name='laundry_bags' then new.id end,case when tg_table_name='flagged_items' then new.id end);
 end if;return null;
end $$;
create trigger bag_register_tag after insert or update of tag_id on public.laundry_bags for each row execute function app_private.register_tag();
create trigger item_register_tag after insert or update of tag_id on public.flagged_items for each row execute function app_private.register_tag();

create function app_private.quote_eligible(p_quote uuid) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
 select coalesce((select q.state='issued' and exists(select from public.quote_approvals a where a.quote_id=q.id and a.quote_hash=q.content_hash and
  ((q.version=0 and a.method='checkout_consent' and a.verification_state='declared') or
   (a.method in ('customer','simulated_customer') and a.verification_state='verified')))
 from public.order_quotes q where q.id=p_quote),false)
$$;
create function app_private.new_settlement(p_order uuid,p_items jsonb,p_reason text) returns uuid
language plpgsql security definer set search_path=pg_catalog,public as $$
declare q public.order_quotes%rowtype;i public.order_quote_items%rowtype;j jsonb;qty numeric;v_total bigint:=0;v_base bigint;v_settlement uuid;v_rows jsonb:='[]';v_seen int[]:='{}';
begin
 select q0.* into strict q from public.order_quotes q0 join public.orders o on o.active_quote_id=q0.id where o.id=p_order;
 if not app_private.quote_eligible(q.id) then raise exception 'QUOTE_NOT_APPROVED';end if;
 if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items)<>(select count(*) from public.order_quote_items where quote_id=q.id) then raise exception 'QUOTE_REQUIRED';end if;
 for j in select * from jsonb_array_elements(p_items) loop
  if jsonb_typeof(j->'quantity') is distinct from 'number' then raise exception 'INVALID_QUANTITY';end if;
  select * into i from public.order_quote_items where quote_id=q.id and order_item_id=(j->>'order_item_id')::integer;
  if not found or i.order_item_id=any(v_seen) then raise exception 'QUOTE_REQUIRED';end if;
  v_seen:=array_append(v_seen,i.order_item_id);qty:=(j->>'quantity')::numeric;
  if qty<=0 or qty>1000 or qty<>round(qty,2) or (i.snapshot_unit<>'kg' and qty<>trunc(qty)) then raise exception 'INVALID_QUANTITY';end if;
  if (j ? 'rate' and (j->>'rate')::numeric<>i.snapshot_rate) or
   (qty<>i.quantity and not(q.version=0 and q.tolerance_consent and i.snapshot_unit='kg' and abs(qty-i.quantity)<=i.tolerance_kg)) then raise exception 'QUOTE_REQUIRED';end if;
  v_total:=v_total+round(qty*i.snapshot_rate);
  v_rows:=v_rows||jsonb_build_array(jsonb_build_object('id',i.order_item_id,'qty',qty,'rate',i.snapshot_rate,'total',round(qty*i.snapshot_rate)));
 end loop;
 v_base:=v_total+q.delivery_fee+q.surcharge-q.discount;
 if v_base<0 then raise exception 'NEGATIVE_SETTLEMENT';end if;
 v_total:=v_base+coalesce((select sum(signed_amount) from public.order_charges where order_id=p_order),0);
 if v_total<0 then raise exception 'NEGATIVE_SETTLEMENT';end if;
 insert into public.order_settlements(order_id,version,quote_id,quote_hash,total,actor_id,reason)
 select p_order,coalesce(max(version)+1,0),q.id,q.content_hash,v_total,auth.uid(),p_reason from public.order_settlements where order_id=p_order returning id into v_settlement;
 for j in select * from jsonb_array_elements(v_rows) loop
  insert into public.settlement_items(settlement_id,order_id,order_item_id,actual_qty,rate,line_total) values(v_settlement,p_order,(j->>'id')::integer,(j->>'qty')::numeric,(j->>'rate')::bigint,(j->>'total')::bigint);
 end loop;
 insert into public.settlement_charges(settlement_id,charge_id,order_id) select v_settlement,id,p_order from public.order_charges where order_id=p_order;
 update public.orders set active_settlement_id=v_settlement,total=v_total where id=p_order;
 return v_settlement;
end $$;

create function app_private.book_settlement() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_items jsonb;
begin
 if new.is_synthetic and new.status='pending' and new.active_quote_id is not null and new.active_settlement_id is null and app_private.quote_eligible(new.active_quote_id) then
  select jsonb_agg(jsonb_build_object('order_item_id',order_item_id,'quantity',quantity)) into v_items from public.order_quote_items where quote_id=new.active_quote_id;
  perform app_private.new_settlement(new.id,v_items,'checkout_estimate');
 end if;return null;
end $$;
create trigger booking_settlement after update of active_quote_id on public.orders for each row execute function app_private.book_settlement();

create function app_private.reconcile(p_order uuid,p_data jsonb) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare b public.laundry_bags%rowtype;f public.flagged_items%rowtype;
begin
 if jsonb_typeof(p_data->'bags') is distinct from 'array' or jsonb_typeof(p_data->'items') is distinct from 'array' then raise exception 'RECONCILIATION_REQUIRED';end if;
 if (select count(*) from jsonb_array_elements_text(p_data->'bags'))<>(select count(distinct value) from jsonb_array_elements_text(p_data->'bags')) or
  (select count(*) from jsonb_array_elements_text(p_data->'items'))<>(select count(distinct value) from jsonb_array_elements_text(p_data->'items')) then raise exception 'RECONCILIATION_MISMATCH';end if;
 if exists(select from jsonb_array_elements_text(p_data->'bags') x where not exists(select from public.laundry_bags where id=x.value::uuid and order_id=p_order)) or
  exists(select from jsonb_array_elements_text(p_data->'items') x where not exists(select from public.flagged_items where id=x.value::uuid and order_id=p_order)) then raise exception 'RECONCILIATION_MISMATCH';end if;
 for b in select * from public.laundry_bags where order_id=p_order loop
  if not(p_data->'bags' ? b.id::text) and not exists(select from public.custody_waivers w join public.order_issues i on i.id=w.issue_id join public.evidence e on e.id=w.evidence_id where w.bag_id=b.id and i.state='resolved' and e.verification_state='verified') then raise exception 'RECONCILIATION_MISSING_BAG';end if;
 end loop;
 if not found then raise exception 'RECONCILIATION_NO_BAGS';end if;
 for f in select * from public.flagged_items where order_id=p_order loop
  if not(p_data->'items' ? f.id::text) and not exists(select from public.custody_waivers w join public.order_issues i on i.id=w.issue_id join public.evidence e on e.id=w.evidence_id where w.flagged_item_id=f.id and i.state='resolved' and e.verification_state='verified') then raise exception 'RECONCILIATION_MISSING_ITEM';end if;
 end loop;
end $$;

create function app_private.workflow(p_order uuid,p_action text,p_data jsonb) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare o public.orders%rowtype;q public.order_quotes%rowtype;qi public.order_quote_items%rowtype;
 j jsonb;k jsonb;b_id uuid;f_id uuid;e_id uuid;q_id uuid;v_qty numeric;v_rate bigint;v_total bigint:=0;
 v_version integer;v_tag text;v_items jsonb;v_state text;v_count integer;v_service public.services%rowtype;v_seen int[]:='{}';v_amount numeric;
begin
 select * into strict o from public.orders where id=p_order;
 select * into strict q from public.order_quotes where id=o.active_quote_id;
 case p_action
 when 'intake' then
  if o.status<>'pending' then raise exception 'INVALID_TRANSITION';end if;
  if jsonb_typeof(p_data->'bags') is distinct from 'array' or jsonb_array_length(p_data->'bags') not between 1 and 20 then raise exception 'INVALID_BAGS';end if;
  for j in select * from jsonb_array_elements(p_data->'bags') loop
   insert into public.laundry_bags(order_id,tag_id,service_group,item_count,intake_condition,actor_id) values(p_order,j->>'tag',j->>'service_group',(j->>'count')::integer,j->>'condition',auth.uid()) returning id into b_id;
   insert into public.custody_events(order_id,bag_id,kind,actor_id) values(p_order,b_id,'received',auth.uid());
   if jsonb_typeof(coalesce(j->'flagged','[]'))<>'array' or jsonb_array_length(coalesce(j->'flagged','[]'))>20 then raise exception 'INVALID_FLAGGED_ITEMS';end if;
   for k in select * from jsonb_array_elements(coalesce(j->'flagged','[]')) loop
    insert into public.flagged_items(bag_id,order_id,tag_id,description,condition,actor_id) values(b_id,p_order,k->>'tag',k->>'description',k->>'condition',auth.uid()) returning id into f_id;
    insert into public.custody_events(order_id,flagged_item_id,kind,actor_id) values(p_order,f_id,'received',auth.uid());
   end loop;
  end loop;
  update public.orders set status='picked_up' where id=p_order;
 when 'measure' then
  if o.status in ('pending','cancelled') or (o.status='delivered' and public.current_profile_role()<>'admin') then raise exception 'INVALID_TRANSITION';end if;
  if (p_data ? 'delivery_fee' and (p_data->>'delivery_fee')::bigint<>q.delivery_fee) or (p_data ? 'discount' and (p_data->>'discount')::bigint<>q.discount) or (p_data ? 'surcharge' and (p_data->>'surcharge')::bigint<>q.surcharge) then raise exception 'QUOTE_REQUIRED';end if;
  perform app_private.new_settlement(p_order,p_data->'items','actual_measurement');
 when 'issue_quote' then
  if o.status in ('pending','cancelled') then raise exception 'INVALID_TRANSITION';end if;
  if o.status in ('processing','ready','delivered') and public.current_profile_role()<>'admin' then raise exception 'FORBIDDEN' using errcode='42501';end if;
  if jsonb_typeof(p_data->'items') is distinct from 'array' or jsonb_array_length(p_data->'items')<>(select count(*) from public.order_quote_items where quote_id=q.id) then raise exception 'INVALID_QUOTE_ITEMS';end if;
  select max(version)+1 into v_version from public.order_quotes where order_id=p_order;
  insert into public.order_quotes(order_id,version,state,base_total,max_weight_total,delivery_fee,surcharge,discount,policy_version,tolerance_consent,checkout_consent,actor_id,is_amendment)
  values(p_order,v_version,'draft',0,0,coalesce((p_data->>'delivery_fee')::bigint,q.delivery_fee),coalesce((p_data->>'surcharge')::bigint,q.surcharge),coalesce((p_data->>'discount')::bigint,q.discount),'portfolio-v1.2',false,'{}',auth.uid(),o.status in ('processing','ready','delivered')) returning id into q_id;
  for j in select * from jsonb_array_elements(p_data->'items') loop
   select * into qi from public.order_quote_items where quote_id=q.id and order_item_id=(j->>'order_item_id')::integer;
   if not found or qi.order_item_id=any(v_seen) or jsonb_typeof(j->'quantity') is distinct from 'number' then raise exception 'INVALID_QUOTE_ITEMS';end if;
   v_seen:=array_append(v_seen,qi.order_item_id);v_qty:=(j->>'quantity')::numeric;
   v_rate:=qi.snapshot_rate;
   if j ? 'rate' then if jsonb_typeof(j->'rate')<>'number' or (j->>'rate')::numeric<>trunc((j->>'rate')::numeric) then raise exception 'INVALID_RATE';end if;v_rate:=(j->>'rate')::bigint;end if;
   if j ? 'service_id' then
    select * into v_service from public.services where id=(j->>'service_id')::integer and is_active;
    if not found then raise exception 'SERVICE_UNAVAILABLE';end if;
    qi.snapshot_name:=v_service.name;qi.snapshot_unit:=v_service.unit;v_rate:=v_service.price;
   end if;
   insert into public.order_quote_items(quote_id,order_item_id,snapshot_name,snapshot_unit,snapshot_rate,quantity,tolerance_kg) values(q_id,qi.order_item_id,qi.snapshot_name,qi.snapshot_unit,v_rate,v_qty,0);
   v_total:=v_total+round(v_qty*v_rate);
  end loop;
  update public.order_quotes set base_total=v_total+delivery_fee+surcharge-discount,max_weight_total=v_total+delivery_fee+surcharge-discount where id=q_id;
  update public.order_quotes set content_hash=app_private.quote_hash(q_id),state='issued' where id=q_id;
  update public.orders set active_quote_id=q_id,active_settlement_id=null where id=p_order;
 when 'accept_quote' then
  if (p_data->>'quote_id') is distinct from q.id::text or (p_data->>'hash') is distinct from q.content_hash then raise exception 'QUOTE_SUPERSEDED';end if;
  if q.version=0 or q.state<>'issued' or (p_data->>'amount')::numeric is distinct from q.base_total::numeric then raise exception 'INVALID_APPROVAL';end if;
  if public.current_profile_role()='customer' and o.customer_id=auth.uid() then
   insert into public.quote_approvals(quote_id,quote_hash,method,verification_state,actor_id) values(q.id,q.content_hash,'customer','verified',auth.uid());
  elsif public.current_profile_role()='admin' and o.is_synthetic and p_data->>'evidence_source'='customer_message' and length(p_data->>'simulated_customer_message') between 5 and 2000 then
   insert into public.evidence(order_id,kind,body,verification_state,recorded_by) values(p_order,'simulated_customer_message',p_data->>'simulated_customer_message','verified',auth.uid()) returning id into e_id;
   insert into public.quote_approvals(quote_id,quote_hash,method,verification_state,evidence_id,actor_id) values(q.id,q.content_hash,'simulated_customer','verified',e_id,auth.uid());
  else raise exception 'EVIDENCE_REQUIRED';end if;
 when 'phone_note' then
  insert into public.evidence(order_id,kind,body,verification_state,recorded_by) values(p_order,'staff_phone_note',p_data->>'message','unverified',auth.uid()) returning id into e_id;
  insert into public.quote_approvals(quote_id,quote_hash,method,verification_state,evidence_id,actor_id) values(q.id,q.content_hash,'phone_note','unverified',e_id,auth.uid());
 when 'quote_state' then
  if p_data->>'state' not in ('rejected','expired') or q.version=0 then raise exception 'INVALID_QUOTE_STATE';end if;
  update public.order_quotes set state=p_data->>'state' where id=q.id;
  update public.orders set active_settlement_id=null where id=p_order;
 when 'start_work' then
  if o.status not in ('picked_up','processing') then raise exception 'INVALID_TRANSITION';end if;
  if not app_private.quote_eligible(q.id) then raise exception 'QUOTE_NOT_APPROVED';end if;
  if o.active_settlement_id is null then raise exception 'SETTLEMENT_REQUIRED';end if;
  if exists(select from public.order_issues where order_id=p_order and blocking and state='open') then raise exception 'BLOCKING_ISSUE';end if;
  if o.status='processing' and (public.current_profile_role()<>'admin' or not q.is_amendment) then raise exception 'INVALID_TRANSITION';end if;
  update public.orders set status='processing' where id=p_order;
 when 'qc' then
  if o.status<>'processing' then raise exception 'INVALID_TRANSITION';end if;
  if exists(select from public.order_issues where order_id=p_order and blocking and state='open') then raise exception 'BLOCKING_ISSUE';end if;
  if not app_private.quote_eligible(q.id) or o.active_settlement_id is null then raise exception 'QUOTE_NOT_APPROVED';end if;
  perform app_private.reconcile(p_order,p_data);
  update public.laundry_bags set qc_completed=true where order_id=p_order;
  update public.flagged_items set qc_completed=true where order_id=p_order;
  insert into public.custody_events(order_id,bag_id,kind,actor_id) select p_order,id,'qc',auth.uid() from public.laundry_bags where order_id=p_order;
  insert into public.custody_events(order_id,flagged_item_id,kind,actor_id) select p_order,id,'qc',auth.uid() from public.flagged_items where order_id=p_order;
  update public.orders set status='ready',ready_at=now() where id=p_order;
 when 'incident' then
  insert into public.order_issues(order_id,type,blocking,actor_id) values(p_order,p_data->>'message',coalesce((p_data->>'blocking')::boolean,true),auth.uid());
 when 'request' then
  insert into public.order_requests(order_id,type,requester_id,payload) values(p_order,'customer_request',auth.uid(),p_data);
 when 'resolve_issue' then
  if not o.is_synthetic or length(p_data->>'simulated_customer_message') not between 5 and 2000 or (p_data->>'simulated_customer_message') is null or length(p_data->>'reason')<5 then raise exception 'EVIDENCE_REQUIRED';end if;
  insert into public.evidence(order_id,kind,body,verification_state,recorded_by) values(p_order,'simulated_remedy',p_data->>'simulated_customer_message','verified',auth.uid()) returning id into e_id;
  update public.order_issues set state='resolved',remedy=p_data->>'reason',evidence_id=e_id where id=(p_data->>'issue_id')::uuid and order_id=p_order and state='open';
  if not found then raise exception 'ISSUE_NOT_FOUND';end if;
 when 'waive' then
  if not exists(select from public.order_issues i join public.evidence e on e.id=i.evidence_id where i.id=(p_data->>'issue_id')::uuid and i.order_id=p_order and i.state='resolved' and e.verification_state='verified') then raise exception 'REMEDY_REQUIRED';end if;
  select evidence_id into e_id from public.order_issues where id=(p_data->>'issue_id')::uuid;
  insert into public.custody_waivers(order_id,bag_id,flagged_item_id,issue_id,evidence_id,approved_by) values(p_order,case when p_data->>'kind'='bag' then (p_data->>'target_id')::uuid end,case when p_data->>'kind'='item' then (p_data->>'target_id')::uuid end,(p_data->>'issue_id')::uuid,e_id,auth.uid());
 when 'retag' then
  if o.status in ('delivered','cancelled') or length(p_data->>'reason')<5 then raise exception 'INVALID_RETAG';end if;
  if exists(select from public.registered_tags where tag_id=p_data->>'tag') then raise exception 'TAG_EXISTS';end if;
  insert into public.evidence(order_id,kind,body,verification_state,recorded_by) values(p_order,'retag_condition',p_data->>'reason','unverified',auth.uid()) returning id into e_id;
  if p_data->>'kind'='bag' then
   select tag_id into strict v_tag from public.laundry_bags where id=(p_data->>'target_id')::uuid and order_id=p_order;
   update public.laundry_bags set tag_id=p_data->>'tag' where id=(p_data->>'target_id')::uuid;
   insert into public.custody_events(order_id,bag_id,kind,actor_id,replaced_tag_id,new_tag_id,evidence_id) values(p_order,(p_data->>'target_id')::uuid,'retag',auth.uid(),v_tag,p_data->>'tag',e_id);
  elsif p_data->>'kind'='item' then
   select tag_id into strict v_tag from public.flagged_items where id=(p_data->>'target_id')::uuid and order_id=p_order;
   update public.flagged_items set tag_id=p_data->>'tag' where id=(p_data->>'target_id')::uuid;
   insert into public.custody_events(order_id,flagged_item_id,kind,actor_id,replaced_tag_id,new_tag_id,evidence_id) values(p_order,(p_data->>'target_id')::uuid,'retag',auth.uid(),v_tag,p_data->>'tag',e_id);
  else raise exception 'INVALID_RETAG';end if;
 when 'charge' then
  v_amount:=(p_data->>'amount')::numeric;
  if v_amount is null or v_amount=0 or v_amount<>trunc(v_amount) or length(p_data->>'reason') not between 5 and 500 or (p_data->>'reason') is null or length(p_data->>'simulated_customer_message') not between 5 and 2000 or (p_data->>'simulated_customer_message') is null then raise exception 'EVIDENCE_REQUIRED';end if;
  if v_amount>0 and (q.version=0 or not app_private.quote_eligible(q.id) or (o.status in ('processing','ready','delivered') and not q.is_amendment)) then raise exception 'CHARGE_REQUIRES_AMENDMENT';end if;
  if o.active_settlement_id is null then raise exception 'SETTLEMENT_REQUIRED';end if;
  insert into public.evidence(order_id,kind,body,verification_state,recorded_by) values(p_order,'simulated_charge_evidence',p_data->>'simulated_customer_message','verified',auth.uid()) returning id into e_id;
  insert into public.order_charges(order_id,type,signed_amount,evidence_id,actor_id,reason) values(p_order,'adjustment',v_amount,e_id,auth.uid(),p_data->>'reason');
  select jsonb_agg(jsonb_build_object('order_item_id',order_item_id,'quantity',actual_qty)) into v_items from public.settlement_items where settlement_id=o.active_settlement_id;
  perform app_private.new_settlement(p_order,v_items,'charge_adjustment');
 else raise exception 'UNKNOWN_ACTION';
 end case;
end $$;

create function public.order_command(p_order uuid,p_revision bigint,p_key uuid,p_action text,p_data jsonb default '{}') returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare o public.orders%rowtype;v_cap text;v_actor uuid:=auth.uid();v_hash bytea;v_scope text;v_saved public.idempotency_keys%rowtype;v_result jsonb;
begin
 perform 1 from public.profiles where id=v_actor and is_active for share;
 if not found then raise exception 'FORBIDDEN' using errcode='42501';end if;
 select * into o from public.orders where id=p_order for update;
 if not found or not o.is_synthetic or o.legacy_review_required then raise exception 'DEMO_ORDER_REQUIRED';end if;
 perform 1 from public.order_assignments where order_id=p_order and ended_at is null for share;
 v_cap:=case p_action when 'phone_note' then 'incident' when 'retag' then 'intake' when 'charge' then 'manage_order' when 'resolve_issue' then 'manage_order' when 'quote_state' then 'manage_order' when 'issue_quote' then case when o.status in ('processing','ready','delivered') then 'issue_amendment' else 'issue_quote' end else p_action end;
 if not public.can_order_action(v_actor,p_order,v_cap) then raise exception 'FORBIDDEN' using errcode='42501';end if;
 if p_key is null or p_revision is null or p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'INVALID_COMMAND';end if;
 v_scope:='order:'||p_order||':'||v_actor;v_hash:=sha256(convert_to(jsonb_build_array(p_action,p_data,p_revision)::text,'UTF8'));
 select * into v_saved from public.idempotency_keys where scope=v_scope and key=p_key;
 if found then
  if v_hash<>v_saved.request_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;
  if v_saved.expires_at<=now() then raise exception 'OPERATION_EXPIRED';end if;return v_saved.result_ref;
 end if;
 if o.revision<>p_revision then raise exception 'REVISION_CONFLICT';end if;
 perform set_config('app.order_actor',v_actor::text,true);
 perform app_private.workflow(p_order,p_action,p_data);
 update public.orders set revision=revision+1 where id=p_order returning * into o;
 v_result:=jsonb_build_object('order_id',o.id,'revision',o.revision,'status',o.status,'total',o.total,'quote_id',o.active_quote_id,'settlement_id',o.active_settlement_id);
 insert into public.audit_events(actor_id,action,resource_type,resource_id,operation_key,redacted_change) values(v_actor,p_action,'order',p_order,p_key,v_result);
 insert into public.idempotency_keys(scope,key,request_hash,order_revision,result_ref) values(v_scope,p_key,v_hash,p_revision,v_result);
 return v_result;
end $$;

alter function public.update_admin_order(uuid,public.order_status,public.order_status,uuid) set schema app_private;
create function public.update_admin_order(p_id uuid,p_expected public.order_status,p_next public.order_status,p_actor uuid) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if not exists(select from public.profiles where id=p_actor and role='admin' and is_active) then raise exception 'FORBIDDEN' using errcode='42501';end if;
 raise exception 'USE_DEMO_WORKFLOW';
end $$;

do $tables$
declare t text;
begin
 foreach t in array array['evidence','laundry_bags','flagged_items','registered_tags','custody_events','order_issues','order_requests','custody_waivers','order_charges','order_settlements','settlement_items','settlement_charges'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated,service_role',t);
  execute format('grant select on public.%I to authenticated,service_role',t);
  execute format('create policy scoped_read on public.%I for select to authenticated using(public.can_order_action(auth.uid(),order_id,''read'') %s)',t,case when t in ('evidence','order_issues') then 'and public.current_profile_role()<>''customer''' else '' end);
  if t not in ('laundry_bags','flagged_items','order_issues') then execute format('create trigger append_only before update or delete on public.%I for each row execute function app_private.append_only()',t);end if;
 end loop;
end $tables$;
create function public.demo_order_detail(p_order uuid) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if not public.can_order_action(auth.uid(),p_order,'read') then raise exception 'FORBIDDEN' using errcode='42501';end if;
 return jsonb_build_object(
 'order',(select jsonb_build_object('id',id,'revision',revision,'status',status,'total',total,'active_quote_id',active_quote_id,'active_settlement_id',active_settlement_id) from public.orders where id=p_order),
 'eligible',(select app_private.quote_eligible(active_quote_id) from public.orders where id=p_order),
 'quotes',(select coalesce(jsonb_agg(to_jsonb(q)||jsonb_build_object('items',(select coalesce(jsonb_agg(i order by i.order_item_id),'[]') from public.order_quote_items i where i.quote_id=q.id),'approvals',(select coalesce(jsonb_agg(jsonb_build_object('method',method,'verification_state',verification_state)),'[]') from public.quote_approvals a where a.quote_id=q.id)) order by q.version),'[]') from public.order_quotes q where q.order_id=p_order),
 'bags',(select coalesce(jsonb_agg(to_jsonb(b)||jsonb_build_object('items',(select coalesce(jsonb_agg(f),'[]') from public.flagged_items f where f.bag_id=b.id)) order by b.created_at),'[]') from public.laundry_bags b where b.order_id=p_order),
 'settlements',(select coalesce(jsonb_agg(s order by version),'[]') from public.order_settlements s where order_id=p_order),
 'charges',(select coalesce(jsonb_agg(c),'[]') from public.order_charges c where order_id=p_order),
 'issues',case when public.current_profile_role()<>'customer' then (select coalesce(jsonb_agg(i),'[]') from public.order_issues i where order_id=p_order) else '[]'::jsonb end,
 'custody',(select coalesce(jsonb_agg(c order by created_at),'[]') from public.custody_events c where order_id=p_order)
 );
end $$;
revoke all on function public.demo_order_detail(uuid) from public,anon,authenticated,service_role;
grant execute on function public.demo_order_detail(uuid) to authenticated;
revoke all on all functions in schema app_private from public,anon,authenticated,service_role;
revoke all on function public.order_command(uuid,bigint,uuid,text,jsonb),public.update_admin_order(uuid,public.order_status,public.order_status,uuid) from public,anon,authenticated,service_role;
grant execute on function public.order_command(uuid,bigint,uuid,text,jsonb) to authenticated;
grant execute on function public.update_admin_order(uuid,public.order_status,public.order_status,uuid) to service_role;
commit;
