/**
 * Seeds an isolated SQLite DB + Stripe TEST objects for Billing V2 validation.
 * Does not write to the production Turso database.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import {
  getAccessState,
  hasProductAccess,
  organizationTrialFields,
  shouldEndApprooveTrial,
  subscribeCopyKind,
} from "../lib/billing-access";

function loadStripeKeys() {
  const raw = readFileSync(resolve(".env"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^"|"$/g, "");
    if (key.startsWith("STRIPE_")) {
      process.env[key] = val;
    }
  }
}

loadStripeKeys();
process.env.DATABASE_URL = "file:./prisma/billing-v2-test.db";
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;

function planFromPrice(priceId: string | null | undefined) {
  if (priceId && process.env.STRIPE_PRICE_SOLO === priceId) return "solo";
  if (priceId && process.env.STRIPE_PRICE_STARTER === priceId) return "starter";
  if (priceId && process.env.STRIPE_PRICE_PRO === priceId) return "pro";
  if (priceId && process.env.STRIPE_PRICE_STUDIO === priceId) return "studio";
  return "free";
}

function currentPeriodEnd(subscription: Stripe.Subscription) {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return periodEnd ? new Date(periodEnd * 1000) : null;
}

const prisma = new PrismaClient();
const PASSWORD = "BillingV2!test";
const META = { app: "approove-billing-v2-test" };

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_")) {
    throw new Error("Use only Stripe TEST keys (sk_test_) for this script");
  }
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
}

async function upsertUserOrg(opts: {
  email: string;
  orgName: string;
  slug: string;
  orgData: Record<string, unknown>;
  skipMembership?: boolean;
}) {
  const password = await bcrypt.hash(PASSWORD, 10);
  const user = await prisma.user.upsert({
    where: { email: opts.email },
    update: { password, name: opts.orgName, hasCompletedOnboarding: true },
    create: {
      email: opts.email,
      password,
      name: opts.orgName,
      hasCompletedOnboarding: true,
    },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: opts.slug },
    update: opts.orgData,
    create: {
      name: opts.orgName,
      slug: opts.slug,
      ...opts.orgData,
    },
  });

  if (!opts.skipMembership) {
    await prisma.membership.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
      update: { role: "owner" },
      create: {
        userId: user.id,
        organizationId: organization.id,
        role: "owner",
      },
    });
  }

  return { user, organization };
}

async function attachVisa(stripe: Stripe, customerId: string) {
  const paymentMethod = await stripe.paymentMethods.create({
    type: "card",
    card: { token: "tok_visa" },
  });
  await stripe.paymentMethods.attach(paymentMethod.id, { customer: customerId });
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethod.id },
  });
  return paymentMethod.id;
}

async function mirrorSubscription(
  organizationId: string,
  subscription: Stripe.Subscription
) {
  const priceId = subscription.items.data[0]?.price.id;
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      stripeCustomerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      subscriptionStatus: subscription.status,
      plan: planFromPrice(priceId),
      currentPeriodEnd: currentPeriodEnd(subscription),
      ...(shouldEndApprooveTrial(subscription.status)
        ? { trialEndsAt: new Date() }
        : {}),
    },
  });
}

async function shareLink(organizationId: string, slug: string) {
  const client = await prisma.client.upsert({
    where: { slug },
    update: { organizationId, name: `Cliente ${slug}` },
    create: { organizationId, slug, name: `Cliente ${slug}` },
  });
  const version = await prisma.calendarVersion.upsert({
    where: { clientId_version: { clientId: client.id, version: "v1" } },
    update: {},
    create: { clientId: client.id, version: "v1" },
  });
  const existing = await prisma.shareToken.findFirst({
    where: { calendarVersionId: version.id },
  });
  const token =
    existing ??
    (await prisma.shareToken.create({
      data: {
        calendarVersionId: version.id,
        token: `billing-test-${slug}`,
      },
    }));
  return `/c/${slug}/v1?t=${token.token}`;
}

async function main() {
  const stripe = stripeClient();
  const starterPrice = process.env.STRIPE_PRICE_STARTER;
  if (!starterPrice) throw new Error("STRIPE_PRICE_STARTER missing");

  const now = new Date();
  const trial = organizationTrialFields(now);

  console.log("Seeding local orgs A–F + Stripe TEST subscriptions...\n");

  const a = await upsertUserOrg({
    email: "a.active@approove.test",
    orgName: "Org A Active",
    slug: "org-a-active",
    orgData: { plan: "free" },
  });
  const customerA = await stripe.customers.create({
    email: a.user.email!,
    name: a.organization.name,
    metadata: { ...META, case: "A" },
  });
  await attachVisa(stripe, customerA.id);
  const subA = await stripe.subscriptions.create({
    customer: customerA.id,
    items: [{ price: starterPrice }],
    metadata: { ...META, case: "A" },
  });
  await mirrorSubscription(a.organization.id, subA);

  const b = await upsertUserOrg({
    email: "b.pastdue@approove.test",
    orgName: "Org B Past Due",
    slug: "org-b-pastdue",
    orgData: {
      plan: "starter",
      subscriptionStatus: "past_due",
      stripeSubscriptionId: "sub_test_past_due_local",
      trialEndsAt: new Date(),
    },
  });
  const customerB = await stripe.customers.create({
    email: b.user.email!,
    name: b.organization.name,
    metadata: { ...META, case: "B" },
  });
  await prisma.organization.update({
    where: { id: b.organization.id },
    data: { stripeCustomerId: customerB.id },
  });

  const c = await upsertUserOrg({
    email: "c.trialing@approove.test",
    orgName: "Org C Stripe Trialing",
    slug: "org-c-trialing",
    orgData: { plan: "free" },
  });
  const customerC = await stripe.customers.create({
    email: c.user.email!,
    name: c.organization.name,
    metadata: { ...META, case: "C" },
  });
  await attachVisa(stripe, customerC.id);
  const subC = await stripe.subscriptions.create({
    customer: customerC.id,
    items: [{ price: starterPrice }],
    trial_period_days: 7,
    metadata: { ...META, case: "C" },
  });
  await mirrorSubscription(c.organization.id, subC);

  const d = await upsertUserOrg({
    email: "d.usednull@approove.test",
    orgName: "Org D Used Null Trial",
    slug: "org-d-usednull",
    orgData: {
      plan: "free",
      trialUsedAt: new Date("2026-01-01T00:00:00.000Z"),
      trialEndsAt: null,
      subscriptionStatus: null,
    },
  });

  const e = await upsertUserOrg({
    email: "e.legacy@approove.test",
    orgName: "Org E Legacy Unpaid",
    slug: "org-e-legacy",
    orgData: {
      plan: "free",
      trialUsedAt: null,
      trialEndsAt: null,
      subscriptionStatus: null,
    },
  });

  const f = await upsertUserOrg({
    email: "f.trial@approove.test",
    orgName: "Org F Billing V2 Trial",
    slug: "org-f-trial",
    orgData: { plan: "free", ...trial },
  });

  const expired = await upsertUserOrg({
    email: "expired@approove.test",
    orgName: "Org Trial Expired",
    slug: "org-trial-expired",
    orgData: {
      plan: "free",
      trialUsedAt: new Date("2026-09-01T00:00:00.000Z"),
      trialEndsAt: new Date("2026-09-16T00:00:00.000Z"),
    },
  });

  const unpaid = await upsertUserOrg({
    email: "unpaid@approove.test",
    orgName: "Org Unpaid",
    slug: "org-unpaid",
    orgData: {
      plan: "starter",
      subscriptionStatus: "unpaid",
      stripeSubscriptionId: "sub_test_unpaid",
      trialEndsAt: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    },
  });

  const canceled = await upsertUserOrg({
    email: "canceled@approove.test",
    orgName: "Org Canceled",
    slug: "org-canceled",
    orgData: { plan: "free" },
  });
  const customerCanceled = await stripe.customers.create({
    email: canceled.user.email!,
    name: canceled.organization.name,
    metadata: { ...META, case: "canceled" },
  });
  await attachVisa(stripe, customerCanceled.id);
  const subCanceled = await stripe.subscriptions.create({
    customer: customerCanceled.id,
    items: [{ price: starterPrice }],
    metadata: { ...META, case: "canceled" },
  });
  const canceledSub = await stripe.subscriptions.cancel(subCanceled.id);
  await mirrorSubscription(canceled.organization.id, canceledSub);

  const incomplete = await upsertUserOrg({
    email: "incomplete@approove.test",
    orgName: "Org Incomplete",
    slug: "org-incomplete",
    orgData: { plan: "free", ...trial },
  });
  const customerInc = await stripe.customers.create({
    email: incomplete.user.email!,
    name: incomplete.organization.name,
    metadata: { ...META, case: "incomplete" },
  });
  const subInc = await stripe.subscriptions.create({
    customer: customerInc.id,
    items: [{ price: starterPrice }],
    payment_behavior: "default_incomplete",
    metadata: { ...META, case: "incomplete" },
  });
  await mirrorSubscription(incomplete.organization.id, subInc);

  await prisma.user.upsert({
    where: { email: "google.orphan@approove.test" },
    update: {
      password: await bcrypt.hash(PASSWORD, 10),
      name: "Google Orphan",
      hasCompletedOnboarding: true,
    },
    create: {
      email: "google.orphan@approove.test",
      password: await bcrypt.hash(PASSWORD, 10),
      name: "Google Orphan",
      hasCompletedOnboarding: true,
    },
  });

  const expiredLink = await shareLink(expired.organization.id, "cliente-expired");
  const trialLink = await shareLink(f.organization.id, "cliente-trial");

  const orgs = await prisma.organization.findMany({
    orderBy: { slug: "asc" },
  });

  console.log("password for all users:", PASSWORD);
  console.log("public expired:", expiredLink);
  console.log("public trial:", trialLink);
  console.log("\n=== DATA MATRIX ===");
  for (const org of orgs) {
    const state = getAccessState(org);
    console.log({
      slug: org.slug,
      stripeStatus: org.subscriptionStatus,
      stripeSub: org.stripeSubscriptionId,
      trialEndsAt: org.trialEndsAt,
      trialUsedAt: org.trialUsedAt,
      access: state.kind,
      product: hasProductAccess(org),
      copy: subscribeCopyKind(org),
      endTrialRule: shouldEndApprooveTrial(org.subscriptionStatus),
    });
  }

  console.log("\nStripe live statuses:");
  console.log("A active:", subA.status, subA.id);
  console.log("C trialing:", subC.status, subC.id);
  console.log("canceled:", canceledSub.status, canceledSub.id);
  console.log("incomplete:", subInc.status, subInc.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
