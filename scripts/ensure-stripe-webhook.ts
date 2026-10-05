import Stripe from "stripe";
import { getStripe } from "../lib/stripe";

const EVENTS: string[] = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
];

async function main() {
  const stripe = getStripe();
  const endpoints = await stripe.webhookEndpoints.list({ limit: 20 });
  const production = endpoints.data.find((endpoint) =>
    endpoint.url.includes("approoveapp.com/api/stripe/webhook")
  );

  if (!production) {
    throw new Error("No Stripe webhook endpoint found for approoveapp.com");
  }

  const updated = await stripe.webhookEndpoints.update(production.id, {
    enabled_events: EVENTS as Stripe.WebhookEndpointUpdateParams.EnabledEvent[],
  });

  console.log(
    JSON.stringify({
      id: updated.id,
      url: updated.url,
      livemode: updated.livemode,
      enabled_events: updated.enabled_events,
    })
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
