import Link from "next/link";
import { requireOrganization } from "@/lib/auth";
import { getAccessState } from "@/lib/billing-access";
import { getRequestLocale } from "@/lib/request-locale";
import { localizedText } from "@/lib/locale";

export async function TrialBanner() {
  const [{ organization }, locale] = await Promise.all([
    requireOrganization(),
    getRequestLocale(),
  ]);
  const tr = (pt: string, en: string) => localizedText(locale, pt, en);
  const state = getAccessState(organization);

  if (state.kind !== "trial_active" || state.daysLeft == null) {
    return null;
  }

  const days = state.daysLeft;
  const urgent = days <= 3;
  const label =
    days <= 2
      ? tr(`Seu teste termina em ${days} ${days === 1 ? "dia" : "dias"}`, `Your trial ends in ${days} ${days === 1 ? "day" : "days"}`)
      : tr(`Teste grátis · ${days} dias restantes`, `Free trial · ${days} days left`);

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={urgent ? "font-medium text-amber-700 dark:text-amber-400" : "text-muted-foreground"}>
        {label}
      </span>
      {urgent && (
        <Link
          href="/dashboard/settings"
          className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
        >
          {tr("Escolher plano", "Choose a plan")}
        </Link>
      )}
    </div>
  );
}
