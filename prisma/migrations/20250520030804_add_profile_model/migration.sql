/*
  Warnings:

  - You are about to drop the column `period` on the `Budget` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `DuesPayment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentDate` on the `DuesPayment` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `DuesPayment` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Expense` table. All the data in the column will be lost.
  - The `status` column on the `Expense` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `accountId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `FinancialAccount` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FinancialCategory` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[expenseId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[duesPaymentId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Made the column `dueDate` on table `DuesPayment` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `submittedById` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('PLANNING', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'PAID');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'DUES_PAYMENT';
ALTER TYPE "TransactionType" ADD VALUE 'REFUND';
ALTER TYPE "TransactionType" ADD VALUE 'OTHER';

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_createdById_fkey";

-- DropForeignKey
ALTER TABLE "FinancialAccount" DROP CONSTRAINT "FinancialAccount_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "FinancialCategory" DROP CONSTRAINT "FinancialCategory_chapterId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_accountId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_createdById_fkey";

-- DropIndex
DROP INDEX "DuesPayment_status_idx";

-- DropIndex
DROP INDEX "Expense_categoryId_idx";

-- DropIndex
DROP INDEX "Expense_createdById_idx";

-- DropIndex
DROP INDEX "Expense_date_idx";

-- DropIndex
DROP INDEX "Transaction_accountId_idx";

-- DropIndex
DROP INDEX "Transaction_categoryId_idx";

-- DropIndex
DROP INDEX "Transaction_createdById_idx";

-- DropIndex
DROP INDEX "Transaction_date_idx";

-- AlterTable
ALTER TABLE "Budget" DROP COLUMN "period",
ADD COLUMN     "status" "BudgetStatus" NOT NULL DEFAULT 'PLANNING';

-- AlterTable
ALTER TABLE "DuesPayment" DROP COLUMN "description",
DROP COLUMN "paymentDate",
DROP COLUMN "status",
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "stripeInvoiceId" TEXT,
ALTER COLUMN "dueDate" SET NOT NULL;

-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "categoryId",
DROP COLUMN "createdAt",
DROP COLUMN "createdById",
DROP COLUMN "date",
DROP COLUMN "updatedAt",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "budgetId" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "submittedById" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Invite" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '7 days';

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "accountId",
DROP COLUMN "categoryId",
DROP COLUMN "createdById",
DROP COLUMN "date",
DROP COLUMN "title",
DROP COLUMN "updatedAt",
ADD COLUMN     "duesPaymentId" TEXT,
ADD COLUMN     "expenseId" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "processedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "FinancialAccount";

-- DropTable
DROP TABLE "FinancialCategory";

-- DropEnum
DROP TYPE "BudgetPeriod";

-- DropEnum
DROP TYPE "PaymentStatus";

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "major" TEXT,
    "gradYear" INTEGER,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "membershipId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_membershipId_key" ON "Profile"("membershipId");

-- CreateIndex
CREATE INDEX "Profile_userId_idx" ON "Profile"("userId");

-- CreateIndex
CREATE INDEX "Profile_chapterId_idx" ON "Profile"("chapterId");

-- CreateIndex
CREATE INDEX "Budget_status_idx" ON "Budget"("status");

-- CreateIndex
CREATE INDEX "Budget_startDate_idx" ON "Budget"("startDate");

-- CreateIndex
CREATE INDEX "DuesPayment_paidAt_idx" ON "DuesPayment"("paidAt");

-- CreateIndex
CREATE INDEX "Expense_budgetId_idx" ON "Expense"("budgetId");

-- CreateIndex
CREATE INDEX "Expense_submittedById_idx" ON "Expense"("submittedById");

-- CreateIndex
CREATE INDEX "Expense_approvedById_idx" ON "Expense"("approvedById");

-- CreateIndex
CREATE INDEX "Expense_status_idx" ON "Expense"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_expenseId_key" ON "Transaction"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_duesPaymentId_key" ON "Transaction"("duesPaymentId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "Membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_duesPaymentId_fkey" FOREIGN KEY ("duesPaymentId") REFERENCES "DuesPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
