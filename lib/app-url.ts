/**
 * Base URL pública da aplicação (e-mails, links absolutos).
 * Preferência: NEXTAUTH_URL → VERCEL_URL → localhost.
 */
export function getAppBaseUrl(): string {
  const fromEnv = process.env.NEXTAUTH_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getAppBaseUrl()}${normalized}`;
}
