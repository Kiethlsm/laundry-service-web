# PIPELINE: Website Giặt Sấy (Demo CV)

> Đọc toàn bộ quy trình trước khi sửa mã. Thực hiện lần lượt từng giai đoạn và đánh dấu `[x]` khi hoàn tất.

## 0. Mục tiêu & nguyên tắc

**Mục tiêu:** Web demo cho một tiệm giặt ủi, deploy trên Vercel, dùng để đưa vào CV.

**Dịch vụ cần có (6 nhóm):**

1. Giặt sấy (quần áo)
2. Giặt giày
3. Giặt mền / chăn
4. Ủi đồ
5. Sửa đồ
6. Giặt gấu bông

**Nguyên tắc BẮT BUỘC:**

- Làm ĐƠN GIẢN. Đây là demo, không phải production app. Không over-engineer.
- KHÔNG thêm: thanh toán online, thông báo realtime, đa ngôn ngữ, test tự động, Docker, state management library, ORM nặng.
- Khách KHÔNG cần đăng ký tài khoản (đặt đơn dạng guest: tên + SĐT). Chỉ admin cần đăng nhập.
- Giao diện tiếng Việt. Mobile-first, responsive.
- Code TypeScript, ít file, dễ đọc. Comment ngắn gọn ở chỗ logic quan trọng.
- Tiền tệ VND, hiển thị dạng `25.000đ`.

## 1. Tech stack

| Thành phần      | Công nghệ                                     |
| --------------- | --------------------------------------------- |
| Framework       | Next.js (App Router) + TypeScript             |
| UI              | Tailwind CSS (không cần thư viện UI)          |
| Database + Auth | Supabase (Postgres + Supabase Auth cho admin) |
| Client DB       | `@supabase/supabase-js`, `@supabase/ssr`      |
| Hosting         | Vercel (nối GitHub, push là tự deploy)        |

## 2. Cấu trúc thư mục

```
/
├─ app/
│  ├─ page.tsx                  # Trang chủ
│  ├─ bang-gia/page.tsx         # Bảng giá theo nhóm
│  ├─ dat-lich/page.tsx         # Form đặt lịch lấy đồ
│  ├─ tra-cuu/page.tsx          # Tra cứu đơn (mã đơn + SĐT)
│  ├─ admin/
│  │  ├─ login/page.tsx
│  │  ├─ page.tsx               # Danh sách đơn
│  │  └─ orders/[id]/page.tsx   # Chi tiết + đổi trạng thái
│  ├─ api/
│  │  ├─ orders/route.ts        # POST: tạo đơn (guest)
│  │  └─ track/route.ts         # POST: tra cứu đơn
│  └─ layout.tsx
├─ lib/
│  ├─ supabase-server.ts        # client dùng service role (chỉ server)
│  ├─ supabase-browser.ts       # client dùng anon key
│  └─ format.ts                 # formatVND, formatDate, STATUS_LABEL
├─ supabase/
│  └─ schema.sql                # toàn bộ SQL ở mục 4
├─ .env.local.example
└─ README.md
```

## 3. Biến môi trường

