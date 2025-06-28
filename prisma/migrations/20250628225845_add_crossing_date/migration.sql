-- AlterTable
ALTER TABLE "Invite" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '7 days';

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "crossingDate" TIMESTAMP(3);
