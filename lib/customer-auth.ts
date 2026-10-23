// Redirect targets are owned by this application, never by next/forwarded-host.
export function customerOrigin(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol === "https:" && !url.port && (
      url.hostname === "laundry-service-web.vercel.app" ||
      /^laundry-service-web-git-[a-z0-9-]+-lance-423a\.vercel\.app$/.test(url.hostname)
    )) return url.origin;
    if (process.env.NODE_ENV !== "production" && url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)) return url.origin;
  } catch { /* Reject malformed origins. */ }
  return null;
}
