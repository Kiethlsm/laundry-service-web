-- Run AFTER schema.sql. Atomic writes: an order and its items succeed together.
create or replace function create_guest_order(
  p_name text, p_phone text, p_address text, p_pickup timestamptz,
  p_payment payment_method, p_note text, p_items jsonb
) returns jsonb
language plpgsql security definer set search_path = public as $$
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
$$;

create or replace function update_admin_order(p_id uuid, p_expected order_status, p_next order_status, p_actor uuid)
returns void language plpgsql security definer set search_path = public as $$
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
$$;

-- SECURITY DEFINER functions must never be callable by public / authenticated clients.
revoke all on function create_guest_order(text,text,text,timestamptz,payment_method,text,jsonb) from public, anon, authenticated;
revoke all on function update_admin_order(uuid,order_status,order_status,uuid) from public, anon, authenticated;
grant execute on function create_guest_order(text,text,text,timestamptz,payment_method,text,jsonb) to service_role;
grant execute on function update_admin_order(uuid,order_status,order_status,uuid) to service_role;