`.env.local` (không commit) và thêm y hệt trên Vercel → Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # CHỈ dùng ở server, tuyệt đối không để lộ ra client
```

Tạo sẵn file `.env.local.example` với 3 key trên (để trống giá trị).

## 4. Database (Supabase / Postgres)

### 4.1 Sơ đồ quan hệ

```
service_categories 1───n services
services           1───n order_items
orders             1───n order_items
orders             1───n order_status_history
profiles (admin)   1───n orders        (customer_id, có thể NULL vì khách guest)
```

### 4.2 Trạng thái đơn

`pending (chờ lấy đồ) → picked_up (đã lấy) → processing (đang xử lý) → ready (sẵn sàng giao) → delivered (đã giao)`
Có thể chuyển `cancelled` khi đơn còn ở `pending` hoặc `picked_up`.

### 4.3 File `supabase/schema.sql`

Tạo file này với nội dung dưới đây, sau đó chạy trong Supabase → SQL Editor.

```sql
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
```

### 4.4 Tạo tài khoản admin

1. Supabase → Authentication → Users → Add user (email + mật khẩu).
2. Chạy SQL (thay `<USER_ID>` bằng id vừa tạo):

```sql
insert into profiles (id, full_name, role) values ('<USER_ID>', 'Admin', 'admin');
```

## 5. Chức năng từng trang

### 5.1 Trang chủ `/`

- Hero: tên tiệm (tên giả, ví dụ "Giặt Ủi Sạch Sạch"), slogan, nút "Đặt lịch ngay" và "Xem bảng giá".
- Lưới 6 thẻ dịch vụ (icon emoji + tên + mô tả ngắn), đọc từ `service_categories`.
- Mục "Quy trình 4 bước": Đặt lịch → Lấy đồ → Xử lý → Giao tận nơi.
- Footer: giờ mở cửa, SĐT, địa chỉ (dữ liệu giả).

### 5.2 Bảng giá `/bang-gia`

- Đọc `service_categories` + `services`, hiển thị theo nhóm, mỗi dòng: tên dịch vụ, đơn vị, giá, thời gian dự kiến.
- Server Component, không cần JS phía client.

### 5.3 Đặt lịch `/dat-lich`

- Form: họ tên, SĐT, địa chỉ lấy đồ, thời gian lấy đồ (datetime-local), phương thức thanh toán, ghi chú.
- Chọn dịch vụ: danh sách services, mỗi dòng có ô nhập số lượng (mặc định 0). Hiển thị tạm tính phía client.
- Submit → `POST /api/orders`:
  - Validate: tên, SĐT (regex VN `^0\d{9}$`), địa chỉ không rỗng, có ít nhất 1 dịch vụ quantity > 0.
  - Server lấy giá từ DB theo `service_id` (KHÔNG tin giá client gửi lên), tính `total`.
  - Insert `orders` rồi `order_items` (dùng `unit_price` = giá hiện tại).
  - Trả về `code` đơn.
- Sau khi tạo thành công: hiện màn hình xác nhận với mã đơn lớn + link sang `/tra-cuu`.

### 5.4 Tra cứu `/tra-cuu`

- Form: mã đơn + SĐT. Submit → `POST /api/track`.
- API chỉ trả đơn khi khớp CẢ mã đơn VÀ SĐT.
- Hiển thị: thông tin đơn, danh sách items, tổng tiền, timeline trạng thái từ `order_status_history`.

### 5.5 Admin `/admin`

- `/admin/login`: email + mật khẩu qua Supabase Auth.
- Mọi route `/admin/*` (trừ login) kiểm tra: đã đăng nhập VÀ `profiles.role = 'admin'`, nếu không redirect về login. Làm bằng middleware hoặc check trong server component.
- `/admin`: bảng danh sách đơn (mã, tên khách, SĐT, tổng, trạng thái, ngày tạo), lọc theo trạng thái, tìm theo mã/SĐT.
- `/admin/orders/[id]`: xem chi tiết, dropdown đổi trạng thái (chỉ cho phép chuyển theo thứ tự hợp lệ ở mục 4.2) và nút Hủy đơn. Khi đổi trạng thái, lịch sử tự ghi nhờ trigger, ghi thêm `changed_by` nếu làm được đơn giản.

## 6. Các Phase thực hiện

### Phase 1: Khởi tạo

- [x] `npx create-next-app@latest` (TypeScript, Tailwind, App Router, không src dir)
- [x] Cài `@supabase/supabase-js @supabase/ssr`
- [x] Tạo `.env.local.example`, `.gitignore` đã có `.env.local`
- [x] Tạo `lib/format.ts` (formatVND, STATUS_LABEL tiếng Việt)

### Phase 2: Database

- [x] Tạo `supabase/schema.sql` đúng như mục 4.3
- [ ] (Người dùng tự chạy trên Supabase SQL Editor và tạo admin theo 4.4)
- [x] Tạo `lib/supabase-server.ts` và `lib/supabase-browser.ts`

### Phase 3: Trang khách

- [x] Layout chung (header menu: Trang chủ, Bảng giá, Đặt lịch, Tra cứu, footer)
- [x] Trang chủ
- [x] Bảng giá
- [x] Đặt lịch + `api/orders`
- [x] Tra cứu + `api/track`

### Phase 4: Admin

- [x] Login + bảo vệ route
- [x] Danh sách đơn + lọc
- [x] Chi tiết đơn + đổi trạng thái

### Phase 5: Kiểm thử thủ công

- [ ] Đặt 1 đơn gồm nhiều nhóm dịch vụ, kiểm tra `total` đúng
- [ ] Tra cứu đúng mã + đúng SĐT thì thấy đơn, sai SĐT thì không thấy
- [ ] Admin đổi trạng thái, timeline ở trang tra cứu cập nhật
- [x] Thử vào `/admin` khi chưa đăng nhập → bị chuyển về login
- [x] Xem trên màn hình điện thoại (Chromium viewport 390px, chưa thử thiết bị thật)

### Phase 6: Deploy Vercel

- [ ] Push code lên GitHub
- [ ] Vercel → Add New Project → import repo
- [ ] Thêm 3 biến môi trường ở mục 3
- [ ] Deploy, test lại toàn bộ luồng trên domain `*.vercel.app`
- [ ] Supabase → Authentication → URL Configuration: thêm domain Vercel vào Site URL

### Phase 7: Hoàn thiện cho CV

- [ ] README: mô tả dự án, tech stack, link demo, 3-4 ảnh chụp màn hình, sơ đồ ERD (đã có nội dung, 4 ảnh và ERD, còn link thật)
- [ ] Ghi tài khoản admin demo trong README (email + mật khẩu demo, KHÔNG dùng mật khẩu thật)
- [ ] Đặt tên repo rõ ràng, ví dụ `laundry-service-web` (package đã mang tên này, chưa có remote)

### Ghi nhận triển khai 17/10/2026

Người dùng đã chọn bàn giao bản cục bộ và hướng dẫn vì chưa có cấu hình Supabase/GitHub/Vercel. Các checkbox triển khai bên ngoài được giữ để dùng khi thiết lập sau này.

Đã hoàn thiện mã nguồn Phase 1–4, thêm `supabase/functions.sql` để ghi đơn nguyên tử, tính giá từ DB và kiểm soát chuyển trạng thái. Build/TypeScript thành công, đã xem UI 1440px/390px và chạy SQL trên PostgreSQL cục bộ tạm thời. Chi tiết: `docs/VERIFICATION.md`.

Supabase, admin thật, kiểm thử tích hợp API/Auth, GitHub và Vercel chưa được tick vì chưa có cấu hình/tài khoản. README có tài khoản demo đề xuất, không khẳng định đã tồn tại. Chưa đạt Definition of Done online cho đến khi hoàn thành các bước này.

## 7. Định nghĩa hoàn thành (Definition of Done)

- Khách đặt được đơn không cần đăng nhập, nhận được mã đơn.
- Khách tra cứu được tiến độ bằng mã + SĐT.
- Admin xem và cập nhật được trạng thái đơn.
- Tổng tiền luôn do server tính từ giá trong DB.
- Chạy ổn trên Vercel, dùng được trên điện thoại.
- README đủ để nhà tuyển dụng hiểu dự án trong 1 phút.
