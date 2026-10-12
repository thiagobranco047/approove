import Stripe from "stripe";

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-06-24.dahlia",
  });

  const ids = [
    process.env.STRIPE_PRICE_STARTER,
    process.env.STRIPE_PRICE_PRO,
    process.env.STRIPE_PRICE_STUDIO,
  ].filter(Boolean) as string[];

  for (const id of ids) {
    const price = await stripe.prices.retrieve(id, { expand: ["product", "currency_options"] });
    const product = price.product;
    const productObj =
      typeof product === "object" && product && "id" in product && !product.deleted
        ? product
        : null;
    console.log(
      JSON.stringify(
        {
          plan: price.metadata?.plan ?? productObj?.metadata?.plan,
          priceId: price.id,
          productId: productObj?.id ?? product,
          productName: productObj?.name,
          nickname: price.nickname,
          currency: price.currency,
          unit_amount: price.unit_amount,
          brl: price.currency_options?.brl?.unit_amount,
          livemode: price.livemode,
          active: price.active,
        },
        null,
        2
      )
    );
  }

  const extras = await stripe.products.list({ active: true, limit: 20 });
  console.log("\nall active products:");
  for (const product of extras.data) {
    console.log(`- ${product.id} ${product.name} meta=${JSON.stringify(product.metadata)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
