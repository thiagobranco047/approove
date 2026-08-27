import { NextRequest, NextResponse } from "next/server";
import { requireOrganization } from "@/lib/auth";
import { absoluteUrl } from "@/lib/app-url";
import { getStripe } from "@/lib/stripe";
import { syncSubscription } from "@/lib/stripe-sync";

/**
 * Destino do success_url do Checkout. Sincroniza a assinatura na volta do
 * Stripe para o gate liberar o app na hora, sem esperar o webhook.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  try {
    const { organization } = await requireOrganization();

    if (!sessionId) {
      return NextResponse.redirect(absoluteUrl("/dashboard/settings"));
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;

    if (customerId !== organization.stripeCustomerId) {
      return NextResponse.redirect(absoluteUrl("/dashboard/settings"));
    }

    if (session.subscription && typeof session.subscription !== "string") {
      await syncSubscription(session.subscription);
    }

    const target =
      session.metadata?.from === "paywall"
        ? "/onboarding?billing=success"
        : "/dashboard/settings?billing=success";

    return NextResponse.redirect(absoluteUrl(target));
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.redirect(absoluteUrl("/login"));
    }
    console.error("Error confirming checkout session:", error);
    return NextResponse.redirect(absoluteUrl("/dashboard/settings"));
  }
}
