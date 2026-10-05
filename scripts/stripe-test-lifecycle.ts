/**
 * Stripe TEST only: BRL checkout amounts, dunning statuses, webhook signature.
 * Does not write to Turso.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";
import {
  getAccessState,
  hasProductAccess,
  shouldEndApprooveTrial,
} from "../lib/billing-access";

function loadEnv() {
  const raw = readFileSync(resolve(".env"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^"|"$/g, "");
    if (key.startsWith("STRIPE_") || !process.env[key]) process.env[key] = val;
  }
}

loadEnv();

function report(label: string, sub: Stripe.Subscription) {
  const fields = {
    subscriptionStatus: sub.status,
    stripeSubscriptionId: sub.id,
    trialEndsAt: null as Date | null,
  };
  console.log({
    label,
    stripe: sub.status,
    access: getAccessState(fields).kind,
    product: hasProductAccess(fields),
    endsApprooveTrial: shouldEndApprooveTrial(sub.status),
  });
}

async function attachCard(stripe: Stripe, customerId: string, token: string) {
  const pm = await stripe.paymentMethods.create({
    type: "card",
    card: { token },
  });
  await stripe.paymentMethods.attach(pm.id, { customer: customerId });
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: pm.id },
  });
  return pm.id;
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_test_")) {
    throw new Error("Stripe TEST key required");
  }
  const stripe = new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
  const starter = process.env.STRIPE_PRICE_STARTER!;
  const pro = process.env.STRIPE_PRICE_PRO!;

  console.log("=== BRL Checkout Sessions ===");
  for (const [plan, price] of [
    ["starter", starter],
    ["pro", pro],
  ] as const) {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      currency: "brl",
      line_items: [{ price, quantity: 1 }],
      success_url: "http://localhost:3010/subscribe",
      cancel_url: "http://localhost:3010/subscribe",
    });
    console.log({
      plan,
      currency: session.currency,
      amount_total: session.amount_total,
      urlPrefix: session.url?.slice(0, 40),
    });
  }

  console.log("\n=== Subscription lifecycle (TEST) ===");
  const customer = await stripe.customers.create({
    email: "dunning.billing-v2@approove.test",
    name: "Dunning fixture",
    metadata: { app: "approove-billing-v2-test", case: "dunning" },
  });
  await attachCard(stripe, customer.id, "tok_visa");

  const active = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: starter }],
    metadata: { app: "approove-billing-v2-test", case: "dunning-active" },
  });
  report("active", active);

  const trialing = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: starter }],
    trial_period_days: 5,
    metadata: { app: "approove-billing-v2-test", case: "dunning-trialing" },
  });
  report("legacy trialing", trialing);

  const incomplete = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: starter }],
    payment_behavior: "default_incomplete",
    metadata: { app: "approove-billing-v2-test", case: "dunning-incomplete" },
  });
  report("incomplete", incomplete);

  await attachCard(stripe, customer.id, "tok_chargeCustomerFail");
  let pastDue: Stripe.Subscription | null = null;
  try {
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      subscription: active.id,
      auto_advance: true,
    });
    try {
      await stripe.invoices.pay(invoice.id);
    } catch {
      /* expected decline */
    }
    pastDue = await stripe.subscriptions.retrieve(active.id);
    report("after failed invoice (want past_due/unpaid)", pastDue);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log("invoice dunning skipped:", message);
    pastDue = await stripe.subscriptions.retrieve(active.id);
    report("active unchanged", pastDue);
  }

  console.log("\n=== Test clock dunning ===");
  const frozen = Math.floor(Date.now() / 1000);
  const clock = await stripe.testHelpers.testClocks.create({ frozen_time: frozen });
  const clockCustomer = await stripe.customers.create({
    test_clock: clock.id,
    email: "clock.dunning@approove.test",
    metadata: { app: "approove-billing-v2-test", case: "clock" },
  });
  await attachCard(stripe, clockCustomer.id, "tok_visa");
  const clockSub = await stripe.subscriptions.create({
    customer: clockCustomer.id,
    items: [{ price: starter }],
    metadata: { app: "approove-billing-v2-test", case: "clock-sub" },
  });
  report("clock active", clockSub);
  await attachCard(stripe, clockCustomer.id, "tok_chargeCustomerFail");
  await stripe.testHelpers.testClocks.advance(clock.id, {
    frozen_time: frozen + 35 * 24 * 60 * 60,
  });
  for (let i = 0; i < 25; i++) {
    const state = await stripe.testHelpers.testClocks.retrieve(clock.id);
    if (state.status === "ready") break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  const afterAdvance = await stripe.subscriptions.retrieve(clockSub.id);
  report("after +35d with fail card", afterAdvance);

  await stripe.testHelpers.testClocks.advance(clock.id, {
    frozen_time: frozen + 90 * 24 * 60 * 60,
  });
  for (let i = 0; i < 25; i++) {
    const state = await stripe.testHelpers.testClocks.retrieve(clock.id);
    if (state.status === "ready") break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  const afterRetries = await stripe.subscriptions.retrieve(clockSub.id);
  report("after +90d with fail card", afterRetries);

  const canceled = await stripe.subscriptions.cancel(trialing.id);
  report("canceled", canceled);

  console.log("\n=== Webhook signature ===");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET missing");
  const payload = JSON.stringify({
    id: "evt_test_billing_v2",
    object: "event",
    type: "customer.subscription.updated",
    data: { object: pastDue ?? active },
  });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret });
  const event = stripe.webhooks.constructEvent(payload, header, secret);
  console.log({ verified: event.type, ok: event.type === "customer.subscription.updated" });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
