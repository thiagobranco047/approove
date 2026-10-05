/**
 * Grants Agência Demo a 15-day Approove trial (test account with product access).
 */
import { createClient } from "@libsql/client";
import { getAccessState, hasProductAccess, organizationTrialFields } from "../lib/billing-access";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("TURSO_DATABASE_URL / TURSO_AUTH_TOKEN ausentes");
  process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
  const trial = organizationTrialFields();
  const result = await client.execute({
    sql: `UPDATE Organization
          SET trialUsedAt = ?, trialEndsAt = ?
          WHERE slug = ?`,
    args: [trial.trialUsedAt.toISOString(), trial.trialEndsAt.toISOString(), "agencia-demo"],
  });

  console.log("rows affected:", result.rowsAffected);

  const row = await client.execute(
    `SELECT slug, plan, subscriptionStatus, trialUsedAt, trialEndsAt
     FROM Organization WHERE slug = 'agencia-demo'`
  );
  const org = row.rows[0];
  if (!org) {
    throw new Error("agencia-demo not found");
  }

  const fields = {
    subscriptionStatus: (org.subscriptionStatus as string | null) ?? null,
    trialUsedAt: org.trialUsedAt ? new Date(String(org.trialUsedAt)) : null,
    trialEndsAt: org.trialEndsAt ? new Date(String(org.trialEndsAt)) : null,
    plan: (org.plan as string | null) ?? "free",
  };
  const state = getAccessState(fields);
  console.log({
    ...org,
    access: state.kind,
    daysLeft: state.daysLeft,
    productAccess: hasProductAccess(fields),
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
