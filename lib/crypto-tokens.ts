import crypto from "crypto";

/** Segredo opaco para URLs (base64url, sem padding). */
export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** Token de link de aprovação: 192 bits de CSPRNG. */
export function generateShareToken() {
  return randomToken(24);
}

/** Código de login de 6 dígitos, uniforme e de CSPRNG. */
export function generateLoginCode() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Sufixo curto para desambiguar slugs públicos. */
export function randomSlugSuffix() {
  return crypto.randomBytes(3).toString("hex");
}

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
