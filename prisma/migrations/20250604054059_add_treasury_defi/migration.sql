-- CreateEnum
CREATE TYPE "TreasuryTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'AUTOINVEST', 'YIELD_EARNED');

-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "autoInvestEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoInvestStrategy" TEXT,
ADD COLUMN     "chapterTreasuryBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "treasuryLastYield" DOUBLE PRECISION,
ADD COLUMN     "treasuryLastYieldDate" TIMESTAMP(3),
ADD COLUMN     "walletAddress" TEXT,
ADD COLUMN     "walletPrivateKey" TEXT;

-- AlterTable
ALTER TABLE "Invite" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '7 days';

-- CreateTable
CREATE TABLE "TreasuryTransaction" (
    "id" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TreasuryTransactionType" NOT NULL,
    "txHash" TEXT,
    "apy" DOUBLE PRECISION,
    "protocol" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TreasuryTransaction_chapterId_idx" ON "TreasuryTransaction"("chapterId");

-- CreateIndex
CREATE INDEX "TreasuryTransaction_type_idx" ON "TreasuryTransaction"("type");

-- CreateIndex
CREATE INDEX "TreasuryTransaction_createdAt_idx" ON "TreasuryTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "TreasuryTransaction" ADD CONSTRAINT "TreasuryTransaction_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
