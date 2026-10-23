import { authClient, isConfigured, serviceClient } from "@/lib/supabase-server";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const messages: Record<string, [number, string]> = {
  IDEMPOTENCY_CONFLICT: [409, "Lần gửi này khác nội dung đã lưu. Hãy tải lại để đặt lịch mới."],
  OPERATION_EXPIRED: [409, "Phiên đặt lịch đã hết hạn. Hãy tải lại trang."],
  ORDER_RATE_LIMIT: [429, "Số điện thoại demo đã đạt ba đơn trong một giờ. Vui lòng thử lại sau."],
  ORDER_PENDING_LIMIT: [429, "Số điện thoại demo có quá nhiều đơn đang chờ."],
  DEMO_CAPACITY: [429, "Bản demo đã đủ đơn mẫu. Vui lòng thử lại sau."],
  PICKUP_NOT_FUTURE: [400, "Vui lòng chọn thời gian lấy đồ trong tương lai."],
  PICKUP_TOO_FAR: [400, "Vui lòng chọn lịch trong 90 ngày tới."],
  INVALID_PICKUP: [400, "Thời gian lấy đồ không hợp lệ."],
  INVALID_ORDER: [400, "Vui lòng kiểm tra thông tin và xác nhận báo giá demo."],
  INVALID_QUANTITY: [400, "Dịch vụ hoặc số lượng không hợp lệ."],
  SERVICE_UNAVAILABLE: [400, "Dịch vụ đã thay đổi. Hãy tải lại bảng giá."],
};
export async function POST(request: Request) {
  if (!isConfigured()) return Response.json({ error: "Đặt lịch chưa được kích hoạt." }, { status: 503 });
  const key = request.headers.get("Idempotency-Key") || "";
  if (!uuid.test(key)) return Response.json({ error: "Phiên đặt lịch không hợp lệ. Hãy tải lại trang." }, { status: 400 });
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
  const pickup = typeof body?.pickup === "string" ? body.pickup : "";
  const timestamp = Date.parse(pickup);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(pickup) || !Number.isFinite(timestamp) || timestamp <= Date.now() || timestamp > Date.now() + 90 * 86400000)
    return Response.json({ error: "Vui lòng chọn thời gian lấy đồ hợp lệ trong 90 ngày tới." }, { status: 400 });
  if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  // Contact does not establish ownership; client rates/actor/owner are ignored.
  const payload = { name: body.name, phone: body.phone, address: body.address, pickup: new Date(timestamp).toISOString(), payment: body.payment, note: body.note ?? "", consent: body.consent, tolerance_consent: body.tolerance_consent, items: body.items };
  try {
    let customerId: string | null = null;
    if (request.headers.has("cookie")) {
      const hasAuthCookie = /(?:^|;\s*)sb-[a-z0-9_-]+-auth-token(?:\.\d+)?=/i.test(request.headers.get("cookie") || "");
      const auth = await authClient();
      const session = await auth.auth.getUser();
      if ((!session.data.user && hasAuthCookie) || (session.error && session.error.name !== "AuthSessionMissingError"))
        return Response.json({ error: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại trước khi đặt lịch." }, { status: 401 });
      if (session.data.user) {
        const profile = await auth.rpc("current_profile_role");
        if (profile.error || !["customer", "admin"].includes(profile.data))
          return Response.json({ error: "Chưa xác nhận được tài khoản. Vui lòng đăng nhập lại." }, { status: 403 });
        if (profile.data === "customer") customerId = session.data.user.id;
      }
    }
    const { data, error } = await serviceClient().rpc("book_demo_order", { p_payload: payload, p_key: key, p_customer_id: customerId });
    if (error) {
      const known = messages[error.message];
      if (known) return Response.json({ code: error.message, error: known[1] }, { status: known[0] });
      console.error(JSON.stringify({ event: "booking_rpc_failed", code: "DB_ERROR", operation_key: key }));
      return Response.json({ error: "Chưa thể đặt lịch. Vui lòng thử lại sau." }, { status: 503 });
    }
    if (!data || !/^LD\d+$/.test(data.code) || !Number.isSafeInteger(data.total) || data.total < 0 || !Number.isSafeInteger(data.max_weight_total) || data.max_weight_total < data.total || typeof data.replayed !== "boolean")
      return Response.json({ error: "Chưa xác nhận được kết quả. Hãy thử lại cùng phiên đặt lịch." }, { status: 503 });
    return Response.json(data, { status: data.replayed ? 200 : 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error(JSON.stringify({ event: "booking_rpc_failed", code: "TRANSPORT", operation_key: key }));
    return Response.json({ error: "Mất kết nối. Vui lòng thử lại cùng phiên đặt lịch." }, { status: 503 });
  }
}
