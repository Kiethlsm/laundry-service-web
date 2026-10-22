# Xác minh thủ công · 17/10/2026

Phạm vi bàn giao đã được người dùng xác nhận: bản cục bộ và hướng dẫn cấu hình/triển khai sau, do hiện chưa có tài khoản dịch vụ.

## Đã thực hiện cục bộ

- Production build và TypeScript thành công.
- Chromium 1440 × 1000 và 390 × 844: trang chủ, bảng giá, đặt lịch, tra cứu, đăng nhập; ảnh full-page tại `docs/screenshots/` và `.impeccable/review/`.
- Không thấy lỗi JavaScript/tràn ngang. Menu mobile mở/đóng; bộ chọn dịch vụ cập nhật giá/thời gian và link nhóm.
- Chọn 2,5kg giặt sấy + 1 đôi sneaker: `142.500đ`, giữ lựa chọn khi chuyển nhóm.
- Thiếu cấu hình: nút gửi bị khóa; gọi API orders/track trả 503 với thông báo; không lưu đơn giả vào localStorage hoặc bộ nhớ.
- `/admin` và `/admin/orders/<uuid>` không có phiên chuyển về login. Next.js có thể gửi HTTP 200 trong streaming trước khi redirect; không có dữ liệu admin trong nội dung đó.
- Detector Impeccable chạy một lần: không có finding cơ học.
- Rà soát Impeccable độc lập: đã sửa và xác nhận đủ 3 finding về tracking logo, icon phụ trợ và lời nhắn preview. Kết luận `ship` chỉ cho danh sách chỉnh sửa này; không thay thế kiểm tra Auth/DB thật.
- Production audit: 0 vulnerability; dev audit còn 5 high từ braces, ghi trong README.

## SQL trên PostgreSQL cục bộ tạm thời

Chạy thủ công qua PGlite ngoài repository; không thêm bộ test tự động hay dependency DB khác vào app.

| Thao tác                                             | Kết quả                                              |
| ---------------------------------------------------- | ---------------------------------------------------- |
| Nạp nguyên schema.sql và functions.sql               | Thành công, 6 nhóm/15 dịch vụ                        |
| 2,5kg thường + 1 đôi sneaker + 2 gấu nhỏ             | LD1001, 242.500đ, 3 dòng unit_price từ DB            |
| Đúng mã + đúng SĐT                                   | 1 kết quả                                            |
| Đúng mã + sai SĐT                                    | 0 kết quả                                            |
| pending → picked_up → processing → ready → delivered | 5 mốc; changed_by ở 4 bước admin                     |
| processing → pending hoặc cancelled                  | INVALID_TRANSITION                                   |
| Dịch vụ hợp lệ + service_id không tồn tại            | SERVICE_UNAVAILABLE, rollback toàn đơn, số đơn vẫn 1 |
| RPC của anon/authenticated                           | execute = false                                      |

## Lần thử CSS 3D trước đây (đã thay thế sau phản hồi người dùng)

- Production build/TypeScript thành công sau khi thêm `app/home.css` và scene cuộn.
- Ma trận CSS 3D của máy giặt thay đổi giữa vị trí cuộn 0px/260px trên desktop 1440px và mobile 390px; lồng giặt tách theo chiều sâu. Chỉ có một scene, không có vòng lặp hoạt ảnh chạy liên tục, không chặn cuộn.
- Bật reduced motion: ma trận giữ nguyên khi cuộn, bỏ vùng ghim desktop. Mobile dùng bố cục thường, góc xoay nhẹ hơn.
- Bộ chọn vẫn đổi giặt giày thành `80.000đ / đôi`, `48 giờ` và trỏ đúng nhóm dịch vụ. Giỏ đồ vẫn tính `142.500đ` cho 2,5kg + 1 đôi.
- Không thấy lỗi JavaScript hoặc tràn ngang tại 320/390/768/1024/1440px trong Chromium. Đã xem ảnh pricing/booking và tra cứu/login sau thay đổi thanh điều hướng/chữ.
- Menu mobile mở bằng nút, Escape đóng được cả khi focus còn trên nút mở. Có đoạn quay trình duyệt thật tại `docs/previews/scroll-3d.webm`.
- Detector lần cải tiến chỉ đưa advisory về màu và bo góc mới, là các thay đổi có chủ đích trong lần cải tiến này; cập nhật DESIGN.md và sidecar theo CSS thực tế.
- Reviewer độc lập xác nhận bố cục và chuyển động trong 12 ảnh; yêu cầu đồng bộ tài liệu thiết kế đã được sửa và chấm `resolved`, verdict `ship` cho điểm đồng bộ tài liệu.
- Chưa đo FPS trên thiết bị thật hoặc kiểm tra trực tiếp Safari/Firefox; không khẳng định hiệu năng phần cứng ngoài môi trường đã xem.

