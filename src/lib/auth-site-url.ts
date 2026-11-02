export function getAuthSiteOrigin(requestUrl: string) {
  const configuredUrl = process.env.SITE_URL
    ?? process.env.NEXT_PUBLIC_SITE_URL
    ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (configuredUrl) {
    const withProtocol = configuredUrl.includes("://") ? configuredUrl : `https://${configuredUrl}`;
    let url: URL;
    try {
      url = new URL(withProtocol);
    } catch {
      throw new Error("SITE_URL must be a valid public site URL.");
    }

    if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) {
      throw new Error("SITE_URL must be a public HTTP or HTTPS site URL.");
    }
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      throw new Error("SITE_URL must use HTTPS in production.");
    }

    return url.origin;
  }

  if (process.env.NODE_ENV !== "production") {
    return new URL(requestUrl).origin;
  }

  throw new Error("Set SITE_URL to the stable production site origin for Supabase Auth redirects.");
}
