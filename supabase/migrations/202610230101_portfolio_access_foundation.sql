-- Phase 01 only. Local/test authorization; never run schema.sql as an upgrade.
-- No quote consent/payment is inferred from legacy data.
begin;

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check check(role in ('admin','staff','customer'));
alter table public.profiles add column is_active boolean not null default true;
alter table public.profiles add column revision bigint not null default 0 check(revision>=0);
alter table public.orders add column revision bigint not null default 0 check(revision>=0);
alter table public.orders add column legacy_review_required boolean not null default true;
alter table public.orders add column is_synthetic boolean not null default false;
alter table public.orders add column ready_at timestamptz;
alter table public.orders add column delivered_at timestamptz;

create table public.order_assignments (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.orders(id),
 staff_id uuid not null references public.profiles(id),
 kind text not null check(kind in ('processor','courier')),
 assigned_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(), ended_at timestamptz,
 check(ended_at is null or ended_at>=created_at)
);
create unique index one_active_order_assignment on public.order_assignments(order_id,staff_id,kind) where ended_at is null;
create index staff_active_assignments on public.order_assignments(staff_id,order_id) where ended_at is null;
create table public.audit_events (
 id uuid primary key default gen_random_uuid(), actor_id uuid not null references public.profiles(id),
 action text not null, resource_type text not null, resource_id uuid not null,
 operation_key uuid not null, redacted_change jsonb not null,
 occurred_at timestamptz not null default now(), unique(actor_id,action,operation_key)
);
create table public.idempotency_keys (
 scope text not null, key uuid not null, request_hash bytea not null,
 order_revision bigint not null, result_ref jsonb not null,
 expires_at timestamptz not null default(now()+interval '7 days'), primary key(scope,key)
);
alter table public.order_assignments enable row level security;
alter table public.audit_events enable row level security;
alter table public.idempotency_keys enable row level security;

create schema app_private;
revoke all on schema app_private from public,anon,authenticated,service_role;

create function public.current_profile_role() returns text
language sql stable security definer set search_path=pg_catalog,public as $$
 select role from public.profiles where id=auth.uid() and is_active
$$;

-- Internal capability mapping. Callers cannot impersonate an actor through this helper.
create function app_private.actor_can(p_actor uuid,p_order uuid,p_action text) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
 select coalesce((select case
  when p_action is null or p_action not in ('read','intake','measure','issue_quote','start_work','qc','issue_amendment',
   'accept_quote','deliver_collect','incident','request','cancel','refund','reverse','waive','simulate','manage_order') then false
  when p.role='admin' then true
  when p.role='customer' then o.customer_id=p.id and p_action in ('read','accept_quote','request')
  when p.role='staff' then exists(select from public.order_assignments a
    where a.order_id=o.id and a.staff_id=p.id and a.ended_at is null and (
     p_action='read' or
     (p_action='incident' and o.status not in ('delivered','cancelled')) or
     (a.kind='courier' and p_action in ('intake','deliver_collect')) or
     (a.kind='processor' and p_action in ('measure','issue_quote','start_work','qc')
       and (p_action<>'issue_quote' or o.status in ('pending','picked_up')))))
  else false end
 from public.profiles p cross join public.orders o
 where p.id=p_actor and p.is_active and o.id=p_order),false)
$$;
create function public.can_order_action(p_auth_user_id uuid,p_order_id uuid,p_action text) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$
 select coalesce(p_auth_user_id=auth.uid(),false)
   and app_private.actor_can(auth.uid(),p_order_id,p_action)
$$;

-- Common RLS projection omits contact details/internal notes. This explicit RPC
-- returns contact only to owner/admin; staff never inherit customer PII by SELECT *.
create function public.order_contact(p_order_id uuid) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if not public.can_order_action(auth.uid(),p_order_id,'read') or
    public.current_profile_role() not in ('admin','customer') then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 return (select jsonb_build_object('customer_name',customer_name,'customer_phone',customer_phone,
   'pickup_address',pickup_address) from public.orders where id=p_order_id);
end $$;

create function app_private.append_only() returns trigger
language plpgsql set search_path=pg_catalog,public as $$
begin raise exception 'APPEND_ONLY' using errcode='42501'; end $$;
create trigger audit_append_only before update or delete on public.audit_events for each row execute function app_private.append_only();
create trigger history_append_only before update or delete on public.order_status_history for each row execute function app_private.append_only();

-- One lock serializes *all* membership changes, including owner maintenance.
-- Ordinary users/service_role have no direct profile mutation grants.
create function app_private.protect_last_admin() returns trigger
language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 perform pg_advisory_xact_lock(23010101);
 if old.role='admin' and old.is_active and
   (tg_op='DELETE' or new.role<>'admin' or not new.is_active) and
   not exists(select from public.profiles where role='admin' and is_active and id<>old.id) then
   raise exception 'LAST_ACTIVE_ADMIN';
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
create trigger preserve_last_admin before update or delete on public.profiles for each row execute function app_private.protect_last_admin();

create function public.manage_profile(p_target uuid,p_role text,p_active boolean,p_expected_revision bigint,p_operation_key uuid)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_actor uuid:=auth.uid(); v_hash bytea; v_scope text; v_saved public.idempotency_keys%rowtype;
 v_profile public.profiles%rowtype; v_result jsonb;