## Sửa theo phản hồi “không thấy animation hoặc 3D”

Lần CSS nghiêng trước bị người dùng từ chối: không có chuyển động khi mới mở và chiều sâu khó nhận biết. Đã thay bằng mô hình Three.js WebGL thật, không dùng bảng DOM nghiêng làm bằng chứng cho yêu cầu này.

- Hai ảnh toàn viewport cách nhau một giây cho thấy áo trong lồng đổi vị trí; thân máy có mặt bên/mặt trên, vật liệu được chiếu sáng và bóng đổ. Kéo ngang đổi góc nhìn; nút tạm dừng giữ khung hình không đổi.
- RAF đếm trong trình duyệt kiểm tra: khi cuộn scene ra ngoài màn hình, không còn callback trong khoảng đo; trở lại scene thì callback tiếp tục. Không suy ra FPS phần cứng từ phép kiểm tra này.
- Reduced motion ngay khi tải mặc định đứng yên; nút “Bật chuyển động” vẫn cho phép người dùng chủ động xem. Phím trái/phải được hỗ trợ để xoay mô hình.
- Cố ý chặn WebGL: giao diện hiện thông báo dự phòng, chọn “Giặt giày” vẫn cập nhật `80.000đ`, `48 giờ` và link đặt lịch đúng nhóm.
- Không ghi nhận lỗi JavaScript hoặc tràn ngang ở 320/390/768/1024/1440px. Build và TypeScript thành công. `npm audit --omit=dev`: không có vulnerability.
- Ảnh/khung hình đối chiếu tại `.impeccable/review/webgl/`; video mới ghi lại cả lồng tự quay, kéo xoay và cuộn tại `docs/previews/scroll-3d.webm`. Chromium headless sử dụng software WebGL; chưa kiểm tra trên GPU/thiết bị thật của người dùng.

## Sau khi kết nối Supabase thật

- [ ] Chạy hai file SQL trên DB mới.
- [ ] Tạo user Auth và profile admin, điền ba biến môi trường.
- [ ] Đặt đơn đa nhóm qua UI, đối chiếu total/unit_price trong DB, nhận mã xác nhận.
- [ ] Tra cứu qua API/UI với đúng/sai SĐT, kiểm tra timeline.
- [ ] Đăng nhập sai, đăng nhập user không có role, đăng nhập admin hợp lệ.
- [ ] Admin tìm mã/SĐT, lọc trạng thái, mở chi tiết và chuyển từng bước.
- [ ] Hủy pending/picked_up; processing không được hủy.
- [ ] Hai tab cùng đơn: tab cũ không ghi đè trạng thái mới.
- [ ] Đăng xuất rồi mở link chi tiết: không đọc được dữ liệu.
- [ ] Kiểm tra trên điện thoại thật.

## Trên Vercel

- [ ] Tạo remote GitHub, push, import Vercel.
- [ ] Cấu hình env và Supabase Site URL.
- [ ] Kiểm tra luồng trên domain thật.
- [ ] Điền link, tài khoản demo đã tạo và ảnh admin vào README.

Chưa xác minh đăng nhập/refresh phiên thực tế hoặc render admin sau đăng nhập. Chưa đánh dấu các bước phụ thuộc tài khoản thật là hoàn thành.

## Hoàn tác theo yêu cầu người dùng

Đã bỏ mô hình WebGL, gỡ three và @types/three, khôi phục CSS washer panel và ScrollScene của bản trước. Build/TypeScript thành công; kiểm tra trình duyệt xác nhận không có canvas và chọn giặt giày vẫn hiển thị 80.000đ/48 giờ. Các ghi nhận WebGL ở trên là lịch sử của phiên bản đã bỏ, không mô tả bản hiện tại.
