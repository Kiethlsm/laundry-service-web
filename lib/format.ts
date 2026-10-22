export const STATUS_LABEL = {
  pending: "Chờ lấy đồ",
  picked_up: "Đã lấy đồ",
  processing: "Đang xử lý",
  ready: "Sẵn sàng giao",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
} as const;
export type OrderStatus = keyof typeof STATUS_LABEL;
export const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "picked_up",
  "processing",
  "ready",
  "delivered",
];
export const UNIT_LABEL: Record<string, string> = {
  kg: "kg",
  cai: "cái",
  doi: "đôi",
  bo: "bộ",
};
export const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + "đ";
export const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(new Date(value))
    : "Chưa hẹn";
export function nextStatuses(status: OrderStatus): OrderStatus[] {
  const index = STATUS_FLOW.indexOf(status);
  return [
    ...(index >= 0 && index < 4 ? [STATUS_FLOW[index + 1]] : []),
    ...(["pending", "picked_up"].includes(status)
      ? ["cancelled" as const]
      : []),
  ];
}
