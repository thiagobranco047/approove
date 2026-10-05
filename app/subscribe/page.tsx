import { redirect } from "next/navigation";
import { requireOrganization } from "@/lib/auth";
import { shouldRedirectFromSubscribe, subscribeCopyKind } from "@/lib/billing-access";
import { getRequestLocale } from "@/lib/request-locale";
import { SubscribePlans } from "./subscribe-plans";

export default async function SubscribePage() {
  let context;

  try {
    context = await requireOrganization();
  } catch {
    redirect("/login");
  }

  const { membership, organization } = context;

  if (shouldRedirectFromSubscribe(organization)) {
    redirect("/dashboard");
  }

  const locale = await getRequestLocale();
  const canManageBilling =
    membership.role === "owner" || membership.role === "admin";

  return (
    <SubscribePlans
      locale={locale}
      organizationName={organization.name}
      canManageBilling={canManageBilling}
      copyKind={subscribeCopyKind(organization)}
    />
  );
}
