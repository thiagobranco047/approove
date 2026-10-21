/**
 * Aceita só caminhos internos ("/dashboard?x=1"). URLs absolutas, "//host",
 * "/\host" e esquemas viram o fallback, evitando open redirect após o login.
 */
export function safeCallbackUrl(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }

  try {
    const base = "http://approove.internal";
    const url = new URL(value, base);
    if (url.origin !== base) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
