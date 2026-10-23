-- GENERATED FROM LOCAL CATALOGS ONLY. NOT HOSTED-READY.
BEGIN;
DO $$ BEGIN IF current_database()<>'ss_p01_20f3a4c463ee45f5bae475151a9efa09' THEN RAISE EXCEPTION 'ROLLBACK_WRONG_DATABASE'; END IF; END $$;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
LOCK TABLE public."audit_events",public."idempotency_keys",public."order_assignments",public."order_items",public."order_status_history",public."orders",public."profiles",public."service_categories",public."services" IN ACCESS EXCLUSIVE MODE;
DO $$ BEGIN IF EXISTS(SELECT FROM public."audit_events") THEN RAISE EXCEPTION 'ROLLBACK_HAS_NEW_DATA'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT FROM public."idempotency_keys") THEN RAISE EXCEPTION 'ROLLBACK_HAS_NEW_DATA'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT FROM public."order_assignments") THEN RAISE EXCEPTION 'ROLLBACK_HAS_NEW_DATA'; END IF; END $$;
DO $$ BEGIN IF (SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text),'[]')::text) FROM (SELECT "id","order_id","service_id","quantity","unit_price","note" FROM public."order_items") r)<>'75a0b0321a6aeeadf0ff79545d989380' THEN RAISE EXCEPTION 'ROLLBACK_BASELINE_CHANGED'; END IF; END $$;
DO $$ BEGIN IF (SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text),'[]')::text) FROM (SELECT "id","order_id","status","changed_by","changed_at" FROM public."order_status_history") r)<>'f0e0f5f9ea8443a831d060060c82ec5b' THEN RAISE EXCEPTION 'ROLLBACK_BASELINE_CHANGED'; END IF; END $$;
DO $$ BEGIN IF (SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text),'[]')::text) FROM (SELECT "id","code","customer_id","customer_name","customer_phone","pickup_address","pickup_time","delivery_time","status","total","payment_method","note","created_at" FROM public."orders") r)<>'e5e5fdbf6d5e6b20179cf76f3abdee12' THEN RAISE EXCEPTION 'ROLLBACK_BASELINE_CHANGED'; END IF; END $$;
DO $$ BEGIN IF (SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text),'[]')::text) FROM (SELECT "id","full_name","phone","address","role","created_at" FROM public."profiles") r)<>'d7eece8095199299511494d4c082748f' THEN RAISE EXCEPTION 'ROLLBACK_BASELINE_CHANGED'; END IF; END $$;
DO $$ BEGIN IF (SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text),'[]')::text) FROM (SELECT "id","name","slug","description","sort_order" FROM public."service_categories") r)<>'87f27c1535bd10959c599540bb140a9d' THEN RAISE EXCEPTION 'ROLLBACK_BASELINE_CHANGED'; END IF; END $$;
DO $$ BEGIN IF (SELECT md5(coalesce(jsonb_agg(to_jsonb(r) ORDER BY to_jsonb(r)::text),'[]')::text) FROM (SELECT "id","category_id","name","unit","price","est_hours","is_active" FROM public."services") r)<>'36f4defeb6e67d169bd18be0b114be49' THEN RAISE EXCEPTION 'ROLLBACK_BASELINE_CHANGED'; END IF; END $$;
DO $$ BEGIN IF EXISTS(SELECT FROM public.profiles WHERE NOT is_active OR revision<>0) THEN RAISE EXCEPTION 'ROLLBACK_PROFILE_CHANGED'; END IF; END $$;
DROP TRIGGER "audit_append_only" ON public."audit_events";
DROP POLICY "audit_admin" ON public."audit_events";
DROP POLICY "assignment_scope" ON public."order_assignments";
DROP POLICY "item_scope" ON public."order_items";
DROP TRIGGER "history_append_only" ON public."order_status_history";
DROP POLICY "history_scope" ON public."order_status_history";
DROP POLICY "order_scope" ON public."orders";
DROP TRIGGER "preserve_last_admin" ON public."profiles";
DROP POLICY "profile_scope" ON public."profiles";
CREATE OR REPLACE FUNCTION public.create_guest_order(p_name text, p_phone text, p_address text, p_pickup timestamp with time zone, p_payment payment_method, p_note text, p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_id uuid; v_code text; v_total numeric := 0; v_item jsonb;
  v_service services%rowtype; v_qty numeric; v_seen int[] := '{}';
begin
  if length(trim(p_name)) not between 2 and 100 or p_phone !~ '^0[0-9]{9}$'
     or length(trim(p_address)) not between 5 and 500
     or p_pickup is null or p_pickup <= now()
     or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 50 then
    raise exception 'INVALID_ORDER';
  end if;
  insert into orders(customer_name, customer_phone, pickup_address, pickup_time, payment_method, note)
  values(trim(p_name), p_phone, trim(p_address), p_pickup, p_payment, nullif(trim(p_note),''))
  returning id, code into v_id, v_code;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::numeric;
    if v_qty is null or v_qty <= 0 or v_qty > 1000 or v_qty <> round(v_qty,2)
       or (v_item->>'service_id')::int = any(v_seen) then
      raise exception 'INVALID_QUANTITY';
    end if;
    select * into v_service from services
      where id = (v_item->>'service_id')::int and is_active = true for share;
    if not found then raise exception 'SERVICE_UNAVAILABLE'; end if;
    if v_service.unit <> 'kg' and v_qty <> trunc(v_qty) then raise exception 'INVALID_QUANTITY'; end if;
    v_seen := array_append(v_seen, v_service.id);
    insert into order_items(order_id, service_id, quantity, unit_price)
      values(v_id, v_service.id, v_qty, v_service.price);
    v_total := v_total + v_qty * v_service.price;
  end loop;
  v_total := round(v_total);
  update orders set total = v_total where id = v_id;
  return jsonb_build_object('code',v_code,'total',v_total);
end;
$function$
;
CREATE OR REPLACE FUNCTION public.log_order_status()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into order_status_history(order_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.update_admin_order(p_id uuid, p_expected order_status, p_next order_status, p_actor uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_current order_status;
begin
  if not exists(select 1 from profiles where id = p_actor and role = 'admin') then
    raise exception 'FORBIDDEN';
  end if;
  select status into v_current from orders where id = p_id for update;
  if not found or v_current <> p_expected then raise exception 'ORDER_CHANGED'; end if;
  if not ((v_current = 'pending' and p_next in ('picked_up','cancelled'))
    or (v_current = 'picked_up' and p_next in ('processing','cancelled'))
    or (v_current = 'processing' and p_next = 'ready')
    or (v_current = 'ready' and p_next = 'delivered')) then
    raise exception 'INVALID_TRANSITION';
  end if;
  update orders set status = p_next,
    delivery_time = case when p_next = 'delivered' then now() else delivery_time end where id = p_id;
  update order_status_history set changed_by = p_actor
    where id = (select id from order_status_history where order_id = p_id order by id desc limit 1);
end;
$function$
;
DROP FUNCTION app_private.actor_can(p_actor uuid, p_order uuid, p_action text);
DROP FUNCTION app_private.append_only();
DROP FUNCTION app_private.protect_last_admin();
DROP FUNCTION public.can_order_action(p_auth_user_id uuid, p_order_id uuid, p_action text);
DROP FUNCTION public.current_profile_role();
DROP FUNCTION public.manage_profile(p_target uuid, p_role text, p_active boolean, p_expected_revision bigint, p_operation_key uuid);
DROP FUNCTION public.order_contact(p_order_id uuid);
ALTER TABLE public."audit_events" DROP CONSTRAINT "audit_events_actor_id_fkey";
ALTER TABLE public."order_assignments" DROP CONSTRAINT "order_assignments_assigned_by_fkey";
ALTER TABLE public."order_assignments" DROP CONSTRAINT "order_assignments_order_id_fkey";
ALTER TABLE public."order_assignments" DROP CONSTRAINT "order_assignments_staff_id_fkey";
ALTER TABLE public."orders" DROP CONSTRAINT "orders_revision_check";
ALTER TABLE public."profiles" DROP CONSTRAINT "profiles_revision_check";
ALTER TABLE public."profiles" DROP CONSTRAINT "profiles_role_check";
DROP TABLE public."audit_events";
DROP TABLE public."idempotency_keys";
DROP TABLE public."order_assignments";
ALTER TABLE public."order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."order_items" NO FORCE ROW LEVEL SECURITY;
REVOKE ALL  ON TABLE public."order_items" FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT DELETE  ON TABLE public."order_items" TO "postgres";
GRANT INSERT  ON TABLE public."order_items" TO "postgres";
GRANT MAINTAIN  ON TABLE public."order_items" TO "postgres";
GRANT REFERENCES  ON TABLE public."order_items" TO "postgres";
GRANT SELECT  ON TABLE public."order_items" TO "postgres";
GRANT TRIGGER  ON TABLE public."order_items" TO "postgres";
GRANT TRUNCATE  ON TABLE public."order_items" TO "postgres";
GRANT UPDATE  ON TABLE public."order_items" TO "postgres";
GRANT DELETE  ON TABLE public."order_items" TO "anon";
GRANT INSERT  ON TABLE public."order_items" TO "anon";
GRANT MAINTAIN  ON TABLE public."order_items" TO "anon";
GRANT REFERENCES  ON TABLE public."order_items" TO "anon";
GRANT SELECT  ON TABLE public."order_items" TO "anon";
GRANT TRIGGER  ON TABLE public."order_items" TO "anon";
GRANT TRUNCATE  ON TABLE public."order_items" TO "anon";
GRANT UPDATE  ON TABLE public."order_items" TO "anon";
GRANT DELETE  ON TABLE public."order_items" TO "authenticated";
GRANT INSERT  ON TABLE public."order_items" TO "authenticated";
GRANT MAINTAIN  ON TABLE public."order_items" TO "authenticated";
GRANT REFERENCES  ON TABLE public."order_items" TO "authenticated";
GRANT SELECT  ON TABLE public."order_items" TO "authenticated";
GRANT TRIGGER  ON TABLE public."order_items" TO "authenticated";
GRANT TRUNCATE  ON TABLE public."order_items" TO "authenticated";
GRANT UPDATE  ON TABLE public."order_items" TO "authenticated";
GRANT DELETE  ON TABLE public."order_items" TO "service_role";
GRANT INSERT  ON TABLE public."order_items" TO "service_role";
GRANT MAINTAIN  ON TABLE public."order_items" TO "service_role";
GRANT REFERENCES  ON TABLE public."order_items" TO "service_role";
GRANT SELECT  ON TABLE public."order_items" TO "service_role";
GRANT TRIGGER  ON TABLE public."order_items" TO "service_role";
GRANT TRUNCATE  ON TABLE public."order_items" TO "service_role";
GRANT UPDATE  ON TABLE public."order_items" TO "service_role";
REVOKE ALL ("id") ON TABLE public."order_items" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("order_id") ON TABLE public."order_items" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("service_id") ON TABLE public."order_items" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("quantity") ON TABLE public."order_items" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("unit_price") ON TABLE public."order_items" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("note") ON TABLE public."order_items" FROM PUBLIC,"anon","authenticated","service_role";
ALTER TABLE public."order_status_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."order_status_history" NO FORCE ROW LEVEL SECURITY;
REVOKE ALL  ON TABLE public."order_status_history" FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT DELETE  ON TABLE public."order_status_history" TO "postgres";
GRANT INSERT  ON TABLE public."order_status_history" TO "postgres";
GRANT MAINTAIN  ON TABLE public."order_status_history" TO "postgres";
GRANT REFERENCES  ON TABLE public."order_status_history" TO "postgres";
GRANT SELECT  ON TABLE public."order_status_history" TO "postgres";
GRANT TRIGGER  ON TABLE public."order_status_history" TO "postgres";
GRANT TRUNCATE  ON TABLE public."order_status_history" TO "postgres";
GRANT UPDATE  ON TABLE public."order_status_history" TO "postgres";
GRANT DELETE  ON TABLE public."order_status_history" TO "anon";
GRANT INSERT  ON TABLE public."order_status_history" TO "anon";
GRANT MAINTAIN  ON TABLE public."order_status_history" TO "anon";
GRANT REFERENCES  ON TABLE public."order_status_history" TO "anon";
GRANT SELECT  ON TABLE public."order_status_history" TO "anon";
GRANT TRIGGER  ON TABLE public."order_status_history" TO "anon";
GRANT TRUNCATE  ON TABLE public."order_status_history" TO "anon";
GRANT UPDATE  ON TABLE public."order_status_history" TO "anon";
GRANT DELETE  ON TABLE public."order_status_history" TO "authenticated";
GRANT INSERT  ON TABLE public."order_status_history" TO "authenticated";
GRANT MAINTAIN  ON TABLE public."order_status_history" TO "authenticated";
GRANT REFERENCES  ON TABLE public."order_status_history" TO "authenticated";
GRANT SELECT  ON TABLE public."order_status_history" TO "authenticated";
GRANT TRIGGER  ON TABLE public."order_status_history" TO "authenticated";
GRANT TRUNCATE  ON TABLE public."order_status_history" TO "authenticated";
GRANT UPDATE  ON TABLE public."order_status_history" TO "authenticated";
GRANT DELETE  ON TABLE public."order_status_history" TO "service_role";
GRANT INSERT  ON TABLE public."order_status_history" TO "service_role";
GRANT MAINTAIN  ON TABLE public."order_status_history" TO "service_role";
GRANT REFERENCES  ON TABLE public."order_status_history" TO "service_role";
GRANT SELECT  ON TABLE public."order_status_history" TO "service_role";
GRANT TRIGGER  ON TABLE public."order_status_history" TO "service_role";
GRANT TRUNCATE  ON TABLE public."order_status_history" TO "service_role";
GRANT UPDATE  ON TABLE public."order_status_history" TO "service_role";
REVOKE ALL ("id") ON TABLE public."order_status_history" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("order_id") ON TABLE public."order_status_history" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("status") ON TABLE public."order_status_history" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("changed_by") ON TABLE public."order_status_history" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("changed_at") ON TABLE public."order_status_history" FROM PUBLIC,"anon","authenticated","service_role";
ALTER TABLE public."orders" DROP COLUMN "revision";
ALTER TABLE public."orders" DROP COLUMN "legacy_review_required";
ALTER TABLE public."orders" DROP COLUMN "is_synthetic";
ALTER TABLE public."orders" DROP COLUMN "ready_at";
ALTER TABLE public."orders" DROP COLUMN "delivered_at";
ALTER TABLE public."orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."orders" NO FORCE ROW LEVEL SECURITY;
REVOKE ALL  ON TABLE public."orders" FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT DELETE  ON TABLE public."orders" TO "postgres";
GRANT INSERT  ON TABLE public."orders" TO "postgres";
GRANT MAINTAIN  ON TABLE public."orders" TO "postgres";
GRANT REFERENCES  ON TABLE public."orders" TO "postgres";
GRANT SELECT  ON TABLE public."orders" TO "postgres";
GRANT TRIGGER  ON TABLE public."orders" TO "postgres";
GRANT TRUNCATE  ON TABLE public."orders" TO "postgres";
GRANT UPDATE  ON TABLE public."orders" TO "postgres";
GRANT DELETE  ON TABLE public."orders" TO "anon";
GRANT INSERT  ON TABLE public."orders" TO "anon";
GRANT MAINTAIN  ON TABLE public."orders" TO "anon";
GRANT REFERENCES  ON TABLE public."orders" TO "anon";
GRANT SELECT  ON TABLE public."orders" TO "anon";
GRANT TRIGGER  ON TABLE public."orders" TO "anon";
GRANT TRUNCATE  ON TABLE public."orders" TO "anon";
GRANT UPDATE  ON TABLE public."orders" TO "anon";
GRANT DELETE  ON TABLE public."orders" TO "authenticated";
GRANT INSERT  ON TABLE public."orders" TO "authenticated";
GRANT MAINTAIN  ON TABLE public."orders" TO "authenticated";
GRANT REFERENCES  ON TABLE public."orders" TO "authenticated";
GRANT SELECT  ON TABLE public."orders" TO "authenticated";
GRANT TRIGGER  ON TABLE public."orders" TO "authenticated";
GRANT TRUNCATE  ON TABLE public."orders" TO "authenticated";
GRANT UPDATE  ON TABLE public."orders" TO "authenticated";
GRANT DELETE  ON TABLE public."orders" TO "service_role";
GRANT INSERT  ON TABLE public."orders" TO "service_role";
GRANT MAINTAIN  ON TABLE public."orders" TO "service_role";
GRANT REFERENCES  ON TABLE public."orders" TO "service_role";
GRANT SELECT  ON TABLE public."orders" TO "service_role";
GRANT TRIGGER  ON TABLE public."orders" TO "service_role";
GRANT TRUNCATE  ON TABLE public."orders" TO "service_role";
GRANT UPDATE  ON TABLE public."orders" TO "service_role";
REVOKE ALL ("id") ON TABLE public."orders" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("code") ON TABLE public."orders" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("customer_id") ON TABLE public."orders" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("customer_name") ON TABLE public."orders" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("customer_phone") ON TABLE public."orders" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("pickup_address") ON TABLE public."orders" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("pickup_time") ON TABLE public."orders" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("delivery_time") ON TABLE public."orders" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("status") ON TABLE public."orders" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("total") ON TABLE public."orders" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("payment_method") ON TABLE public."orders" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("note") ON TABLE public."orders" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("created_at") ON TABLE public."orders" FROM PUBLIC,"anon","authenticated","service_role";
ALTER TABLE public."profiles" DROP COLUMN "is_active";
ALTER TABLE public."profiles" DROP COLUMN "revision";
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_role_check" CHECK ((role = ANY (ARRAY['customer'::text, 'admin'::text])));
ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."profiles" NO FORCE ROW LEVEL SECURITY;
REVOKE ALL  ON TABLE public."profiles" FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT DELETE  ON TABLE public."profiles" TO "postgres";
GRANT INSERT  ON TABLE public."profiles" TO "postgres";
GRANT MAINTAIN  ON TABLE public."profiles" TO "postgres";
GRANT REFERENCES  ON TABLE public."profiles" TO "postgres";
GRANT SELECT  ON TABLE public."profiles" TO "postgres";
GRANT TRIGGER  ON TABLE public."profiles" TO "postgres";
GRANT TRUNCATE  ON TABLE public."profiles" TO "postgres";
GRANT UPDATE  ON TABLE public."profiles" TO "postgres";
GRANT DELETE  ON TABLE public."profiles" TO "anon";
GRANT INSERT  ON TABLE public."profiles" TO "anon";
GRANT MAINTAIN  ON TABLE public."profiles" TO "anon";
GRANT REFERENCES  ON TABLE public."profiles" TO "anon";
GRANT SELECT  ON TABLE public."profiles" TO "anon";
GRANT TRIGGER  ON TABLE public."profiles" TO "anon";
GRANT TRUNCATE  ON TABLE public."profiles" TO "anon";
GRANT UPDATE  ON TABLE public."profiles" TO "anon";
GRANT DELETE  ON TABLE public."profiles" TO "authenticated";
GRANT INSERT  ON TABLE public."profiles" TO "authenticated";
GRANT MAINTAIN  ON TABLE public."profiles" TO "authenticated";
GRANT REFERENCES  ON TABLE public."profiles" TO "authenticated";
GRANT SELECT  ON TABLE public."profiles" TO "authenticated";
GRANT TRIGGER  ON TABLE public."profiles" TO "authenticated";
GRANT TRUNCATE  ON TABLE public."profiles" TO "authenticated";
GRANT UPDATE  ON TABLE public."profiles" TO "authenticated";
GRANT DELETE  ON TABLE public."profiles" TO "service_role";
GRANT INSERT  ON TABLE public."profiles" TO "service_role";
GRANT MAINTAIN  ON TABLE public."profiles" TO "service_role";
GRANT REFERENCES  ON TABLE public."profiles" TO "service_role";
GRANT SELECT  ON TABLE public."profiles" TO "service_role";
GRANT TRIGGER  ON TABLE public."profiles" TO "service_role";
GRANT TRUNCATE  ON TABLE public."profiles" TO "service_role";
GRANT UPDATE  ON TABLE public."profiles" TO "service_role";
REVOKE ALL ("id") ON TABLE public."profiles" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("full_name") ON TABLE public."profiles" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("phone") ON TABLE public."profiles" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("address") ON TABLE public."profiles" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("role") ON TABLE public."profiles" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("created_at") ON TABLE public."profiles" FROM PUBLIC,"anon","authenticated","service_role";
ALTER TABLE public."service_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."service_categories" NO FORCE ROW LEVEL SECURITY;
REVOKE ALL  ON TABLE public."service_categories" FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT DELETE  ON TABLE public."service_categories" TO "postgres";
GRANT INSERT  ON TABLE public."service_categories" TO "postgres";
GRANT MAINTAIN  ON TABLE public."service_categories" TO "postgres";
GRANT REFERENCES  ON TABLE public."service_categories" TO "postgres";
GRANT SELECT  ON TABLE public."service_categories" TO "postgres";
GRANT TRIGGER  ON TABLE public."service_categories" TO "postgres";
GRANT TRUNCATE  ON TABLE public."service_categories" TO "postgres";
GRANT UPDATE  ON TABLE public."service_categories" TO "postgres";
GRANT DELETE  ON TABLE public."service_categories" TO "anon";
GRANT INSERT  ON TABLE public."service_categories" TO "anon";
GRANT MAINTAIN  ON TABLE public."service_categories" TO "anon";
GRANT REFERENCES  ON TABLE public."service_categories" TO "anon";
GRANT SELECT  ON TABLE public."service_categories" TO "anon";
GRANT TRIGGER  ON TABLE public."service_categories" TO "anon";
GRANT TRUNCATE  ON TABLE public."service_categories" TO "anon";
GRANT UPDATE  ON TABLE public."service_categories" TO "anon";
GRANT DELETE  ON TABLE public."service_categories" TO "authenticated";
GRANT INSERT  ON TABLE public."service_categories" TO "authenticated";
GRANT MAINTAIN  ON TABLE public."service_categories" TO "authenticated";
GRANT REFERENCES  ON TABLE public."service_categories" TO "authenticated";
GRANT SELECT  ON TABLE public."service_categories" TO "authenticated";
GRANT TRIGGER  ON TABLE public."service_categories" TO "authenticated";
GRANT TRUNCATE  ON TABLE public."service_categories" TO "authenticated";
GRANT UPDATE  ON TABLE public."service_categories" TO "authenticated";
GRANT DELETE  ON TABLE public."service_categories" TO "service_role";
GRANT INSERT  ON TABLE public."service_categories" TO "service_role";
GRANT MAINTAIN  ON TABLE public."service_categories" TO "service_role";
GRANT REFERENCES  ON TABLE public."service_categories" TO "service_role";
GRANT SELECT  ON TABLE public."service_categories" TO "service_role";
GRANT TRIGGER  ON TABLE public."service_categories" TO "service_role";
GRANT TRUNCATE  ON TABLE public."service_categories" TO "service_role";
GRANT UPDATE  ON TABLE public."service_categories" TO "service_role";
REVOKE ALL ("id") ON TABLE public."service_categories" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("name") ON TABLE public."service_categories" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("slug") ON TABLE public."service_categories" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("description") ON TABLE public."service_categories" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("sort_order") ON TABLE public."service_categories" FROM PUBLIC,"anon","authenticated","service_role";
ALTER TABLE public."services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."services" NO FORCE ROW LEVEL SECURITY;
REVOKE ALL  ON TABLE public."services" FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT DELETE  ON TABLE public."services" TO "postgres";
GRANT INSERT  ON TABLE public."services" TO "postgres";
GRANT MAINTAIN  ON TABLE public."services" TO "postgres";
GRANT REFERENCES  ON TABLE public."services" TO "postgres";
GRANT SELECT  ON TABLE public."services" TO "postgres";
GRANT TRIGGER  ON TABLE public."services" TO "postgres";
GRANT TRUNCATE  ON TABLE public."services" TO "postgres";
GRANT UPDATE  ON TABLE public."services" TO "postgres";
GRANT DELETE  ON TABLE public."services" TO "anon";
GRANT INSERT  ON TABLE public."services" TO "anon";
GRANT MAINTAIN  ON TABLE public."services" TO "anon";
GRANT REFERENCES  ON TABLE public."services" TO "anon";
GRANT SELECT  ON TABLE public."services" TO "anon";
GRANT TRIGGER  ON TABLE public."services" TO "anon";
GRANT TRUNCATE  ON TABLE public."services" TO "anon";
GRANT UPDATE  ON TABLE public."services" TO "anon";
GRANT DELETE  ON TABLE public."services" TO "authenticated";
GRANT INSERT  ON TABLE public."services" TO "authenticated";
GRANT MAINTAIN  ON TABLE public."services" TO "authenticated";
GRANT REFERENCES  ON TABLE public."services" TO "authenticated";
GRANT SELECT  ON TABLE public."services" TO "authenticated";
GRANT TRIGGER  ON TABLE public."services" TO "authenticated";
GRANT TRUNCATE  ON TABLE public."services" TO "authenticated";
GRANT UPDATE  ON TABLE public."services" TO "authenticated";
GRANT DELETE  ON TABLE public."services" TO "service_role";
GRANT INSERT  ON TABLE public."services" TO "service_role";
GRANT MAINTAIN  ON TABLE public."services" TO "service_role";
GRANT REFERENCES  ON TABLE public."services" TO "service_role";
GRANT SELECT  ON TABLE public."services" TO "service_role";
GRANT TRIGGER  ON TABLE public."services" TO "service_role";
GRANT TRUNCATE  ON TABLE public."services" TO "service_role";
GRANT UPDATE  ON TABLE public."services" TO "service_role";
REVOKE ALL ("id") ON TABLE public."services" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("category_id") ON TABLE public."services" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("name") ON TABLE public."services" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("unit") ON TABLE public."services" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("price") ON TABLE public."services" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("est_hours") ON TABLE public."services" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL ("is_active") ON TABLE public."services" FROM PUBLIC,"anon","authenticated","service_role";
REVOKE ALL  ON FUNCTION public.create_guest_order(p_name text, p_phone text, p_address text, p_pickup timestamp with time zone, p_payment payment_method, p_note text, p_items jsonb) FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE  ON FUNCTION public.create_guest_order(p_name text, p_phone text, p_address text, p_pickup timestamp with time zone, p_payment payment_method, p_note text, p_items jsonb) TO "postgres";
GRANT EXECUTE  ON FUNCTION public.create_guest_order(p_name text, p_phone text, p_address text, p_pickup timestamp with time zone, p_payment payment_method, p_note text, p_items jsonb) TO "service_role";
REVOKE ALL  ON FUNCTION public.log_order_status() FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE  ON FUNCTION public.log_order_status() TO PUBLIC;
GRANT EXECUTE  ON FUNCTION public.log_order_status() TO "postgres";
GRANT EXECUTE  ON FUNCTION public.log_order_status() TO "anon";
GRANT EXECUTE  ON FUNCTION public.log_order_status() TO "authenticated";
GRANT EXECUTE  ON FUNCTION public.log_order_status() TO "service_role";
REVOKE ALL  ON FUNCTION public.update_admin_order(p_id uuid, p_expected order_status, p_next order_status, p_actor uuid) FROM PUBLIC,"anon","authenticated","service_role","postgres";
GRANT EXECUTE  ON FUNCTION public.update_admin_order(p_id uuid, p_expected order_status, p_next order_status, p_actor uuid) TO "postgres";
GRANT EXECUTE  ON FUNCTION public.update_admin_order(p_id uuid, p_expected order_status, p_next order_status, p_actor uuid) TO "service_role";
DROP SCHEMA app_private;
COMMIT;
