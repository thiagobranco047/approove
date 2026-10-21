import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { refreshSubscription, subscriptionIdFromInvoice } from "@/lib/stripe-sync";

function subscriptionIdFromEvent(event: Stripe.Event): string | null {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      return typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? null;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return event.data.object.id;
    case "invoice.paid":
    case "invoice.payment_failed":
      return subscriptionIdFromInvoice(event.data.object);
    default:
      return null;
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("Stripe webhook signature failed:", error);
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  // Sempre relê a assinatura no Stripe: eventos chegam fora de ordem e o payload
  // pode estar velho. syncSubscription ignora assinaturas duplicadas.
  const subscriptionId = subscriptionIdFromEvent(event);
  if (subscriptionId) {
    await refreshSubscription(subscriptionId);
  }

  return NextResponse.json({ received: true });
}
