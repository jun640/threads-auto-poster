-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "accountId" TEXT;
ALTER TABLE "Settings" ADD COLUMN "basePrompt" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Settings_accountId_key" ON "Settings"("accountId");
