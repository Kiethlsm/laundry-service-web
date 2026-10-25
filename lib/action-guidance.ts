type Guidance = { help: string; success: string; button?: string; bagEffect?: string };
const guidance: Record<string, Guidance> = {
 intake: {help:"Chỉ xác nhận khi đã nhận bọc từ khách. Bọc vừa nhận sẽ được ghi vào đơn đang mở.",success:"Đã nhận bọc đồ.",button:"Xác nhận đã nhận bọc",bagEffect:"Bọc vừa nhận: tiệm đang giữ."},
 measure: {help:"Lưu số lượng thực tế để chốt chi phí. Nếu vượt mức khách đã đồng ý, cần phát hành báo giá mới; chưa bắt đầu giặt.",success:"Đã lưu số lượng thực tế."},
 issue_quote: {help:"Tạo báo giá mới để khách xác nhận. Báo giá cũ được giữ lại; chưa được làm phần việc chưa có đồng ý.",success:"Đã phát hành báo giá mới. Chờ khách xác nhận."},
 accept_quote: {help:"Ghi bằng chứng mô phỏng khách đồng ý đúng báo giá đang mở. Thao tác này không bắt đầu giặt.",success:"Đã ghi nhận đồng ý báo giá mô phỏng."},
 quote_state: {help:"Lưu phản hồi báo giá. Không thay thế bước nhận, xử lý hay trả bọc.",success:"Đã lưu phản hồi báo giá."},
 start_work: {help:"Chỉ bấm khi đã nhận đồ, chốt khối lượng và có đồng ý báo giá. Phần việc bổ sung cần xác nhận riêng.",success:"Đã ghi nhận bắt đầu xử lý.",button:"Xác nhận bắt đầu giặt / xử lý"},
 qc: {help:"Kiểm đủ các bọc và món gắn nhãn trước khi đánh dấu chờ trả. Chưa ghi là đã giao cho khách.",success:"Đã lưu kết quả kiểm đồ.",button:"Xác nhận kiểm đủ đồ",bagEffect:"Lưu kết quả đối chiếu các bọc và món gắn nhãn; tiệm vẫn giữ đồ."},
 deliver_collect: {help:"Chỉ xác nhận khi đã kiểm đủ bọc, đối chiếu tiền và giao cho đúng người nhận. Lưu bàn giao và khoản thu trong cùng một lần.",success:"Đã lưu bàn giao đồ và đối chiếu tiền.",button:"Xác nhận trả bọc & thu tiền",bagEffect:"Bọc thực sự bàn giao được ghi đã trả; ngoại lệ có hồ sơ riêng."},
 receipt: {help:"Ghi khoản thu mô phỏng vào sổ. Thao tác này không tự chuyển đơn sang đã giao.",success:"Đã ghi khoản thu mô phỏng."},
 refund: {help:"Ghi khoản hoàn mô phỏng có tham chiếu khoản thu gốc. Không xóa khoản đã ghi.",success:"Đã ghi khoản hoàn mô phỏng."},
 reverse: {help:"Đảo bút toán ghi sai, giữ nguyên lịch sử gốc. Không đánh dấu bọc là đã trả.",success:"Đã lưu bút toán điều chỉnh."},
 charge: {help:"Lưu điều chỉnh chi phí có lý do và bằng chứng mô phỏng. Không tự nhận, giặt hay giao bọc.",success:"Đã lưu điều chỉnh chi phí."},
 cancel: {help:"Hủy dịch vụ; không tự hoàn tiền và không ghi là đã trả bọc. Nếu tiệm còn giữ đồ, cần xử lý phương án trả riêng.",success:"Đã hủy dịch vụ. Kiểm tra tiền và các bọc còn giữ.",button:"Xác nhận hủy dịch vụ"},
 incident: {help:"Ghi sự cố và chọn có chặn xử lý hay không. Không đánh dấu đã giải quyết khi chỉ mới ghi nhận.",success:"Đã ghi nhận sự cố."},
 resolve_issue: {help:"Lưu phương án giải quyết và bằng chứng mô phỏng. Không tự đánh dấu mọi bọc là đã trả.",success:"Đã lưu phương án giải quyết."},
 phone_note: {help:"Ghi nội dung cuộc gọi để đối chiếu. Đây là ghi chú chưa xác minh, không phải khách đã đồng ý báo giá.",success:"Đã lưu ghi chú cuộc gọi chưa xác minh."},
 retag: {help:"Đổi mã bọc hoặc món được chọn, giữ lại liên kết với mã cũ. Không đổi tiến độ xử lý.",success:"Đã lưu mã thay thế và giữ lịch sử."},
 waive: {help:"Ghi ngoại lệ theo phương án có bằng chứng mô phỏng. Không ghi món được miễn đối chiếu là đã trả khách.",success:"Đã lưu ngoại lệ có hồ sơ."},
};
const transitions: Record<string, Record<string,string>> = {
 intake:{pending:"picked_up"},start_work:{picked_up:"processing"},qc:{processing:"ready"},
 deliver_collect:{ready:"delivered"},cancel:{pending:"cancelled",picked_up:"cancelled"},
};
export function actionGuidance(action:string,status:string) {
 const copy=Object.hasOwn(guidance,action)?guidance[action]:{help:"Lưu thông tin của đơn đang mở. Hệ thống vẫn kiểm tra điều kiện trước khi cập nhật.",success:"Đã lưu thông tin."};
 return {...copy,nextStatus:transitions[action]?.[status]??status};
}
export function bagPresentation(bag:{custody_state:string;qc_completed:boolean}) {
 const custody=bag.custody_state==="received"?"Tiệm đang giữ bọc":bag.custody_state==="returned"?"Đã trả khách":bag.custody_state==="waived"?"Có hồ sơ ngoại lệ":"Cần kiểm tra hồ sơ";
 return {custody,check:bag.qc_completed?"Đã đối chiếu nhãn bọc":"Chưa kiểm đối chiếu trước khi trả"};
}
