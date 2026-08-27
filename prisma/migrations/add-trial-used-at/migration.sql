-- Paywall com trial de 15 dias: marca quando a organização já consumiu o trial,
-- para nunca conceder um segundo período gratuito no Checkout.
ALTER TABLE "Organization" ADD COLUMN "trialUsedAt" DATETIME;
