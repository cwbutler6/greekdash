-- Let's check the current status values to make sure we preserve them
-- First create a temporary table to store the current values
CREATE TEMP TABLE temp_expense_status AS
SELECT id, status::text AS status_text FROM "public"."Expense";

-- Now drop the existing status column
ALTER TABLE "public"."Expense" DROP COLUMN IF EXISTS "status";

-- Add the status column with the correct type
ALTER TABLE "public"."Expense" 
ADD COLUMN "status" "public"."ExpenseStatus" NOT NULL DEFAULT 'PENDING';

-- Update with preserved values
UPDATE "public"."Expense" e
SET "status" = CASE 
    WHEN t.status_text = 'PENDING' THEN 'PENDING'::"public"."ExpenseStatus"
    WHEN t.status_text = 'APPROVED' THEN 'APPROVED'::"public"."ExpenseStatus"
    WHEN t.status_text = 'DENIED' THEN 'DENIED'::"public"."ExpenseStatus"
    WHEN t.status_text = 'PAID' THEN 'PAID'::"public"."ExpenseStatus"
    ELSE 'PENDING'::"public"."ExpenseStatus" -- Default fallback
END
FROM temp_expense_status t
WHERE e.id = t.id;

-- Drop the temporary table
DROP TABLE temp_expense_status;
