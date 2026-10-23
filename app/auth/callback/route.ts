import { authClient, isConfigured } from "@/lib/supabase-server";
import { customerOrigin } from "@/lib/customer-auth";
export async function GET(request: Request) {
  const origin = customerOrigin(request.url);
  if (!origin) return Response.json({ error: "Địa chỉ đăng nhập không hợp lệ." }, { status: 400 });
  const send = (location: string) => new Response(null, { status: 303, headers: { Location: location, "Cache-Control": "no-store" } });
  const fail = () => send(`${origin}/dang-nhap?reason=failed`);
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  if (!isConfigured() || params.has("error") || !code || code.length > 4096) return fail();
  try {
    const auth = await authClient();
    const { error } = await auth.auth.exchangeCodeForSession(code);
    if (error) return fail();
    const { data, error: userError } = await auth.auth.getUser();
    if (userError || !data.user?.email_confirmed_at) {
      await auth.auth.signOut();
      return fail();
    }
    const profile = await auth.rpc("ensure_customer_profile");
    if (profile.error || !["admin", "customer"].includes(profile.data?.role)) {
      await auth.auth.signOut();
      return fail();
    }
    return send(`${origin}${profile.data.role === "admin" ? "/admin" : "/tai-khoan"}`);
  } catch { return fail(); }
}
