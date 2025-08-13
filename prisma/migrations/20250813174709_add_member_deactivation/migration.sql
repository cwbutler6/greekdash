-- AlterEnum
ALTER TYPE "PlanType" ADD VALUE 'ENTERPRISE';

-- AlterTable
ALTER TABLE "Invite" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '7 days';

-- AlterTable
ALTER TABLE "Membership" ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "deactivatedBy" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Membership_isActive_idx" ON "Membership"("isActive");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_deactivatedBy_fkey" FOREIGN KEY ("deactivatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
