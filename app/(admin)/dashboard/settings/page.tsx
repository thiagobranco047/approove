import { redirect } from "next/navigation";
import { requireOrganization } from "@/lib/auth";
import { BillingActions } from "./billing-actions";
import { localizedText } from "@/lib/locale";
import { getRequestLocale } from "@/lib/request-locale";

const planLabels: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
};

export default async function SettingsPage() {
  try {
    const [{ membership, organization }, locale] = await Promise.all([
      requireOrganization(),
      getRequestLocale(),
    ]);
    const tr = (pt: string, en: string) => localizedText(locale, pt, en);
    const canManageBilling =
      membership.role === "owner" || membership.role === "admin";

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tr("Configurações", "Settings")}</h1>
          <p className="text-muted-foreground">
            {tr("Plano e cobrança da organização", "Organization plan and billing")}
          </p>
        </div>

        <div className="rounded-lg border bg-background p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{tr("Organização", "Organization")}</p>
              <h2 className="text-xl font-semibold">{organization.name}</h2>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-muted-foreground">{tr("Plano atual", "Current plan")}</p>
              <p className="text-xl font-semibold">
                {planLabels[organization.plan] ?? organization.plan}
              </p>
              {organization.subscriptionStatus && (
                <p className="text-sm text-muted-foreground">
                  {organization.subscriptionStatus}
                </p>
              )}
            </div>
          </div>
        </div>

        <BillingActions
          canManageBilling={canManageBilling}
          currentPlan={organization.plan}
          hasActiveSubscription={Boolean(
            organization.stripeSubscriptionId &&
              organization.subscriptionStatus !== "canceled" &&
              organization.subscriptionStatus !== "incomplete_expired"
          )}
          hasStripeCustomer={Boolean(organization.stripeCustomerId)}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/login");
    }
    throw error;
  }
}
