-- Create the ExpenseStatus enum
CREATE TYPE "public"."ExpenseStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'DENIED',
  'PAID'
);
