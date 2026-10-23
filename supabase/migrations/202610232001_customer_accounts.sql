-- Additive customer access. No existing order/profile is reassigned or backfilled.
begin;
create function public.ensure_customer_profile() returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare actor uuid:=auth.uid(); p public.profiles%rowtype; display_name text;
begin
 if actor is null then raise exception 'FORBIDDEN' using errcode='42501';end if;
 select * into p from public.profiles where id=actor for update;
 if found then
  if not p.is_active then raise exception 'FORBIDDEN' using errcode='42501';end if;
  return jsonb_build_object('role',p.role);
 end if;
 if not exists(select from auth.users where id=actor and email_confirmed_at is not null) then
  raise exception 'VERIFIED_IDENTITY_REQUIRED' using errcode='42501';
 end if;
 select left(nullif(trim(raw_user_meta_data->>'full_name'),''),100) into display_name from auth.users where id=actor;
 insert into public.profiles(id,full_name,role) values(actor,display_name,'customer') on conflict(id) do nothing;
 select * into strict p from public.profiles where id=actor;
 if not p.is_active then raise exception 'FORBIDDEN' using errcode='42501';end if;
 return jsonb_build_object('role',p.role);
end $$;
create function public.customer_dashboard() returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if public.current_profile_role() is distinct from 'customer' then raise exception 'FORBIDDEN' using errcode='42501';end if;
 return jsonb_build_object(
  'profile',(select jsonb_build_object('full_name',full_name) from public.profiles where id=auth.uid()),
  'orders',(select coalesce(jsonb_agg(x order by x.created_at desc,x.id),'[]') from
    (select id,code,status,total,created_at from public.orders where customer_id=auth.uid() order by created_at desc,id limit 50) x));
end $$;
revoke all on function public.ensure_customer_profile(),public.customer_dashboard() from public,anon,authenticated,service_role;
grant execute on function public.ensure_customer_profile(),public.customer_dashboard() to authenticated;
do $$
begin
 if exists(select from pg_proc where oid in ('public.ensure_customer_profile()'::regprocedure,'public.customer_dashboard()'::regprocedure) and
  (has_function_privilege('anon',oid,'EXECUTE') or has_function_privilege('service_role',oid,'EXECUTE') or exists(select from aclexplode(proacl) a where a.grantee=0))) then
  raise exception 'CUSTOMER_ACL_LEAK';
 end if;
end $$;
commit;
