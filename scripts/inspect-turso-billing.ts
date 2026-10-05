import { createClient } from "@libsql/client";
import { getAccessState, hasProductAccess, subscribeCopyKind } from "../lib/billing-access";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("TURSO_DATABASE_URL / TURSO_AUTH_TOKEN ausentes");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
  const cols = await client.execute("PRAGMA table_info(Organization)");
  const names = cols.rows.map((row) => String(row.name));
  console.log("Organization columns:", names.join(", "));
  console.log("has trialEndsAt:", names.includes("trialEndsAt"));
  console.log("has trialUsedAt:", names.includes("trialUsedAt"));

  const hasTrialEnds = names.includes("trialEndsAt");
  const orgs = await client.execute(
    hasTrialEnds
      ? `SELECT id, name, slug, plan, subscriptionStatus, stripeSubscriptionId, stripePriceId,
                trialUsedAt, trialEndsAt, currentPeriodEnd
         FROM Organization
         ORDER BY createdAt DESC
         LIMIT 50`
      : `SELECT id, name, slug, plan, subscriptionStatus, stripeSubscriptionId, stripePriceId,
                trialUsedAt, currentPeriodEnd
         FROM Organization
         ORDER BY createdAt DESC
         LIMIT 50`
  );

  console.log(`\n${orgs.rows.length} organization(s) (cap 50)\n`);

  const summary: Record<string, number> = {};

  for (const row of orgs.rows) {
    const trialEndsAt =
      hasTrialEnds && row.trialEndsAt ? new Date(String(row.trialEndsAt)) : null;
    const trialUsedAt = row.trialUsedAt ? new Date(String(row.trialUsedAt)) : null;
    const fields = {
      subscriptionStatus: (row.subscriptionStatus as string | null) ?? null,
      stripeSubscriptionId: (row.stripeSubscriptionId as string | null) ?? null,
      trialEndsAt,
      trialUsedAt,
      plan: (row.plan as string | null) ?? "free",
    };
    const state = getAccessState(fields);
    summary[state.kind] = (summary[state.kind] ?? 0) + 1;
    console.log({
      slug: row.slug,
      name: row.name,
      plan: row.plan,
      subscriptionStatus: row.subscriptionStatus,
      stripeSubscriptionId: row.stripeSubscriptionId,
      trialUsedAt: row.trialUsedAt,
      trialEndsAt: hasTrialEnds ? row.trialEndsAt : "(coluna ausente)",
      access: state.kind,
      productAccess: hasProductAccess(fields),
      subscribeCopy: subscribeCopyKind(fields),
    });
  }

  console.log("\nAccess kind counts:", summary);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
