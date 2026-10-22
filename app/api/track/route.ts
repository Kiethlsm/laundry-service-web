import { isConfigured, serviceClient } from "@/lib/supabase-server";
export async function POST(request: Request) {
  if (!isConfigured())
    return Response.json(
      {
        error:
          "Tra cứu chưa được kích hoạt. Bản xem trước chưa có dữ liệu đơn hàng.",
      },
      { status: 503 },
    );
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 });
  }
  const code =
    typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  if (!/^LD\d{4,16}$/.test(code) || !/^0\d{9}$/.test(phone))
    return Response.json(
      { error: "Nhập mã đơn dạng LD1001 và SĐT 10 số đã đặt lịch." },
      { status: 400 },
    );
  try {
    const { data, error } = await serviceClient()
      .from("orders")
      .select(
        "code,customer_name,pickup_address,pickup_time,delivery_time,status,total,payment_method,note,created_at,order_items(quantity,unit_price,services(name,unit)),order_status_history(id,status,changed_at)",
      )
      .eq("code", code)
      .eq("customer_phone", phone)
      .maybeSingle();
    if (error)
      return Response.json(
        { error: "Chưa thể tra cứu. Vui lòng thử lại sau." },
        { status: 503 },
      );
    if (!data)
      return Response.json(
        {
          error:
            "Không tìm thấy đơn khớp cả mã và SĐT. Hãy kiểm tra lại thông tin.",
        },
        { status: 404 },
      );
    return Response.json(data, {
      headers: { "Cache-Control": "no-store, private" },
    });
  } catch {
    return Response.json(
      { error: "Không kết nối được cửa hàng. Vui lòng thử lại sau." },
      { status: 503 },
    );
  }
}
