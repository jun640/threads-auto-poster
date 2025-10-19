-- CreateTable
CREATE TABLE "AutoPostRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" TEXT NOT NULL DEFAULT 'DAILY',
    "customSchedule" TEXT,
    "autoGenerate" BOOLEAN NOT NULL DEFAULT true,
    "topic" TEXT,
    "customPrompt" TEXT,
    "isThread" BOOLEAN NOT NULL DEFAULT false,
    "aiModel" TEXT NOT NULL DEFAULT 'gpt-4',
    "scheduledTimes" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tokyo',
    "lastRunAt" DATETIME,
    "nextRunAt" DATETIME,
    "runCount" INTEGER NOT NULL DEFAULT 0,
    "maxRuns" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AutoPostRule_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AutoPostRule_accountId_idx" ON "AutoPostRule"("accountId");

-- CreateIndex
CREATE INDEX "AutoPostRule_enabled_idx" ON "AutoPostRule"("enabled");

-- CreateIndex
CREATE INDEX "AutoPostRule_nextRunAt_idx" ON "AutoPostRule"("nextRunAt");
