begin;
alter table public.order_items add column snapshot_name text;
alter table public.order_items add column snapshot_unit text;
create table public.order_quotes (
 id uuid primary key default gen_random_uuid(),order_id uuid not null references public.orders(id),
 version integer not null check(version>=0),state text not null check(state in ('draft','issued','rejected','expired')),
 content_hash text not null default '',delivery_fee bigint not null default 0 check(delivery_fee>=0),
 surcharge bigint not null default 0 check(surcharge>=0),discount bigint not null default 0 check(discount>=0),
 base_total bigint not null check(base_total>=0),max_weight_total bigint not null check(max_weight_total>=base_total),
 policy_version text not null,tolerance_consent boolean not null,checkout_consent jsonb not null,
 actor_id uuid references public.profiles(id),created_at timestamptz not null default now(),
 unique(order_id,version),unique(id,order_id)
);
create table public.order_quote_items (
 id uuid primary key default gen_random_uuid(),quote_id uuid not null references public.order_quotes(id),
 order_item_id integer not null references public.order_items(id),snapshot_name text not null,
 snapshot_unit text not null check(snapshot_unit in ('kg','cai','doi','bo')),snapshot_rate bigint not null check(snapshot_rate>=0),
 quantity numeric not null check(quantity>0 and quantity<=1000 and quantity=round(quantity,2)),
 tolerance_kg numeric not null default 0 check(tolerance_kg>=0),
 check(snapshot_unit='kg' or quantity=trunc(quantity)),unique(quote_id,order_item_id)
);
create table public.quote_approvals (
 id uuid primary key default gen_random_uuid(),quote_id uuid not null references public.order_quotes(id),
 quote_hash text not null,method text not null check(method in ('checkout_consent','customer','simulated_customer','phone_note')),
 verification_state text not null check(verification_state in ('declared','verified','unverified')),
 evidence_id uuid,actor_id uuid references public.profiles(id),approved_at timestamptz not null default now()
);
alter table public.orders add column active_quote_id uuid;
alter table public.orders add constraint active_quote_same_order foreign key(active_quote_id,id) references public.order_quotes(id,order_id);

create function app_private.quote_immutable() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare v_state text;
begin
 if tg_table_name='order_quotes' then
   if old.state<>'draft' and (tg_op='DELETE' or to_jsonb(new)-'state'<>to_jsonb(old)-'state') then raise exception 'IMMUTABLE_QUOTE'; end if;
 else
   select state into v_state from public.order_quotes where id=old.quote_id;
   if v_state<>'draft' then raise exception 'IMMUTABLE_QUOTE'; end if;
 end if;
 if tg_op='DELETE' then return old; end if;return new;
end $$;
create trigger quote_immutable before update or delete on public.order_quotes for each row execute function app_private.quote_immutable();
create trigger quote_item_immutable before update or delete on public.order_quote_items for each row execute function app_private.quote_immutable();
create trigger approval_append_only before update or delete on public.quote_approvals for each row execute function app_private.append_only();
create function app_private.quote_item_integrity() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare v_quote public.order_quotes%rowtype;v_order uuid;
begin
 select * into strict v_quote from public.order_quotes where id=new.quote_id;
 if v_quote.state<>'draft' then raise exception 'IMMUTABLE_QUOTE';end if;
 select order_id into strict v_order from public.order_items where id=new.order_item_id;
 if v_order<>v_quote.order_id then raise exception 'CROSS_ORDER_ITEM';end if;
 return new;
end $$;
create trigger quote_item_integrity before insert or update on public.order_quote_items for each row execute function app_private.quote_item_integrity();

create function app_private.quote_hash(p_id uuid) returns text
language sql stable security definer set search_path=pg_catalog,public as $$
 select encode(sha256(convert_to(jsonb_build_object('order_id',q.order_id,'version',q.version,
 'fee',q.delivery_fee,'surcharge',q.surcharge,'discount',q.discount,'total',q.base_total,
 'max',q.max_weight_total,'policy',q.policy_version,'tolerance',q.tolerance_consent,'consent',q.checkout_consent,
 'items',(select jsonb_agg(to_jsonb(i)-'id'-'quote_id' order by i.order_item_id) from public.order_quote_items i where i.quote_id=q.id))::text,'UTF8')),'hex')
 from public.order_quotes q where q.id=p_id
