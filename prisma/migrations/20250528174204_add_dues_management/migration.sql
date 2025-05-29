-- CreateEnum
CREATE TYPE "DuesFrequency" AS ENUM ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SEMESTER', 'ANNUAL');

-- CreateEnum
CREATE TYPE "DuesStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'WAIVED');

-- AlterTable
ALTER TABLE "DuesPayment" ADD COLUMN     "duesPlanId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "status" "DuesStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "stripeCheckoutUrl" TEXT;

-- AlterTable
ALTER TABLE "Invite" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '7 days';

-- CreateTable
CREATE TABLE "DuesPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "frequency" "DuesFrequency" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "applyToNewMembers" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "chapterId" TEXT NOT NULL,

    CONSTRAINT "DuesPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DuesPlan_chapterId_idx" ON "DuesPlan"("chapterId");

-- CreateIndex
CREATE INDEX "DuesPayment_duesPlanId_idx" ON "DuesPayment"("duesPlanId");

-- CreateIndex
CREATE INDEX "DuesPayment_status_idx" ON "DuesPayment"("status");

-- AddForeignKey
ALTER TABLE "DuesPlan" ADD CONSTRAINT "DuesPlan_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuesPayment" ADD CONSTRAINT "DuesPayment_duesPlanId_fkey" FOREIGN KEY ("duesPlanId") REFERENCES "DuesPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
