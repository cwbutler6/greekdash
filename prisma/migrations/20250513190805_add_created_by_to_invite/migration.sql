-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "createdById" TEXT,
ALTER COLUMN "expiresAt" SET DEFAULT NOW() + interval '7 days';

-- CreateIndex
CREATE INDEX "Invite_createdById_idx" ON "Invite"("createdById");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
