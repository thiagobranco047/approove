# Stripe Billing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add organization-level Stripe subscriptions using hosted Checkout, Customer Portal, and webhooks.

**Architecture:** Store Stripe subscription state directly on `Organization`. Use small App Router API routes for Checkout, Portal, and webhook syncing. Keep payment UI hosted by Stripe.

**Tech Stack:** Next.js 15 App Router, Prisma/Postgres, NextAuth v5, Stripe Node SDK, Tailwind/shadcn UI.

---

## Files

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `prisma/schema.prisma`
- Create: `lib/stripe.ts`
- Create: `app/api/billing/checkout/route.ts`
- Create: `app/api/billing/portal/route.ts`
- Create: `app/api/stripe/webhook/route.ts`
- Create: `app/(admin)/dashboard/settings/page.tsx`
- Create: `app/(admin)/dashboard/settings/billing-actions.tsx`
- Modify: `README.md`

## Task 1: Install Stripe SDK

- [ ] **Step 1: Install dependency**

Run:

```bash
npm install stripe
```

Expected: `stripe` appears in `dependencies`, and `package-lock.json` updates.

- [ ] **Step 2: Verify package metadata**

Run:

```bash
npm ls stripe
```

Expected: dependency tree includes `stripe`.

## Task 2: Add Organization Billing Fields

- [ ] **Step 1: Update Prisma schema**

In `prisma/schema.prisma`, update `model Organization`:

```prisma
model Organization {
  id                     String    @id @default(cuid())
  name                   String
  slug                   String    @unique
  stripeCustomerId       String?   @unique
  stripeSubscriptionId   String?   @unique
  stripePriceId          String?
  subscriptionStatus     String?
  plan                   String    @default("free")
  currentPeriodEnd       DateTime?
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt

  memberships Membership[]
  clients     Client[]
  reviewers   ClientReviewer[]
}
```

- [ ] **Step 2: Generate Prisma client**

Run:

```bash
npm run postinstall
```

Expected: Prisma Client generated successfully.

- [ ] **Step 3: Push schema in dev**

Run when a local database is available:

```bash
npm run db:push
```

Expected: database schema updates without data loss prompt.

## Task 3: Create Stripe Helper

- [ ] **Step 1: Create `lib/stripe.ts`**

```ts
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not configured");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
});
```

- [ ] **Step 2: Run TypeScript check**

Run:

```bash
npx tsc --noEmit
```

Expected: either passes or only reports pre-existing unrelated project errors.

## Task 4: Checkout Route

