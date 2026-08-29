CREATE TABLE "adventure_progress" (
  "id" UUID NOT NULL,
  "adventureId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "currentStagePosition" INTEGER NOT NULL DEFAULT 0,
  "completedStages" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "adventure_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "adventure_progress_adventureId_userId_key"
ON "adventure_progress"("adventureId", "userId");

CREATE INDEX "adventure_progress_userId_completedAt_idx"
ON "adventure_progress"("userId", "completedAt");

CREATE INDEX "adventure_progress_adventureId_completedAt_idx"
ON "adventure_progress"("adventureId", "completedAt");

ALTER TABLE "adventure_progress"
ADD CONSTRAINT "adventure_progress_adventureId_fkey"
FOREIGN KEY ("adventureId")
REFERENCES "adventures"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "adventure_progress"
ADD CONSTRAINT "adventure_progress_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "users"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
