-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "schoolName" TEXT;

-- AlterTable
ALTER TABLE "Invite" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '7 days';

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "crossingDate" TIMESTAMP(3),
ADD COLUMN     "discipline" TEXT,
ADD COLUMN     "lineGroup" TEXT,
ADD COLUMN     "lineName" TEXT,
ADD COLUMN     "schoolName" TEXT;
