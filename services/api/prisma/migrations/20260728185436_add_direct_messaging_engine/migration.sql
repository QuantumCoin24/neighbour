-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'GROUP', 'COMMUNITY', 'BUSINESS', 'ORGANISATION', 'SUPPORT');

-- CreateEnum
CREATE TYPE "ConversationMemberRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'FILE', 'SYSTEM');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MESSAGE';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "conversationId" UUID,
ADD COLUMN     "messageId" UUID;

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "type" "ConversationType" NOT NULL,
    "title" TEXT,
    "ownerId" UUID NOT NULL,
    "communityId" UUID,
    "directKey" TEXT,
    "lastMessageId" UUID,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_members" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "ConversationMemberRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "mutedUntil" TIMESTAMP(3),
    "pinnedAt" TIMESTAMP(3),
    "lastReadMessageId" UUID,
    "lastReadAt" TIMESTAMP(3),
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "parentMessageId" UUID,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "content" TEXT,
    "clientNonce" TEXT,
    "metadata" JSONB,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_attachments" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_read_receipts" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_read_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversations_directKey_key" ON "conversations"("directKey");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_lastMessageId_key" ON "conversations"("lastMessageId");

-- CreateIndex
CREATE INDEX "conversations_ownerId_updatedAt_idx" ON "conversations"("ownerId", "updatedAt");

-- CreateIndex
CREATE INDEX "conversations_communityId_updatedAt_idx" ON "conversations"("communityId", "updatedAt");

-- CreateIndex
CREATE INDEX "conversations_type_updatedAt_idx" ON "conversations"("type", "updatedAt");

-- CreateIndex
CREATE INDEX "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "conversation_members_userId_archivedAt_updatedAt_idx" ON "conversation_members"("userId", "archivedAt", "updatedAt");

-- CreateIndex
CREATE INDEX "conversation_members_conversationId_leftAt_idx" ON "conversation_members"("conversationId", "leftAt");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_members_conversationId_userId_key" ON "conversation_members"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_senderId_createdAt_idx" ON "messages"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "messages_parentMessageId_idx" ON "messages"("parentMessageId");

-- CreateIndex
CREATE INDEX "messages_deletedAt_idx" ON "messages"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "messages_conversationId_senderId_clientNonce_key" ON "messages"("conversationId", "senderId", "clientNonce");

-- CreateIndex
CREATE INDEX "message_attachments_messageId_idx" ON "message_attachments"("messageId");

-- CreateIndex
CREATE INDEX "message_attachments_storageKey_idx" ON "message_attachments"("storageKey");

-- CreateIndex
CREATE INDEX "message_read_receipts_userId_readAt_idx" ON "message_read_receipts"("userId", "readAt");

-- CreateIndex
CREATE INDEX "message_read_receipts_messageId_readAt_idx" ON "message_read_receipts"("messageId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "message_read_receipts_messageId_userId_key" ON "message_read_receipts"("messageId", "userId");

-- CreateIndex
CREATE INDEX "notifications_conversationId_idx" ON "notifications"("conversationId");

-- CreateIndex
CREATE INDEX "notifications_messageId_idx" ON "notifications"("messageId");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_lastMessageId_fkey" FOREIGN KEY ("lastMessageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_parentMessageId_fkey" FOREIGN KEY ("parentMessageId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_read_receipts" ADD CONSTRAINT "message_read_receipts_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_read_receipts" ADD CONSTRAINT "message_read_receipts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
