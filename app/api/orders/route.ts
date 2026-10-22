import { isConfigured, serviceClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  if (!isConfigured())
    return Response.json(
      {
        error:
          "Đặt lịch chưa được kích hoạt. Đây là bản xem trước giao diện, chưa tiếp nhận đơn.",
      },
      { status: 503 },
    );
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
  if (!body || typeof body !== "object")
    return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  const { name, phone, address, pickup, payment, note, items } = body;
  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.length > 100 ||
    typeof phone !== "string" ||
    !/^0\d{9}$/.test(phone) ||
    typeof address !== "string" ||
    address.trim().length < 5 ||
    address.length > 500 ||
    typeof pickup !== "string" ||
    !Number.isFinite(Date.parse(pickup)) ||
    Date.parse(pickup) <= Date.now() ||
    !["cash", "bank_transfer"].includes(payment) ||
    (note !== undefined && (typeof note !== "string" || note.length > 1000)) ||
    !Array.isArray(items) ||
    items.length < 1 ||
    items.length > 50 ||
    items.some(
      (item: { service_id: number; quantity: number }) =>
        !item ||
        !Number.isInteger(item.service_id) ||
        item.service_id < 1 ||
        typeof item.quantity !== "number" ||
        !Number.isFinite(item.quantity) ||
        item.quantity <= 0 ||
        item.quantity > 1000 ||
        Math.abs(item.quantity * 100 - Math.round(item.quantity * 100)) >
          0.000001,
    ) ||
    new Set(items.map((item: { service_id: number }) => item.service_id))
      .size !== items.length
  ) {
    return Response.json(
      {
        error:
          "Kiểm tra họ tên, SĐT 10 số bắt đầu bằng 0, địa chỉ, lịch lấy đồ trong tương lai và số lượng dịch vụ.",
      },
      { status: 400 },
    );
  }
  try {
    // Prices and totals come exclusively from current database rows, inside one transaction.
    const { data, error } = await serviceClient().rpc("create_guest_order", {
      p_name: name.trim(),
      p_phone: phone,
      p_address: address.trim(),
      p_pickup: pickup,
      p_payment: payment,
      p_note: note || "",
      p_items: items.map(
        ({
          service_id,
          quantity,
        }: {
          service_id: number;
          quantity: number;
        }) => ({ service_id, quantity }),
      ),
    });
    if (error) {
      const invalid = /INVALID_|SERVICE_UNAVAILABLE/.test(error.message);
      return Response.json(
        {
          error: invalid
            ? "Dịch vụ hoặc số lượng không hợp lệ. Hãy tải lại bảng giá và kiểm tra đơn."
            : "Chưa thể tạo đơn. Vui lòng thử lại sau.",
        },
        { status: invalid ? 400 : 503 },
      );
    }
    return Response.json(data, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Không kết nối được cửa hàng. Vui lòng thử lại sau." },
      { status: 503 },
    );
  }
}
