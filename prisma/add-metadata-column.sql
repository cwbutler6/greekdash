-- Add metadata column to Transaction table
ALTER TABLE "public"."Transaction" 
ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Comment explaining the change
COMMENT ON COLUMN "public"."Transaction"."metadata" IS 'JSON metadata for additional transaction information';