$$;

create function public.book_demo_order(p_payload jsonb,p_key uuid,p_customer_id uuid default null) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public set timezone='UTC' as $$
declare v_saved public.idempotency_keys%rowtype;v_hash bytea;v_order uuid;v_code text;v_quote uuid;
 v_item jsonb;v_service public.services%rowtype;v_qty numeric;v_item_id integer;v_seen int[]:='{}';
 v_total bigint:=0;v_max bigint:=0;v_tolerance numeric;v_pickup timestamptz;v_result jsonb;
begin
 if p_key is null or p_payload is null then raise exception 'INVALID_ORDER';end if;
 perform pg_advisory_xact_lock(23010201);
 v_hash:=sha256(convert_to(jsonb_build_array(p_payload,p_customer_id)::text,'UTF8'));
 select * into v_saved from public.idempotency_keys where scope='book' and key=p_key;
 if found then
   if v_saved.request_hash<>v_hash then raise exception 'IDEMPOTENCY_CONFLICT';end if;
   if v_saved.expires_at<=now() then raise exception 'OPERATION_EXPIRED';end if;
   return v_saved.result_ref||jsonb_build_object('replayed',true);
 end if;
 if jsonb_typeof(p_payload)<>'object' or jsonb_typeof(p_payload->'name') is distinct from 'string' or
  jsonb_typeof(p_payload->'phone') is distinct from 'string' or jsonb_typeof(p_payload->'address') is distinct from 'string' or
  jsonb_typeof(p_payload->'payment') is distinct from 'string' or
  jsonb_typeof(p_payload->'items') is distinct from 'array' or
  jsonb_array_length(p_payload->'items') not between 1 and 50 or
  length(trim(p_payload->>'name')) not between 2 and 100 or (p_payload->>'name') is null or
  (p_payload->>'phone') is null or (p_payload->>'phone') !~ '^0[0-9]{9}$' or
  length(trim(p_payload->>'address')) not between 5 and 500 or (p_payload->>'address') is null or
  (p_payload->>'payment') is null or (p_payload->>'payment') not in ('cash','bank_transfer') or
  coalesce(length(p_payload->>'note'),0)>1000 or p_payload->'consent' is distinct from 'true'::jsonb or
  jsonb_typeof(p_payload->'tolerance_consent') is distinct from 'boolean' then raise exception 'INVALID_ORDER';end if;
 if p_customer_id is not null and not exists(select from public.profiles where id=p_customer_id and is_active and role='customer') then raise exception 'INVALID_CUSTOMER';end if;
 if coalesce(p_payload->>'pickup','') !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.*(Z|[+-]\d{2}:\d{2})$' then raise exception 'INVALID_PICKUP';end if;
 begin v_pickup:=(p_payload->>'pickup')::timestamptz; exception when others then raise exception 'INVALID_PICKUP';end;
 if v_pickup<=now() then raise exception 'PICKUP_NOT_FUTURE';end if;
 if v_pickup>now()+interval '90 days' then raise exception 'PICKUP_TOO_FAR';end if;
 if (select count(*) from public.orders where is_synthetic)>=100 then raise exception 'DEMO_CAPACITY';end if;
 if (select count(*) from public.orders where customer_phone=p_payload->>'phone' and created_at>now()-interval '1 hour' and is_synthetic)>=3 then raise exception 'ORDER_RATE_LIMIT';end if;
 if (select count(*) from public.orders where customer_phone=p_payload->>'phone' and status='pending' and is_synthetic)>=5 then raise exception 'ORDER_PENDING_LIMIT';end if;
 insert into public.orders(customer_id,customer_name,customer_phone,pickup_address,pickup_time,payment_method,note,is_synthetic,legacy_review_required)
 values(p_customer_id,trim(p_payload->>'name'),p_payload->>'phone',trim(p_payload->>'address'),v_pickup,(p_payload->>'payment')::public.payment_method,p_payload->>'note',true,false) returning id,code into v_order,v_code;
 insert into public.order_quotes(order_id,version,state,base_total,max_weight_total,policy_version,tolerance_consent,checkout_consent)
 values(v_order,0,'draft',0,0,'portfolio-v1.2',(p_payload->>'tolerance_consent')::boolean,jsonb_build_object('accepted',true,'method','checkout_consent','synthetic',true)) returning id into v_quote;
 for v_item in select * from jsonb_array_elements(p_payload->'items') loop
  if jsonb_typeof(v_item->'quantity') is distinct from 'number' or jsonb_typeof(v_item->'service_id') is distinct from 'number' then raise exception 'INVALID_QUANTITY';end if;
  v_qty:=(v_item->>'quantity')::numeric;
  if v_qty<=0 or v_qty>1000 or v_qty<>round(v_qty,2) or (v_item->>'service_id')::numeric not between 1 and 2147483647 or (v_item->>'service_id')::numeric<>trunc((v_item->>'service_id')::numeric) then raise exception 'INVALID_QUANTITY';end if;
  if (v_item->>'service_id')::integer=any(v_seen) then raise exception 'INVALID_QUANTITY';end if;
  select * into v_service from public.services where id=(v_item->>'service_id')::integer and is_active for share;
  if not found then raise exception 'SERVICE_UNAVAILABLE';end if;
  if v_service.unit<>'kg' and v_qty<>trunc(v_qty) then raise exception 'INVALID_QUANTITY';end if;
  v_seen:=array_append(v_seen,v_service.id);
  v_tolerance:=case when v_service.unit='kg' and (p_payload->>'tolerance_consent')::boolean then greatest(v_qty*.1,.30) else 0 end;
  insert into public.order_items(order_id,service_id,quantity,unit_price,snapshot_name,snapshot_unit)
  values(v_order,v_service.id,v_qty,v_service.price,v_service.name,v_service.unit) returning id into v_item_id;
  insert into public.order_quote_items(quote_id,order_item_id,snapshot_name,snapshot_unit,snapshot_rate,quantity,tolerance_kg)
  values(v_quote,v_item_id,v_service.name,v_service.unit,v_service.price,v_qty,v_tolerance);
  v_total:=v_total+round(v_qty*v_service.price);v_max:=v_max+round((v_qty+v_tolerance)*v_service.price);
 end loop;
 update public.order_quotes set base_total=v_total,max_weight_total=v_max where id=v_quote;
 update public.order_quotes set content_hash=app_private.quote_hash(v_quote),state='issued' where id=v_quote;
 insert into public.quote_approvals(quote_id,quote_hash,method,verification_state,actor_id)
 select v_quote,content_hash,'checkout_consent','declared',p_customer_id from public.order_quotes where id=v_quote;
 update public.orders set total=v_total,active_quote_id=v_quote where id=v_order;
 v_result:=jsonb_build_object('code',v_code,'order_id',v_order,'quote_id',v_quote,'total',v_total,'max_weight_total',v_max,'replayed',false);
 insert into public.idempotency_keys(scope,key,request_hash,order_revision,result_ref) values('book',p_key,v_hash,0,v_result);
 return v_result;
