-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "secondaryColor" TEXT;

-- AlterTable
ALTER TABLE "Invite" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '7 days';
