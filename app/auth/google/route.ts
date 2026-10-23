import { authClient, isConfigured } from "@/lib/supabase-server";
import { customerOrigin } from "@/lib/customer-auth";
export async function GET(request: Request) {
  const origin = customerOrigin(request.url);
  if (!origin) return Response.json({ error: "Địa chỉ đăng nhập không hợp lệ." }, { status: 400 });
  const send = (location: string | URL) => new Response(null, { status: 303, headers: { Location: String(location), "Cache-Control": "no-store" } });
  const fail = () => send(`${origin}/dang-nhap?reason=unavailable`);
  if (!isConfigured()) return fail();
  try {
    const auth = await authClient();
    const { data, error } = await auth.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback`, scopes: "openid email profile", skipBrowserRedirect: true },
    });
    if (error || !data.url) return fail();
    const target = new URL(data.url);
    if (target.origin !== new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin || target.pathname !== "/auth/v1/authorize" || target.searchParams.get("provider") !== "google") return fail();
    return send(target);
  } catch { return fail(); }
}
