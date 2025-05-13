-- AlterTable
ALTER TABLE "Chapter" ADD COLUMN     "primaryColor" TEXT;

-- AlterTable
ALTER TABLE "Invite" ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '7 days';
