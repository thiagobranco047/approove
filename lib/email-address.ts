import { z } from "zod";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/** E-mail validado e já normalizado (trim + minúsculas). */
export const emailSchema = z.string().trim().toLowerCase().email("Email inválido").max(254);

export const passwordSchema = z
  .string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .max(128, "Senha muito longa");
