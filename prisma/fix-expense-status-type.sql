-- The ExpenseStatus enum already exists, so we'll skip creation

-- Alter the Expense table to change the column type from PaymentStatus to ExpenseStatus
-- First, we need to add a new column with the correct type
ALTER TABLE "public"."Expense" 
ADD COLUMN "status_new" "public"."ExpenseStatus";

-- Copy data from old column to new column with appropriate casting
-- This requires handling each status value explicitly for safety
UPDATE "public"."Expense"
SET "status_new" = CASE 
    WHEN "status"::text = 'PENDING' THEN 'PENDING'::public."ExpenseStatus"
    WHEN "status"::text = 'APPROVED' THEN 'APPROVED'::public."ExpenseStatus"
    WHEN "status"::text = 'DENIED' THEN 'DENIED'::public."ExpenseStatus"
    WHEN "status"::text = 'PAID' THEN 'PAID'::public."ExpenseStatus"
    ELSE 'PENDING'::public."ExpenseStatus" -- Default fallback
END;

-- Drop the old column
ALTER TABLE "public"."Expense" DROP COLUMN "status";

-- Rename the new column to the original name
ALTER TABLE "public"."Expense" RENAME COLUMN "status_new" TO "status";

-- Set the default value
ALTER TABLE "public"."Expense" 
ALTER COLUMN "status" SET DEFAULT 'PENDING'::public."ExpenseStatus";

-- Add NOT NULL constraint if it existed before
ALTER TABLE "public"."Expense" 
ALTER COLUMN "status" SET NOT NULL;
