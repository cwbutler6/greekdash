-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "stripeAvailableBalance" INTEGER DEFAULT 0,
ADD COLUMN     "stripeBalanceLastUpdated" TIMESTAMP(3),
ADD COLUMN     "stripeConnectAccountId" TEXT,
ADD COLUMN     "stripePendingBalance" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "Invite" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '7 days';
