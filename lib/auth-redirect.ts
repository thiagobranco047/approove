import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api-error";
import { canManageWorkspace, requireOrganization } from "@/lib/auth";

/** Destino de páginas server-side quando requireOrganization falha. */
export function redirectForAuthError(error: unknown): never {
  if (error instanceof ApiError && error.code === "INVITE_PENDING") {
    redirect("/convite");
  }
  redirect("/login");
}

/** Páginas de gestão (clientes, equipe, configurações): membros voltam ao dashboard. */
export async function requireManagerPage() {
  let context;
  try {
    context = await requireOrganization();
  } catch (error) {
    redirectForAuthError(error);
  }
  if (!canManageWorkspace(context.membership.role)) {
    redirect("/dashboard");
  }
  return context;
}
