# Stripe Billing Design

## Goal

Add Stripe subscriptions for Approove at the organization level. Agencies pay for the workspace, not individual users.

## Billing Model

Billing belongs to `Organization`.

Add these fields:

- `stripeCustomerId`
- `stripeSubscriptionId`
- `stripePriceId`
- `subscriptionStatus`
- `plan`
- `currentPeriodEnd`

No billing table yet. One active subscription per organization is enough for the first paid version.

## Stripe Setup

Use Stripe Billing with hosted Checkout Sessions in `subscription` mode.

Use Stripe Customer Portal for plan changes, cancellation, invoices, and payment method updates.

Create three Stripe products/prices in sandbox:

- Starter: BRL 97/month
- Pro: BRL 197/month
- Studio: BRL 497/month

Price IDs are stored in env vars:

- `STRIPE_PRICE_STARTER`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_STUDIO`

Product creation should happen through the Stripe MCP OAuth connection when available. If this Codex session does not expose callable Stripe MCP tools after plugin installation, use a local sandbox `STRIPE_SECRET_KEY` or Stripe CLI login instead. Secrets should stay in local env, never in chat.

## App Routes

Create `POST /api/billing/checkout`.

- Requires authenticated organization.
- Allows only `owner` and `admin`.
- Accepts `plan`.
- Maps plan to the configured Stripe Price ID.
- Creates or reuses a Stripe Customer for the organization.
- Creates a Checkout Session with `mode: "subscription"`.
- Redirects to hosted Stripe Checkout in a new browser tab from the UI.

Create `POST /api/billing/portal`.

- Requires authenticated organization.
- Allows only `owner` and `admin`.
- Requires `stripeCustomerId`.
- Creates a Customer Portal session.
- Redirects to hosted Stripe Portal in a new browser tab from the UI.

Create `POST /api/stripe/webhook`.

- Uses the raw request body.
- Verifies `STRIPE_WEBHOOK_SECRET`.
- Handles:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Updates the matching organization by Stripe customer/subscription IDs.

## Dashboard UI

Create `/dashboard/settings`.

Show:

- Organization name.
- Current plan/status.
- Three plan cards.
- Checkout buttons for each plan.
- A "Gerenciar cobrança" button when the organization has a Stripe customer.

No custom payment form. Payment and card management happen on Stripe-hosted pages.

## Authorization

Reuse `requireOrganization()` from `lib/auth.ts`.

Only `owner` and `admin` can start Checkout or open the Customer Portal. Other members can view settings, but billing actions are disabled or hidden.

## Testing

App checks:

- TypeScript/build.
- Prisma client generation.
- Stripe route logic with invalid plan and unauthorized role where practical.

Stripe sandbox checks after credentials are available:

- Create products/prices.
- Start Checkout from `/dashboard/settings`.
- Complete checkout with Stripe test card.
- Confirm webhook updates `Organization.subscriptionStatus`, `plan`, `stripePriceId`, and `currentPeriodEnd`.
- Open Customer Portal.
- Cancel or change subscription in Portal.
- Confirm webhook reflects the change.

## Scope Not Included

Feature limits by plan are not part of this cycle.

Seat-based billing is not part of this cycle.

Invoices or cards are not shown inside Approove; Stripe Portal owns that.