- [ ] **Step 1: Create `app/api/billing/checkout/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOrganization } from "@/lib/auth";
import { absoluteUrl } from "@/lib/app-url";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

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
      return NextResponse.json({ error: "Sem permissão para gerenciar cobrança" }, { status: 403 });
    }

    const { plan } = checkoutSchema.parse(await request.json());
    const price = priceByPlan[plan];

    if (!price) {
      return NextResponse.json({ error: "Preço Stripe não configurado" }, { status: 500 });
    }

    let stripeCustomerId = organization.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: organization.name,
        metadata: { organizationId: organization.id },
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
      metadata: { organizationId: organization.id, plan },
      subscription_data: {
        metadata: { organizationId: organization.id, plan },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Run TypeScript check**

Run:

```bash
npx tsc --noEmit
```

Expected: route types pass.

## Task 5: Portal Route

- [ ] **Step 1: Create `app/api/billing/portal/route.ts`**

```ts
import { NextResponse } from "next/server";
import { requireOrganization } from "@/lib/auth";
import { absoluteUrl } from "@/lib/app-url";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const { membership, organization } = await requireOrganization();

    if (membership.role !== "owner" && membership.role !== "admin") {
      return NextResponse.json({ error: "Sem permissão para gerenciar cobrança" }, { status: 403 });
    }

    if (!organization.stripeCustomerId) {
      return NextResponse.json({ error: "Cliente Stripe ainda não existe" }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: organization.stripeCustomerId,
      return_url: absoluteUrl("/dashboard/settings"),
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error creating billing portal session:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Run TypeScript check**

Run:

```bash
npx tsc --noEmit
```

Expected: route types pass.

## Task 6: Webhook Route

- [ ] **Step 1: Create `app/api/stripe/webhook/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

function planFromPrice(priceId: string | null | undefined) {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "starter";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_STUDIO) return "studio";
  return "free";
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const priceId = subscription.items.data[0]?.price.id;

  await prisma.organization.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      subscriptionStatus: subscription.status,
      plan: planFromPrice(priceId),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id;

    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncSubscription(subscription);
    }
  }

  if (event.type === "customer.subscription.updated") {
    await syncSubscription(event.data.object as Stripe.Subscription);
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    await prisma.organization.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        subscriptionStatus: subscription.status,
        plan: "free",
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    });
  }

  return NextResponse.json({ received: true });
}
```

- [ ] **Step 2: Run TypeScript check**

Run:

```bash
npx tsc --noEmit
```

Expected: webhook route types pass.

## Task 7: Settings Page

- [ ] **Step 1: Create `app/(admin)/dashboard/settings/page.tsx`**

```tsx
import { redirect } from "next/navigation";
import { requireOrganization } from "@/lib/auth";
import { BillingActions } from "./billing-actions";

const planLabels: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
};

export default async function SettingsPage() {
  try {
    const { membership, organization } = await requireOrganization();
    const canManageBilling = membership.role === "owner" || membership.role === "admin";

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Plano e cobrança da organização</p>
        </div>

        <div className="rounded-lg border bg-background p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Organização</p>
              <h2 className="text-xl font-semibold">{organization.name}</h2>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-muted-foreground">Plano atual</p>
              <p className="text-xl font-semibold">{planLabels[organization.plan] ?? organization.plan}</p>
              {organization.subscriptionStatus && (
                <p className="text-sm text-muted-foreground">{organization.subscriptionStatus}</p>
              )}
            </div>
          </div>
        </div>

        <BillingActions
          canManageBilling={canManageBilling}
          hasStripeCustomer={Boolean(organization.stripeCustomerId)}
          currentPlan={organization.plan}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      redirect("/login");
    }
    throw error;
  }
}
```

- [ ] **Step 2: Create `app/(admin)/dashboard/settings/billing-actions.tsx`**

```tsx
"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  { id: "starter", name: "Starter", description: "Para equipes pequenas iniciando cobrança." },
  { id: "pro", name: "Pro", description: "Para agências com operação recorrente." },
  { id: "studio", name: "Studio", description: "Para times maiores e mais clientes." },
] as const;

type Props = {
  canManageBilling: boolean;
  hasStripeCustomer: boolean;
  currentPlan: string;
};

export function BillingActions({ canManageBilling, hasStripeCustomer, currentPlan }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  async function openBilling(path: string, body?: unknown) {
    setLoading(path);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Erro ao abrir cobrança");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao abrir cobrança");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-lg border bg-background p-5">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <p className="min-h-10 text-sm text-muted-foreground">{plan.description}</p>
              <Button
                className="w-full"
                disabled={!canManageBilling || loading !== null || currentPlan === plan.id}
                onClick={() => openBilling("/api/billing/checkout", { plan: plan.id })}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                {currentPlan === plan.id ? "Plano atual" : "Assinar"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {hasStripeCustomer && (
        <Button
          variant="outline"
          disabled={!canManageBilling || loading !== null}
          onClick={() => openBilling("/api/billing/portal")}
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Gerenciar cobrança
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Run TypeScript check**

Run:

```bash
npx tsc --noEmit
```

Expected: settings page types pass.

## Task 8: Document Setup

- [ ] **Step 1: Add Stripe envs to `README.md`**

Add to the env block:

```env
# Stripe Billing (sandbox/dev)
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_STARTER=""
STRIPE_PRICE_PRO=""
STRIPE_PRICE_STUDIO=""
```

- [ ] **Step 2: Add Stripe dev flow**

Add:

```md
## Configurar Stripe Billing

Use Stripe em modo sandbox/teste.

1. Autentique o Stripe MCP ou use Stripe CLI/SDK local com `STRIPE_SECRET_KEY`.
2. Crie os produtos/preços Starter, Pro e Studio.
3. Copie os Price IDs para `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_STUDIO`.
4. Rode o listener de webhook:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
5. Copie o `whsec_...` para `STRIPE_WEBHOOK_SECRET`.
6. Em `/dashboard/settings`, abra Checkout em nova aba e pague com cartão de teste Stripe.
```

## Task 9: Stripe Sandbox Operations

- [ ] **Step 1: Connect Stripe**

Use one of:

```bash
codex plugin add stripe@openai-curated
```

Then complete OAuth if Codex exposes the Stripe MCP authorization prompt.

Or:

```bash
stripe login
```

Or put a sandbox restricted key in local `.env` as `STRIPE_SECRET_KEY`.

- [ ] **Step 2: Create products/prices**

Create monthly recurring prices:

- Product: Approove Starter, Price: BRL 97/month
- Product: Approove Pro, Price: BRL 197/month
- Product: Approove Studio, Price: BRL 497/month

Store returned `price_...` IDs in `.env`.

- [ ] **Step 3: Start webhook listener**

Run:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Expected: listener prints a `whsec_...` secret and receives events.

- [ ] **Step 4: Run local app**

Run:

```bash
npm run dev
```

Expected: app runs at `http://localhost:3000`.

- [ ] **Step 5: Complete checkout**

Open `/dashboard/settings`, click a plan, and complete hosted Stripe Checkout in the new tab with a Stripe test card.

Expected: Stripe redirects back to `/dashboard/settings?billing=success`.

- [ ] **Step 6: Verify database sync**

Open Prisma Studio:

```bash
npm run db:studio
```

Expected: the organization has `stripeCustomerId`, `stripeSubscriptionId`, active-ish `subscriptionStatus`, selected `plan`, `stripePriceId`, and `currentPeriodEnd`.

- [ ] **Step 7: Verify Portal update**

Click "Gerenciar cobrança", change or cancel the subscription in Stripe Portal.

Expected: webhook updates `subscriptionStatus` and `plan`.

## Task 10: Final Verification

- [ ] **Step 1: Run TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected: no new TypeScript errors.

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: Next.js build completes.

- [ ] **Step 3: Review diff**

Run:

```bash
git diff --stat
git diff
```

Expected: diff is limited to Stripe billing implementation and docs.
