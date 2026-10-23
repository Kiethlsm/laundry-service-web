# Sạch Sạch — sản phẩm cho tiệm gia đình

Chốt ngày 23/10/2026: website phục vụ khách thật; một tiệm do hai mẹ con cùng vận hành, không tuyển nhân viên. Đây là hướng phát triển hiện hành, thay cho portfolio-only. V1.2 và báo cáo rollout được giữ như lịch sử thiết kế/kiểm thử; chúng không chứng minh bản hiện tại đã sẵn sàng nhận khách thật.

## Người dùng

- Khách đăng nhập bằng **Google (Gmail)**, đặt lịch, xem đơn của mình, xác nhận giá thay đổi và xem khoản còn phải trả. Đây là lựa chọn mới thay cho OTP bắt buộc. Số điện thoại vẫn là thông tin liên hệ; OTP SMS là tùy chọn để sau, chưa kích hoạt.
- Hai người quản lý dùng **hai tài khoản riêng, cùng quyền quản lý tiệm**. Lịch sử ghi ai thao tác, không cần dùng chung mật khẩu.
- Khách đến trực tiếp: người quản lý tạo đơn tại quầy, không bắt khách nhận OTP. Đơn vãng lai không tự gắn vào tài khoản chỉ vì trùng số điện thoại.

Không đưa phân ca, chấm công, lương, phân công nhân viên, phân tuyến shipper, đa chi nhánh, CRM hoặc tích điểm vào bản đầu. Cấu trúc quyền đã có trong database được giữ để bảo toàn dữ liệu; không xóa bảng hay nới quyền chỉ để làm giao diện gọn hơn.

## Màn hình hằng ngày

Mở quản lý là thấy ô tìm mã/SĐT và bốn nhóm:

| Nhóm | Trạng thái database | Thao tác thường dùng |
|---|---|---|
| Mới | pending | Liên hệ, nhận túi đồ |
| Đang làm | picked_up, processing | Cân, chốt giá, giặt |
| Chờ trả | ready | Kiểm tra đồ, thu tiền, bàn giao |
| Đã xong | delivered | Xem lại lịch sử |

Đơn hủy có bộ lọc riêng. Nhóm trên màn hình không thay đổi bảng chuyển trạng thái/điều kiện server. Chi tiết đơn ưu tiên thông tin khách → đồ đã nhận → giá → thu tiền/trả đồ. Điều chỉnh giá, hoàn tiền, sự cố và lịch sử nằm trong mục mở rộng.

Một nhãn cho mỗi túi. Chỉ gắn nhãn riêng cho món giá trị cao hoặc có vấn đề; không bắt nhập từng áo thông thường. Hai người đều có thể thực hiện các bước, không có thao tác giao việc cho nhau.

## Các quy tắc vẫn giữ

- Giá ước tính là v0. Với từng dòng kg có đồng ý dung sai: ±10% hoặc ±0,3 kg, lấy mức lớn hơn, bao gồm ranh giới. Trong mức này không cần hỏi lại; ngoài mức phải có báo giá mới và khách xác nhận. Món theo cái/đôi/bộ không dùng dung sai kg.
- Server xác định tài khoản sở hữu đơn từ phiên đã xác minh. Khách A không đọc được đơn B bằng cách đổi URL/mã đơn. Thông tin liên hệ không tự chứng minh sở hữu.
- Tiền mặt hoặc QR Techcombank hiện có. Tiệm kiểm tra tiền thực nhận rồi ghi sổ. Quét QR/ảnh biên lai không tự xác nhận thanh toán.
- Bút toán cũ giữ nguyên; sai sót được điều chỉnh có lý do. Còn thiếu tiền hoặc chưa đối chiếu đồ thì chưa hoàn tất bàn giao.
- Dùng lại [hợp đồng giá/tiền/quyền](pipeline-v1.2/contracts.md). Chuyển từ mô phỏng sang giao dịch thật cần migration và kiểm thử riêng; không chỉ bỏ chữ demo hoặc đổi cờ is_synthetic.

