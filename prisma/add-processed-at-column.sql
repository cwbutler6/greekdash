-- Add processedAt column to Transaction table
ALTER TABLE "public"."Transaction" 
ADD COLUMN IF NOT EXISTS "processedAt" TIMESTAMP;

-- Comment explaining the change
COMMENT ON COLUMN "public"."Transaction"."processedAt" IS 'Timestamp when the transaction was processed';
