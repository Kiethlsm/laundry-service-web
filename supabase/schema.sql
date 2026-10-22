-- ========== ENUMS ==========
create type order_status as enum
  ('pending','picked_up','processing','ready','delivered','cancelled');

create type payment_method as enum ('cash','bank_transfer');

-- ========== TABLES ==========

-- Chỉ dùng cho admin (liên kết Supabase Auth)
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  address     text,
  role        text not null default 'customer' check (role in ('customer','admin')),
  created_at  timestamptz not null default now()
);

create table service_categories (
  id          serial primary key,
  name        text not null,
  slug        text not null unique,
  description text,
  sort_order  int  not null default 0
);

create table services (
  id           serial primary key,
  category_id  int not null references service_categories(id) on delete cascade,
  name         text not null,
  unit         text not null check (unit in ('kg','cai','doi','bo')),
  price        numeric(12,0) not null check (price >= 0),
  est_hours    int not null default 48,
  is_active    boolean not null default true
);

create sequence order_code_seq start 1001;

create table orders (
  id              uuid primary key default gen_random_uuid(),
  code            text not null unique default ('LD' || nextval('order_code_seq')),
  customer_id     uuid references profiles(id),          -- NULL nếu khách guest
  customer_name   text not null,
  customer_phone  text not null,
  pickup_address  text not null,
  pickup_time     timestamptz,
  delivery_time   timestamptz,
  status          order_status not null default 'pending',
  total           numeric(12,0) not null default 0,
  payment_method  payment_method not null default 'cash',
  note            text,
  created_at      timestamptz not null default now()
);

create table order_items (
  id          serial primary key,
  order_id    uuid not null references orders(id) on delete cascade,
  service_id  int  not null references services(id),
  quantity    numeric(8,2) not null check (quantity > 0),
  unit_price  numeric(12,0) not null,                    -- giá tại thời điểm đặt
  note        text
);

create table order_status_history (
  id          serial primary key,
  order_id    uuid not null references orders(id) on delete cascade,
  status      order_status not null,
  changed_by  uuid references profiles(id),              -- NULL nếu hệ thống tự ghi
  changed_at  timestamptz not null default now()
);

-- ========== INDEXES ==========
create index idx_services_category   on services(category_id);
create index idx_orders_status       on orders(status);
create index idx_orders_phone        on orders(customer_phone);
create index idx_order_items_order   on order_items(order_id);
create index idx_history_order       on order_status_history(order_id);

-- ========== TRIGGER: tự ghi lịch sử trạng thái ==========
create or replace function log_order_status() returns trigger as $$
begin
  if (tg_op = 'INSERT') or (new.status is distinct from old.status) then
    insert into order_status_history(order_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_order_status
after insert or update of status on orders
for each row execute function log_order_status();

-- ========== RLS ==========
-- Nguyên tắc: public chỉ ĐỌC bảng giá. Mọi thao tác khác đi qua API route
-- dùng service role key (bypass RLS), nên không cần policy khác.
alter table profiles              enable row level security;
alter table service_categories    enable row level security;
alter table services              enable row level security;
alter table orders                enable row level security;
alter table order_items           enable row level security;
alter table order_status_history  enable row level security;

create policy "public read categories" on service_categories for select using (true);
create policy "public read services"   on services for select using (is_active = true);

-- ========== SEED ==========
insert into service_categories (name, slug, description, sort_order) values
 ('Giặt sấy',      'giat-say',   'Giặt sấy quần áo theo ký',            1),
 ('Giặt giày',     'giat-giay',  'Vệ sinh giày sneaker, giày da, giày vải', 2),
 ('Giặt mền chăn', 'giat-men',   'Giặt mền, chăn, drap, gối',            3),
 ('Ủi đồ',         'ui-do',      'Ủi quần áo, áo dài, vest',             4),
 ('Sửa đồ',        'sua-do',     'Sửa quần áo: lên lai, thay khóa, vá',  5),
 ('Giặt gấu bông', 'giat-gau-bong', 'Giặt và làm sạch thú bông',         6);

insert into services (category_id, name, unit, price, est_hours) values
 (1, 'Giặt sấy thường',          'kg',  25000, 24),
 (1, 'Giặt sấy lấy nhanh',       'kg',  35000, 8),
 (2, 'Giặt giày sneaker/vải',    'doi', 80000, 48),
 (2, 'Giặt giày da',             'doi', 120000, 72),
 (3, 'Giặt mền/chăn đơn',        'cai', 90000, 48),
 (3, 'Giặt mền/chăn đôi',        'cai', 130000, 48),
 (3, 'Giặt bộ drap + gối',       'bo',  70000, 48),
 (4, 'Ủi quần áo thường',        'cai', 10000, 24),
 (4, 'Ủi vest / áo dài',         'cai', 40000, 24),
 (5, 'Lên lai quần/váy',         'cai', 30000, 72),
 (5, 'Thay khóa kéo',            'cai', 50000, 72),
 (5, 'Vá / may đồ',              'cai', 40000, 72),
 (6, 'Gấu bông nhỏ (< 30cm)',    'cai', 50000, 72),
 (6, 'Gấu bông vừa (30-60cm)',   'cai', 90000, 72),
 (6, 'Gấu bông lớn (> 60cm)',    'cai', 150000, 96);