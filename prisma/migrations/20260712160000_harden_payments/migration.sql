-- Remove duplicate enrollments created by repeated Stripe webhook delivery,
-- keeping the earliest enrollment for each order.
DELETE FROM "Enrollment" AS duplicate
USING "Enrollment" AS original
WHERE duplicate."orderId" = original."orderId"
  AND (
    duplicate."createdAt" > original."createdAt"
    OR (duplicate."createdAt" = original."createdAt" AND duplicate."id" > original."id")
  );

CREATE UNIQUE INDEX "Enrollment_orderId_key" ON "Enrollment"("orderId");
CREATE INDEX "Enrollment_cohortId_status_idx" ON "Enrollment"("cohortId", "status");
CREATE INDEX "Enrollment_userId_status_idx" ON "Enrollment"("userId", "status");

CREATE UNIQUE INDEX "Order_stripeCheckoutId_key" ON "Order"("stripeCheckoutId");
CREATE UNIQUE INDEX "Order_stripePaymentIntentId_key" ON "Order"("stripePaymentIntentId");
CREATE INDEX "Order_cohortId_status_idx" ON "Order"("cohortId", "status");
CREATE INDEX "Order_guestEmail_idx" ON "Order"("guestEmail");
