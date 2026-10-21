import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { requireOrganization } from "@/lib/auth";
import { absoluteUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { currencyForLocale } from "@/lib/pricing";
import { getRequestLocale } from "@/lib/request-locale";
import { hasLiveSubscription } from "@/lib/billing-access";
import { apiErrorResponse } from "@/lib/api-error";

function isCurrencyMismatch(error: unknown) {
  return (
    error instanceof Stripe.errors.StripeInvalidRequestError &&
    /currency/i.test(error.message)
  );
}

const checkoutSchema = z.object({
  plan: z.enum(["solo", "starter", "pro", "studio"]),
  from: z.enum(["paywall", "settings"]).default("settings"),
});

const priceByPlan = {
  solo: process.env.STRIPE_PRICE_SOLO,
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  studio: process.env.STRIPE_PRICE_STUDIO,
} as const;

export async function POST(request: NextRequest) {
  try {
    const { membership, organization, user } = await requireOrganization();

    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json(
        { error: "Sem permissão para gerenciar cobrança" },
        { status: 403 }
      );
    }

    const { plan, from } = checkoutSchema.parse(await request.json());

    // Mudança de plano de quem já assina vai pelo Portal; um segundo Checkout criaria
    // duas assinaturas cobrando em paralelo.
    if (hasLiveSubscription(organization)) {
      return NextResponse.json(
        { error: "Sua assinatura já está ativa. Altere o plano em Gerenciar assinatura." },
        { status: 409 }
      );
    }
    const price = priceByPlan[plan];

    if (!price) {
      return NextResponse.json(
        { error: "Preço Stripe não configurado" },
        { status: 500 }
      );
    }

    const stripe = getStripe();
    let stripeCustomerId = organization.stripeCustomerId;

    if (!stripeCustomerId) {
      // Chave de idempotência: requisições simultâneas recebem o mesmo customer.
      const customer = await stripe.customers.create(
        {
          email: user.email ?? undefined,
          name: organization.name,
          metadata: { app: "approove", organizationId: organization.id },
        },
        { idempotencyKey: `approove-customer-${organization.id}` }
      );

      await prisma.organization.updateMany({
        where: { id: organization.id, stripeCustomerId: null },
        data: { stripeCustomerId: customer.id },
      });

      const saved = await prisma.organization.findUnique({
        where: { id: organization.id },
        select: { stripeCustomerId: true },
      });
      stripeCustomerId = saved?.stripeCustomerId ?? customer.id;
    }

    const currency = currencyForLocale(await getRequestLocale());

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      locale: "auto",
      currency,
      customer: stripeCustomerId,
      line_items: [{ price, quantity: 1 }],
      success_url: absoluteUrl(
        "/api/billing/confirm?session_id={CHECKOUT_SESSION_ID}"
      ),
      cancel_url: absoluteUrl(
        from === "paywall" ? "/subscribe" : "/dashboard/settings?billing=cancelled"
      ),
      metadata: { app: "approove", organizationId: organization.id, plan, from },
      subscription_data: {
        metadata: { app: "approove", organizationId: organization.id, plan },
      },
    };

    let session;

    try {
      session = await stripe.checkout.sessions.create(params);
    } catch (error) {
      if (!isCurrencyMismatch(error)) throw error;

      session = await stripe.checkout.sessions.create({
        ...params,
        currency: undefined,
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const handled = apiErrorResponse(error);
    if (handled) return handled;
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
