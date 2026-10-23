# Sạch Sạch · Portfolio laundry demo

Next.js App Router, TypeScript, React and Supabase Postgres/Auth. Nhánh cục bộ `feat/portfolio-phase-01` triển khai đường minimal demo của [pipeline v1.2](FULL_SCOPE_PIPELINE.md): phân quyền có kiểm thử, báo giá theo phiên bản và sổ thanh toán bất biến. Giao diện giữ thiết kế Sạch Sạch hiện có.

**Chưa push, merge, deploy hoặc áp dụng migration lên hosted.** Production vẫn dùng code/schema cũ. Nhánh này cần schema mới nên không được trỏ vào hosted hiện tại để thử. Xem [phụ thuộc triển khai](docs/DEPLOYMENT-DEPENDENCIES.md).

## Chạy demo hoàn toàn cục bộ

Yêu cầu Node 24, `npm ci`, Docker Desktop và container PostgreSQL 17.11 đã có nhãn kiểm thử. Không thêm package hay tải trình duyệt. Chi tiết điều kiện và giới hạn trong [hướng dẫn demo](docs/portfolio/DEMO.md).

```powershell
npm run demo:local
```

Mở URL loopback được in ra. Lệnh tạo database fixture riêng, dùng Auth adapter mô phỏng và chạy ứng dụng Next thật. Không sửa `.env.local`, không dùng hosted. Tài khoản **chỉ dành cho adapter cục bộ**: `demo.admin@example.invalid` / `portfolio-demo-only`. Không nhập dữ liệu khách thật. Ctrl+C đóng các tiến trình của phiên demo; database cục bộ được giữ để kiểm tra.

## Phần đã làm

- Đặt lịch idempotent, giá từ SQL, báo giá v0 bất biến và xác nhận demo. Dung sai từng dòng kg là ±10% hoặc ±0,3 kg, lấy mức lớn hơn so với v0; vượt ngưỡng cần phiên mới.
- Nhận túi có nhãn, ghi riêng món giá trị cao/có vấn đề, bằng chứng mô phỏng, phiên chốt tiền và xử lý/QC gắn với phiên báo giá.
- Sổ thu/hoàn/đảo bút toán bất biến; trạng thái thanh toán suy ra từ tổng bút toán. Giao đồ và thu tiền là một transaction, không có cập nhật “đã trả” bằng tay.
- RLS, vai trò đang hoạt động và phân công được kiểm tra tại SQL. Ma trận 170 ô quyền cùng kiểm thử trạng thái, cạnh tranh, rollback và retry.
- Kiểm thử trình duyệt đặt lịch và quản trị, kiểm tra quyền mặc định kiểu hosted trên PG 17.11, CI definition và gate tích lũy. Remote CI chưa chạy.

Mọi khoản tiền và xác nhận khách/người nhận đều là **mô phỏng**. Không có thanh toán ngân hàng thật, SMS/Zalo/email thật, upload ảnh, cron, vận hành tiệm thật hay chứng nhận tuân thủ. Nhãn theo túi không chứng minh được từng món không gắn nhãn. Các phase tùy chọn 04/06/07/08 và editor/slot không được chọn.

Nhánh `feat/manual-transfer-qr` bổ sung QR Techcombank do người dùng cung cấp: hiện khi chọn chuyển khoản, sau đặt lịch và trong chi tiết quản trị. Có sao chép tài khoản/nội dung theo mã đơn và tải PNG. QR không tự xác nhận tiền; sổ hiện tại vẫn mô phỏng. Chạy gate mới bằng `npm run check:phase -- QR`; [bằng chứng và giới hạn](docs/verification/manual-qr/README.md).

## Kiểm tra và bàn giao

```powershell
npm run check:phase -- P10
npm test
```

Gate chạy lint, typecheck, toàn bộ kiểm thử tích lũy và production build. Thiếu hoặc skip test bắt buộc làm gate thất bại. Kiểm thử SQL chỉ chấp nhận container có nhãn và database fixture; không nhận URL hosted. Kiểm thử browser dùng Brave cài sẵn trên Windows hoặc Chrome/Chromium trên Linux.

| Tài liệu | Nội dung |
|---|---|
| [Demo và checklist trình duyệt](docs/portfolio/DEMO.md) | Cách chạy, thao tác từ đặt lịch đến giao đồ, giới hạn mô phỏng |
| [Manifest](docs/portfolio/release.json) | Commit/gate các phase trước, test bắt buộc, phạm vi đã chọn |
| [Log đầy đủ](docs/verification/continuous) | Red/green và đầu ra thực tế theo phase |
| [Kế hoạch hosted](docs/portfolio/HOSTED-APPLY.md) | Thứ tự migration, rollback cục bộ, điều kiện cần duyệt trước hosted |
| [Ma trận quyền](docs/verification/continuous/P01) | 170/170 ô cùng kiểm tra null/unknown và mặc định quyền |

Không chạy `supabase/schema.sql` hoặc `functions.sql` lên hosted để nâng cấp. Chúng chỉ là baseline cho database kiểm thử mới. Các SQL rollback trong `docs/portfolio/rollback-local` bị khóa theo database fixture và không dùng được cho hosted; triển khai sau này phải có export mới và rollback từ đúng snapshot đó.

Hobby chỉ dành cho mục đích phi thương mại; Supabase Free có thể tạm dừng khi không hoạt động. [Giới hạn và nguồn](docs/pipeline-v1.2/infrastructure.md). Chưa có URL triển khai cho nhánh demo mới này. Mã nguồn hiện có trên GitHub là phiên bản đã push trước đây, không bao gồm các commit cục bộ trong đợt này.
