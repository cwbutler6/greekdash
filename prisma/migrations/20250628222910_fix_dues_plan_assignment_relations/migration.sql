/*
  Warnings:

  - You are about to drop the column `stripeInvoiceId` on the `DuesPayment` table. All the data in the column will be lost.
  - You are about to drop the column `stripePaymentId` on the `DuesPayment` table. All the data in the column will be lost.
  - You are about to drop the column `crossingDate` on the `Profile` table. All the data in the column will be lost.
  - Made the column `duesPlanId` on table `DuesPayment` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "DuesPayment" DROP CONSTRAINT "DuesPayment_duesPlanId_fkey";

-- DropIndex
DROP INDEX "DuesPayment_paidAt_idx";

-- AlterTable
ALTER TABLE "DuesPayment" DROP COLUMN "stripeInvoiceId",
DROP COLUMN "stripePaymentId",
ADD COLUMN     "customAmount" DOUBLE PRECISION,
ADD COLUMN     "stripePaymentIntentId" TEXT,
ALTER COLUMN "duesPlanId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Invite" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '7 days';

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "crossingDate";

-- CreateTable
CREATE TABLE "DuesPlanAssignment" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    "notes" TEXT,
    "duesPlanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,

    CONSTRAINT "DuesPlanAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DuesPlanAssignment_chapterId_idx" ON "DuesPlanAssignment"("chapterId");

-- CreateIndex
CREATE INDEX "DuesPlanAssignment_userId_idx" ON "DuesPlanAssignment"("userId");

-- CreateIndex
CREATE INDEX "DuesPlanAssignment_duesPlanId_idx" ON "DuesPlanAssignment"("duesPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "DuesPlanAssignment_duesPlanId_userId_chapterId_key" ON "DuesPlanAssignment"("duesPlanId", "userId", "chapterId");

-- AddForeignKey
ALTER TABLE "DuesPayment" ADD CONSTRAINT "DuesPayment_duesPlanId_fkey" FOREIGN KEY ("duesPlanId") REFERENCES "DuesPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuesPlanAssignment" ADD CONSTRAINT "DuesPlanAssignment_duesPlanId_fkey" FOREIGN KEY ("duesPlanId") REFERENCES "DuesPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuesPlanAssignment" ADD CONSTRAINT "DuesPlanAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuesPlanAssignment" ADD CONSTRAINT "DuesPlanAssignment_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuesPlanAssignment" ADD CONSTRAINT "DuesPlanAssignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
