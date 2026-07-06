import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganization } from "@/lib/auth";
import { absoluteUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

const checkoutSchema = z.object({
  plan: z.enum(["starter", "pro", "studio"]),
});

const priceByPlan = {
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

    const { plan } = checkoutSchema.parse(await request.json());
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
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: organization.name,
        metadata: { app: "approove", organizationId: organization.id },
      });

      stripeCustomerId = customer.id;

      await prisma.organization.update({
        where: { id: organization.id },
        data: { stripeCustomerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price, quantity: 1 }],
      success_url: absoluteUrl("/dashboard/settings?billing=success"),
      cancel_url: absoluteUrl("/dashboard/settings?billing=cancelled"),
      metadata: { app: "approove", organizationId: organization.id, plan },
      subscription_data: {
        metadata: { app: "approove", organizationId: organization.id, plan },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 }
      );
    }
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
