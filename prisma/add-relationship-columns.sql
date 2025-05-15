-- Add expenseId column to Transaction table
ALTER TABLE "public"."Transaction" 
ADD COLUMN IF NOT EXISTS "expenseId" TEXT UNIQUE;

-- Add duesPaymentId column to Transaction table
ALTER TABLE "public"."Transaction" 
ADD COLUMN IF NOT EXISTS "duesPaymentId" TEXT UNIQUE;

-- Add comments explaining the changes
COMMENT ON COLUMN "public"."Transaction"."expenseId" IS 'Unique reference to an expense - used for expense transactions';
COMMENT ON COLUMN "public"."Transaction"."duesPaymentId" IS 'Unique reference to a dues payment - used for dues payment transactions';
