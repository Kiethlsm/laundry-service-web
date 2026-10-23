# Bật đăng nhập Google sau khi duyệt code và migration

Code đang ở nhánh cục bộ feat/small-shop-customer-accounts. Đây là hướng dẫn cấu hình cần người sở hữu tài khoản thực hiện/duyệt; chưa có thao tác cấu hình hoặc gửi yêu cầu đăng nhập thật trong vòng triển khai này.

## Google Auth Platform

1. Trong Google Cloud/Google Auth Platform, tạo hoặc chọn project cho Sạch Sạch. Thiết lập Branding, Audience và thông tin liên hệ thực của tiệm; không dùng thông tin minh họa trên website để khai báo.
2. Chỉ chọn scopes openid, email, profile. Luồng không yêu cầu đọc Gmail hoặc lưu Google refresh token.
3. Tạo OAuth Client loại Web application. Authorized JavaScript origins: `https://laundry-service-web.vercel.app`; thêm `http://localhost:3000` khi cần kiểm thử cục bộ.
4. Authorized redirect URI ở **Google** là `https://fjdwzetytseoltrwdsyu.supabase.co/auth/v1/callback`. Đây là callback của Supabase, khác callback của website ở bước tiếp theo.
5. Client Secret chỉ nhập trực tiếp vào Supabase Dashboard, không gửi qua chat, không đưa vào repository hoặc biến NEXT_PUBLIC. Nếu ứng dụng Google còn Testing thì chỉ các test users đã khai báo đăng nhập được; cần hoàn tất Audience/publishing và yêu cầu xác minh áp dụng trước khi mở cho khách thật.

## Supabase Auth và website

1. Sau khi người sở hữu duyệt thay đổi hosted: bật Google provider, nhập Client ID và Client Secret.
2. Site URL: `https://laundry-service-web.vercel.app`.
3. Redirect URLs chính xác: `https://laundry-service-web.vercel.app/auth/callback`; thêm `http://localhost:3000/auth/callback` khi thử cục bộ. Nếu thử Preview, thêm đúng callback của branch alias đang dùng, không thêm wildcard cho mọi website.
4. Các origin ứng dụng chấp nhận được giới hạn trong lib/customer-auth.ts. Domain tùy chỉnh hoặc deployment URL khác branch alias cần được xét và thêm rõ ràng trước khi dùng.
5. Migration mới **202610232001_customer_accounts.sql** là phần mở rộng của năm migration đã có. Không chạy lại năm file cũ hoặc schema.sql/functions.sql trên hosted. Migration mới tạo hai RPC, không chuyển quyền sở hữu đơn cũ, không đổi vai trò hiện có và không sửa dữ liệu demo thành giao dịch thật.
6. Sau backup/schema/ACL preflight và duyệt riêng, áp dụng migration mới, kiểm tra ACL/anon probes rồi Preview. Chưa merge/push/deploy thay đổi này trong vòng cục bộ.

## Kiểm thử cần làm với Google thật trước rollout

- Khách Google mới: đăng nhập, callback tạo đúng customer, phiên lưu cookie; mở lại trang không cần đăng nhập lại khi phiên còn hợp lệ.
- Đăng xuất chỉ phiên hiện tại; tài khoản khác trên thiết bị khác không bị đăng xuất theo.
- Hai tài khoản A/B: đặt đơn riêng, mỗi người chỉ thấy đơn mình. Tự sửa customer_id trong request không chuyển sở hữu đơn.
- Khách vãng lai vẫn đặt được; đăng nhập sau đó không tự nhận đơn cũ theo email/SĐT. Gửi lại cùng khóa sau khi đổi từ guest sang tài khoản phải xung đột, không tự gắn đơn cũ.
- Hủy trên Google, callback hết hạn/sai verifier, provider chưa bật: thông báo tiếng Việt, không lộ code/token/provider error.
- Google trùng tài khoản quản trị hợp lệ: giữ nguyên vai trò, chuyển vào /admin; tên/metadata tự khai không cấp quyền quản trị.
- Tài khoản bị vô hiệu hóa không được xem hoặc đặt đơn trong danh nghĩa customer.

Các bài kiểm thử cục bộ dùng PostgreSQL 17.11 và Auth transport giả để kiểm tra hợp đồng ứng dụng. Chúng **không chứng minh Google consent/PKCE, cookie hoặc token refresh của hosted đã hoạt động thực tế**. Kiểm tra cookie thực và trao đổi code với nhà cung cấp là điều kiện rollout còn mở. Không nhập khóa hosted vào transport cục bộ.

## Quy mô tiệm

Khách dùng Google; số điện thoại chỉ phục vụ liên hệ giao nhận, chưa được xác minh SMS. OTP SMS chưa có nút giả, chưa tích hợp và không phát sinh phí. Hai người quản lý tiếp tục có tài khoản riêng và quyền admin hiện có. Phần tiền/bằng chứng vẫn mô phỏng cho đến chặng chuyển sang vận hành thật đã được duyệt, dù tài khoản khách là bước chuẩn bị cho sản phẩm thật.

Nguồn: [Google provider](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs).
