const labels: Record<string,string> = {
 checkout_estimate:"Dự kiến lúc đặt lịch",actual_measurement:"Đã cân thực tế",issued:"Đã gửi báo giá",draft:"Đang soạn",rejected:"Khách từ chối",expired:"Đã hết hiệu lực",superseded:"Đã thay thế",open:"Đang xử lý",resolved:"Đã giải quyết",customer_report:"Khách báo sự cố",incident:"Sự cố",staff_phone_note:"Ghi chú cuộc gọi",charge:"Điều chỉnh tiền",cancelled:"Đã hủy",adjustment:"Điều chỉnh chi phí",
 staff_incident:"Sự cố ghi nhận tại tiệm",damage:"Đồ bị hư hại",lost:"Thất lạc đồ",swapped:"Nhầm đồ",return_request:"Yêu cầu trả đồ",
};
export const workflowLabel=(value:string)=>labels[value]??"Ghi nhận của cửa hàng";
