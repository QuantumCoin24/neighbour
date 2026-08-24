-- CreateEnum
CREATE TYPE "VibeStatus" AS ENUM ('DRAFT', 'PROCESSING', 'PUBLISHED', 'HIDDEN', 'REMOVED', 'FAILED');

-- CreateEnum
CREATE TYPE "VibeVisibility" AS ENUM ('PUBLIC', 'COMMUNITY', 'NEIGHBOURHOOD');

-- CreateEnum
CREATE TYPE "VibeReactionType" AS ENUM ('LIKE', 'LOVE', 'FIRE', 'LAUGH', 'WOW');

-- CreateEnum
CREATE TYPE "LiveSessionStatus" AS ENUM ('SCHEDULED', 'STARTING', 'LIVE', 'ENDED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "LiveParticipantRole" AS ENUM ('HOST', 'MODERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "LiveModerationEventType" AS ENUM ('COMMENT_REMOVED', 'PARTICIPANT_MUTED', 'PARTICIPANT_REMOVED', 'PARTICIPANT_BLOCKED', 'STREAM_ENDED');

-- CreateTable
CREATE TABLE "vibes" (
    "id" UUID NOT NULL,
    "creatorId" UUID NOT NULL,
    "communityId" UUID,
    "neighbourhoodId" UUID,
    "caption" TEXT,
    "status" "VibeStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "VibeVisibility" NOT NULL DEFAULT 'PUBLIC',
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "locationAccuracyM" INTEGER,
    "postcode" TEXT,
    "publishedAt" TIMESTAMP(3),
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vibes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vibe_media" (
    "id" UUID NOT NULL,
    "vibeId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vibe_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vibe_reactions" (
    "id" UUID NOT NULL,
    "vibeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "VibeReactionType" NOT NULL DEFAULT 'LIKE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vibe_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vibe_comments" (
    "id" UUID NOT NULL,
    "vibeId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "parentId" UUID,
    "content" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vibe_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vibe_views" (
    "id" UUID NOT NULL,
    "vibeId" UUID NOT NULL,
    "userId" UUID,
    "sessionKey" TEXT,
    "watchTimeMs" INTEGER NOT NULL DEFAULT 0,
    "completionRatio" DOUBLE PRECISION,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "replay" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vibe_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vibe_saves" (
    "id" UUID NOT NULL,
    "vibeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vibe_saves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vibe_shares" (
    "id" UUID NOT NULL,
    "vibeId" UUID NOT NULL,
    "userId" UUID,
    "channel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vibe_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_sessions" (
    "id" UUID NOT NULL,
    "creatorId" UUID NOT NULL,
    "communityId" UUID,
    "neighbourhoodId" UUID,
    "title" TEXT,
    "description" TEXT,
    "status" "LiveSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "provider" TEXT,
    "providerRoomName" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "locationAccuracyM" INTEGER,
    "postcode" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_participants" (
    "id" UUID NOT NULL,
    "liveSessionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "LiveParticipantRole" NOT NULL DEFAULT 'VIEWER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "mutedAt" TIMESTAMP(3),
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "live_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_reactions" (
    "id" UUID NOT NULL,
    "liveSessionId" UUID NOT NULL,
    "userId" UUID,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_comments" (
    "id" UUID NOT NULL,
    "liveSessionId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_moderation_events" (
    "id" UUID NOT NULL,
    "liveSessionId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "targetUserId" UUID,
    "type" "LiveModerationEventType" NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_moderation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vibes_creatorId_status_publishedAt_idx" ON "vibes"("creatorId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "vibes_communityId_status_publishedAt_idx" ON "vibes"("communityId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "vibes_neighbourhoodId_status_publishedAt_idx" ON "vibes"("neighbourhoodId", "status", "publishedAt");

-- CreateIndex
CREATE INDEX "vibes_status_visibility_publishedAt_idx" ON "vibes"("status", "visibility", "publishedAt");

-- CreateIndex
CREATE INDEX "vibes_latitude_longitude_idx" ON "vibes"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "vibes_postcode_idx" ON "vibes"("postcode");

-- CreateIndex
CREATE INDEX "vibes_deletedAt_idx" ON "vibes"("deletedAt");

-- CreateIndex
CREATE INDEX "vibe_media_vibeId_position_idx" ON "vibe_media"("vibeId", "position");

-- CreateIndex
CREATE INDEX "vibe_media_mediaId_idx" ON "vibe_media"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "vibe_media_vibeId_mediaId_key" ON "vibe_media"("vibeId", "mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "vibe_media_vibeId_position_key" ON "vibe_media"("vibeId", "position");

-- CreateIndex
CREATE INDEX "vibe_reactions_vibeId_type_idx" ON "vibe_reactions"("vibeId", "type");

-- CreateIndex
CREATE INDEX "vibe_reactions_userId_createdAt_idx" ON "vibe_reactions"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "vibe_reactions_vibeId_userId_key" ON "vibe_reactions"("vibeId", "userId");

-- CreateIndex
CREATE INDEX "vibe_comments_vibeId_createdAt_idx" ON "vibe_comments"("vibeId", "createdAt");

-- CreateIndex
CREATE INDEX "vibe_comments_authorId_createdAt_idx" ON "vibe_comments"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "vibe_comments_parentId_createdAt_idx" ON "vibe_comments"("parentId", "createdAt");

-- CreateIndex
CREATE INDEX "vibe_comments_deletedAt_idx" ON "vibe_comments"("deletedAt");

-- CreateIndex
CREATE INDEX "vibe_views_vibeId_createdAt_idx" ON "vibe_views"("vibeId", "createdAt");

-- CreateIndex
CREATE INDEX "vibe_views_userId_createdAt_idx" ON "vibe_views"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "vibe_views_sessionKey_idx" ON "vibe_views"("sessionKey");

-- CreateIndex
CREATE INDEX "vibe_views_completed_createdAt_idx" ON "vibe_views"("completed", "createdAt");

-- CreateIndex
CREATE INDEX "vibe_saves_userId_createdAt_idx" ON "vibe_saves"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "vibe_saves_vibeId_idx" ON "vibe_saves"("vibeId");

-- CreateIndex
CREATE UNIQUE INDEX "vibe_saves_vibeId_userId_key" ON "vibe_saves"("vibeId", "userId");

-- CreateIndex
CREATE INDEX "vibe_shares_vibeId_createdAt_idx" ON "vibe_shares"("vibeId", "createdAt");

-- CreateIndex
CREATE INDEX "vibe_shares_userId_createdAt_idx" ON "vibe_shares"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "live_sessions_providerRoomName_key" ON "live_sessions"("providerRoomName");

-- CreateIndex
CREATE INDEX "live_sessions_creatorId_status_createdAt_idx" ON "live_sessions"("creatorId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "live_sessions_communityId_status_createdAt_idx" ON "live_sessions"("communityId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "live_sessions_neighbourhoodId_status_createdAt_idx" ON "live_sessions"("neighbourhoodId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "live_sessions_status_startedAt_idx" ON "live_sessions"("status", "startedAt");

-- CreateIndex
CREATE INDEX "live_sessions_latitude_longitude_idx" ON "live_sessions"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "live_sessions_postcode_idx" ON "live_sessions"("postcode");

-- CreateIndex
CREATE INDEX "live_participants_liveSessionId_joinedAt_idx" ON "live_participants"("liveSessionId", "joinedAt");

-- CreateIndex
CREATE INDEX "live_participants_userId_joinedAt_idx" ON "live_participants"("userId", "joinedAt");

-- CreateIndex
CREATE INDEX "live_participants_liveSessionId_role_idx" ON "live_participants"("liveSessionId", "role");

-- CreateIndex
CREATE INDEX "live_reactions_liveSessionId_createdAt_idx" ON "live_reactions"("liveSessionId", "createdAt");

-- CreateIndex
CREATE INDEX "live_reactions_userId_createdAt_idx" ON "live_reactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "live_comments_liveSessionId_createdAt_idx" ON "live_comments"("liveSessionId", "createdAt");

-- CreateIndex
CREATE INDEX "live_comments_authorId_createdAt_idx" ON "live_comments"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "live_comments_deletedAt_idx" ON "live_comments"("deletedAt");

-- CreateIndex
CREATE INDEX "live_moderation_events_liveSessionId_createdAt_idx" ON "live_moderation_events"("liveSessionId", "createdAt");

-- CreateIndex
CREATE INDEX "live_moderation_events_actorId_createdAt_idx" ON "live_moderation_events"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "live_moderation_events_targetUserId_createdAt_idx" ON "live_moderation_events"("targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "live_moderation_events_type_createdAt_idx" ON "live_moderation_events"("type", "createdAt");

-- AddForeignKey
ALTER TABLE "vibes" ADD CONSTRAINT "vibes_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibes" ADD CONSTRAINT "vibes_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibes" ADD CONSTRAINT "vibes_neighbourhoodId_fkey" FOREIGN KEY ("neighbourhoodId") REFERENCES "neighbourhoods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibe_media" ADD CONSTRAINT "vibe_media_vibeId_fkey" FOREIGN KEY ("vibeId") REFERENCES "vibes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibe_media" ADD CONSTRAINT "vibe_media_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibe_reactions" ADD CONSTRAINT "vibe_reactions_vibeId_fkey" FOREIGN KEY ("vibeId") REFERENCES "vibes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibe_reactions" ADD CONSTRAINT "vibe_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibe_comments" ADD CONSTRAINT "vibe_comments_vibeId_fkey" FOREIGN KEY ("vibeId") REFERENCES "vibes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibe_comments" ADD CONSTRAINT "vibe_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibe_comments" ADD CONSTRAINT "vibe_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "vibe_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibe_views" ADD CONSTRAINT "vibe_views_vibeId_fkey" FOREIGN KEY ("vibeId") REFERENCES "vibes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibe_views" ADD CONSTRAINT "vibe_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibe_saves" ADD CONSTRAINT "vibe_saves_vibeId_fkey" FOREIGN KEY ("vibeId") REFERENCES "vibes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibe_saves" ADD CONSTRAINT "vibe_saves_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibe_shares" ADD CONSTRAINT "vibe_shares_vibeId_fkey" FOREIGN KEY ("vibeId") REFERENCES "vibes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibe_shares" ADD CONSTRAINT "vibe_shares_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_neighbourhoodId_fkey" FOREIGN KEY ("neighbourhoodId") REFERENCES "neighbourhoods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_participants" ADD CONSTRAINT "live_participants_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_participants" ADD CONSTRAINT "live_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_reactions" ADD CONSTRAINT "live_reactions_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_reactions" ADD CONSTRAINT "live_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_comments" ADD CONSTRAINT "live_comments_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_comments" ADD CONSTRAINT "live_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_moderation_events" ADD CONSTRAINT "live_moderation_events_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_moderation_events" ADD CONSTRAINT "live_moderation_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

