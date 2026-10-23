import { isConfigured, serviceClient } from "@/lib/supabase-server";
export async function POST(request: Request) {
  if (!isConfigured()) return Response.json({ error: "Tra cứu chưa được kích hoạt." }, { status: 503 });
  let body;
  try { body = await request.json(); } catch { return Response.json({ error: "Dữ liệu không hợp lệ." }, { status: 400 }); }
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  if (!/^LD\d{4,16}$/.test(code) || !/^0\d{9}$/.test(phone)) return Response.json({ error: "Kiểm tra mã đơn và số điện thoại." }, { status: 400 });
  try {
    const { data, error } = await serviceClient().rpc("lookup_demo_order", { p_code: code, p_phone: phone });
    if (error) return Response.json({ error: "Chưa thể tra cứu. Vui lòng thử lại sau." }, { status: 503 });
    if (!data) return Response.json({ error: "Không tìm thấy đơn khớp mã và số điện thoại." }, { status: 404 });
    return Response.json(data, { headers: { "Cache-Control": "no-store, private" } });
  } catch { return Response.json({ error: "Mất kết nối. Vui lòng thử lại sau." }, { status: 503 }); }
}