begin
 perform pg_advisory_xact_lock(23010101);
 if public.current_profile_role() is distinct from 'admin' then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 if p_target is null or p_role is null or p_role not in ('admin','staff','customer') or p_active is null or p_expected_revision is null or p_operation_key is null then raise exception 'INVALID_INPUT'; end if;
 v_scope:='profile:'||v_actor;
 v_hash:=sha256(convert_to(jsonb_build_array(p_target,p_role,p_active,p_expected_revision)::text,'UTF8'));
 select * into v_saved from public.idempotency_keys where scope=v_scope and key=p_operation_key;
 if found then
   if v_saved.request_hash<>v_hash then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
   if v_saved.expires_at<=now() then raise exception 'OPERATION_EXPIRED'; end if;
   return v_saved.result_ref;
 end if;
 select * into strict v_profile from public.profiles where id=p_target for update;
 if v_profile.revision<>p_expected_revision then raise exception 'REVISION_CONFLICT'; end if;
 update public.profiles set role=p_role,is_active=p_active,revision=revision+1 where id=p_target returning * into v_profile;
 v_result:=jsonb_build_object('id',v_profile.id,'revision',v_profile.revision,'role',v_profile.role,'is_active',v_profile.is_active);
 insert into public.audit_events(actor_id,action,resource_type,resource_id,operation_key,redacted_change)
 values(v_actor,'manage_profile','profile',p_target,p_operation_key,jsonb_build_object('role',p_role,'is_active',p_active));
 insert into public.idempotency_keys(scope,key,request_hash,order_revision,result_ref)
 values(v_scope,p_operation_key,v_hash,p_expected_revision,v_result);
 return v_result;
end $$;

-- Preserve the legacy server-only signature while recording history correctly
-- on INSERT, rather than rewriting a historical row afterwards.
create or replace function public.log_order_status() returns trigger
language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if tg_op='INSERT' or new.status is distinct from old.status then
   insert into public.order_status_history(order_id,status,changed_by)
   values(new.id,new.status,nullif(current_setting('app.order_actor',true),'')::uuid);
 end if;
 return new;
end $$;
create or replace function public.update_admin_order(p_id uuid,p_expected public.order_status,p_next public.order_status,p_actor uuid)
returns void language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_current public.order_status;
begin
 -- Session is verified by requireAdmin before the trusted service-role call.
 if not app_private.actor_can(p_actor,p_id,'manage_order') then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 perform 1 from public.profiles where id=p_actor and is_active and role='admin' for share;
 if not found then raise exception 'FORBIDDEN' using errcode='42501'; end if;
 select status into v_current from public.orders where id=p_id for update;
 if not found or v_current<>p_expected then raise exception 'ORDER_CHANGED'; end if;
 if not ((v_current='pending' and p_next in ('picked_up','cancelled')) or
   (v_current='picked_up' and p_next in ('processing','cancelled')) or
   (v_current='processing' and p_next='ready') or (v_current='ready' and p_next='delivered')) then raise exception 'INVALID_TRANSITION'; end if;
 perform set_config('app.order_actor',p_actor::text,true);
 update public.orders set status=p_next,revision=revision+1,
   delivery_time=case when p_next='delivered' then now() else delivery_time end where id=p_id;
end $$;

-- Explicit grants survive Supabase's permissive per-owner defaults.
revoke all on public.profiles,public.orders,public.order_items,public.order_status_history,
 public.order_assignments,public.audit_events,public.idempotency_keys from public,anon,authenticated,service_role;
grant select on public.profiles,public.orders,public.order_items,public.order_status_history,
 public.order_assignments,public.audit_events to service_role;
grant select(id,full_name,role,is_active,revision) on public.profiles to authenticated;
grant select(id,code,customer_id,status,total,revision,legacy_review_required,is_synthetic,created_at,ready_at,delivered_at) on public.orders to authenticated,anon;
grant select(id,order_id,service_id,quantity,unit_price) on public.order_items to authenticated;
grant select on public.order_status_history,public.order_assignments,public.audit_events to authenticated;

create policy profile_scope on public.profiles for select to authenticated using
 (public.current_profile_role()='admin' or (id=auth.uid() and is_active));
create policy order_scope on public.orders for select to authenticated using
 (public.can_order_action(auth.uid(),id,'read'));
create policy item_scope on public.order_items for select to authenticated using
 (public.can_order_action(auth.uid(),order_id,'read'));
create policy history_scope on public.order_status_history for select to authenticated using
 (public.can_order_action(auth.uid(),order_id,'read'));
create policy assignment_scope on public.order_assignments for select to authenticated using
 (public.current_profile_role()='admin' or (staff_id=auth.uid() and public.can_order_action(auth.uid(),order_id,'read')));
create policy audit_admin on public.audit_events for select to authenticated using(public.current_profile_role()='admin');

revoke all on all functions in schema app_private from public,anon,authenticated,service_role;
revoke all on function public.current_profile_role(),public.can_order_action(uuid,uuid,text),
 public.order_contact(uuid),public.manage_profile(uuid,text,boolean,bigint,uuid),public.log_order_status(),
 public.update_admin_order(uuid,public.order_status,public.order_status,uuid) from public,anon,authenticated,service_role;
grant execute on function public.current_profile_role(),public.can_order_action(uuid,uuid,text),
 public.order_contact(uuid),public.manage_profile(uuid,text,boolean,bigint,uuid) to authenticated;
grant execute on function public.update_admin_order(uuid,public.order_status,public.order_status,uuid) to service_role;

commit;