## Dịch vụ bên ngoài tối thiểu

Liên lạc vận hành trước mắt bằng gọi điện/Zalo thủ công và trạng thái trong tài khoản. Chưa cần SMS thông báo từng trạng thái, outbox hoặc webhook ngân hàng/SePay.

**Đăng nhập Google dùng Supabase Auth và OAuth PKCE**, chỉ yêu cầu openid/email/profile, không đọc hộp thư Gmail. Cần Google OAuth Client và cấu hình callback/redirect allowlist trong Supabase trước khi thử thật. Khách vẫn có thể đặt lịch vãng lai. Không tự nhận các đơn vãng lai về tài khoản theo email/SĐT. [Supabase Google Auth](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).

Nếu bổ sung OTP sau này thì cần SMS provider, hạn mức gửi và duyệt chi phí riêng. Không đưa mã cố định/mã hiển thị trên màn hình vào production. [Supabase Phone Auth](https://supabase.com/docs/guides/auth/phone-login).

Vercel Hobby giới hạn sử dụng cá nhân, phi thương mại; trước khi tiệm dùng thật cần chọn hosting phù hợp, không tự nâng gói hay phát sinh phí. [Vercel Hobby](https://vercel.com/docs/plans/hobby).

## Lộ trình ngắn

Ước lượng **7–12 ngày công**, tái sử dụng nền hiện có, chưa gồm thời gian nhà cung cấp SMS/hosting hoặc chờ thông tin tiệm. Đây là ước lượng, không phải ngày hẹn ra mắt.

| Chặng | Ngày công | Điều kiện kiểm thử | Cắt trước nếu quá thời gian |
|---|---|---|---|
| S01 — tài khoản khách | 2–3 | Google PKCE, hủy/lỗi callback, phiên, sở hữu đơn và cách ly khách A/B, quyền admin không đổi | Nhiều địa chỉ lưu sẵn, sửa hồ sơ nâng cao |
| S02 — quầy cho hai người | 2–3 | Bốn nhóm đơn, tạo tại quầy, nhận túi/cân/chốt giá/hoàn tất, sửa đồng thời, xác nhận báo giá vượt dung sai | Bộ lọc phụ, đổi nhãn nâng cao |
| S03 — tiền thật | 2–4 | Tách dữ liệu demo, thu tiền mặt/chuyển khoản thủ công, chống ghi trùng, điều chỉnh có lý do, đủ tiền/đồ mới bàn giao | Biểu đồ, xuất báo cáo; không bỏ kiểm tra tiền/quyền |
| S04 — đưa vào sử dụng | 1–2 | Hai tài khoản quản lý, thông tin tiệm thật, Google OAuth/hosting, sao lưu có phục hồi thử, Preview và smoke test trước production | Trang giới thiệu phụ |

Mỗi chặng viết kiểm thử thất bại trước sửa, triển khai cục bộ, chạy lint/typecheck/tests (gồm ma trận quyền và hosted defaults)/build rồi commit. Không tick hoàn tất từ tài liệu kế hoạch. Kiểm thử Auth giả chỉ chứng minh giao diện/hợp đồng; đăng nhập Google phải được thử với nhà cung cấp thực trước khi bật cho khách.

## Trạng thái hiện tại

Production đang là bản portfolio commit 4972e0c: chưa có tài khoản khách, chưa có thanh toán thật. Dữ liệu đã xác minh gồm 27 dòng gốc và bốn đơn ZZ TEST được phép giữ. Nhánh mới feat/small-shop-customer-accounts xuất phát từ master. Việc chốt phạm vi này không tự cấp quyền ghi hosted, deploy, mua dịch vụ hoặc xóa dữ liệu. Rollout tiếp theo vẫn cần backup, kiểm tra ACL, Preview và bảo toàn dữ liệu.
