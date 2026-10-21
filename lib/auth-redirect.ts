import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api-error";

/** Destino de páginas server-side quando requireOrganization falha. */
export function redirectForAuthError(error: unknown): never {
  if (error instanceof ApiError && error.code === "INVITE_PENDING") {
    redirect("/convite");
  }
  redirect("/login");
}