end $$;
create function public.lookup_demo_order(p_code text,p_phone text) returns jsonb
language sql stable security definer set search_path=pg_catalog,public as $$
 select jsonb_build_object('code',code,'status',status,'total',total) from public.orders where code=p_code and customer_phone=p_phone
$$;

alter table public.order_quotes enable row level security;
alter table public.order_quote_items enable row level security;
alter table public.quote_approvals enable row level security;
revoke all on public.order_quotes,public.order_quote_items,public.quote_approvals from public,anon,authenticated,service_role;
grant select on public.order_quotes,public.order_quote_items,public.quote_approvals to authenticated,service_role;
create policy quote_scope on public.order_quotes for select to authenticated using(public.can_order_action(auth.uid(),order_id,'read'));
create policy quote_item_scope on public.order_quote_items for select to authenticated using(exists(select from public.order_quotes q where q.id=quote_id));
create policy approval_scope on public.quote_approvals for select to authenticated using(exists(select from public.order_quotes q where q.id=quote_id));
revoke all on all functions in schema app_private from public,anon,authenticated,service_role;
revoke all on function public.book_demo_order(jsonb,uuid,uuid),public.lookup_demo_order(text,text) from public,anon,authenticated,service_role;
grant execute on function public.book_demo_order(jsonb,uuid,uuid),public.lookup_demo_order(text,text) to service_role;
commit;
