import type { DemoWorkspaceData } from "./demo-types";
export const ORDER_GROUPS = [
  { id: "new", label: "Đơn mới", statuses: ["pending"] },
  { id: "working", label: "Đang làm", statuses: ["picked_up", "processing"] },
  { id: "ready", label: "Chờ trả", statuses: ["ready"] },
  { id: "done", label: "Hoàn tất", statuses: ["delivered"] },
  { id: "cancelled", label: "Đã hủy", statuses: ["cancelled"] },
];
export function groupForStatus(status: string) {
  return ORDER_GROUPS.find(g => g.statuses.includes(status))?.id ?? null;
}
export type WorkPanel = "quotes" | "bags" | "payments" | "issues";
export type NextAction = { panel: WorkPanel; title: string; help: string };
export function nextAdminAction(data: DemoWorkspaceData): NextAction {
  const action = (panel: WorkPanel, title: string, help: string): NextAction => ({ panel, title, help });
  const { order, money } = data;
  if (order.status === "delivered") return action("payments", "Đơn đã hoàn tất", "Bạn có thể xem lại sổ tiền và lịch sử xử lý của đơn.");
  if (order.status === "cancelled") return data.bags.some(b => b.custody_state === "received")
    ? action("bags", "Đối chiếu túi cần trả", "Dịch vụ đã hủy nhưng cửa hàng còn giữ đồ. Kiểm tra phương án trả trước khi đóng hồ sơ.")
    : action("issues", "Đơn đã hủy", "Xem lại ghi chú và phương án xử lý; việc hủy không tự tạo khoản hoàn tiền.");
  if (data.issues.some(i => i.state === "open" && i.blocking)) return action("issues", "Giải quyết sự cố đang chặn", "Đọc nội dung sự cố và ghi nhận phương án giải quyết trước khi tiếp tục.");
  if (order.status === "pending") return action("bags", "Nhận và kiểm đếm túi đồ", "Liên hệ khách, nhận đồ rồi ghi nhãn túi, số món và tình trạng ban đầu.");
  if (!data.eligible) return action("quotes", "Xác nhận báo giá với khách", "Cần khách đồng ý đúng báo giá hiện tại trước khi xử lý đồ.");
  if (order.status === "picked_up") return money?.settlement_total == null
    ? action("quotes", "Cân đồ và chốt chi phí", "Nhập khối lượng thực tế. Nếu vượt phạm vi đã đồng ý, phát hành báo giá mới.")
    : action("bags", "Bắt đầu xử lý đồ", "Đã có báo giá và số lượng thực tế. Đối chiếu túi rồi bắt đầu công việc.");
  if (data.quotes.find(q => q.id === order.active_quote_id)?.is_amendment && order.work_quote_id !== order.active_quote_id)
    return action("bags", "Bắt đầu phần việc bổ sung", "Khách đã đồng ý phần việc mới. Ghi nhận bắt đầu phần bổ sung rồi kiểm tra lại chất lượng.");
  if (order.status === "processing" || order.work_quote_id !== order.active_quote_id || order.qc_quote_id !== order.active_quote_id)
    return action("bags", "Kiểm tra đồ trước khi trả", "Đối chiếu từng nhãn túi và món riêng; hoàn tất phần việc bổ sung nếu có.");
  if (money?.status === "refund_due") return action("payments", "Hoàn phần tiền thừa", "Đối chiếu khoản đã thu và ghi khoản hoàn trước khi bàn giao đồ.");
  return action("payments", "Bàn giao đồ và đối chiếu tiền", "Kiểm đủ túi, xác nhận người nhận và ghi số tiền còn phải thu trong cùng thao tác.");
}
