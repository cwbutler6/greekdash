-- Add 'OTHER' to TransactionType enum
ALTER TYPE "public"."TransactionType" ADD VALUE IF NOT EXISTS 'OTHER';
