-- Delete existing rows that have no userId (orphaned test data)
DELETE FROM "Project";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");
