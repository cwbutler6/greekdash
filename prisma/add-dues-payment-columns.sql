-- Add paidAt column to DuesPayment table
ALTER TABLE "public"."DuesPayment" 
ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP;

-- Add comment explaining the column
COMMENT ON COLUMN "public"."DuesPayment"."paidAt" IS 'Timestamp when the dues payment was received';
