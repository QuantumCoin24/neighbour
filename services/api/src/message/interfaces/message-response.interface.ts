import type {
  ConversationMemberRole,
  ConversationType,
  MessageType,
} from '../../generated/prisma/client';

export interface MessageActorResponse {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
}
export interface MessageAttachmentResponse {
  id: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
}
export interface MessageResponse {
  id: string;
  conversationId: string;
  sender: MessageActorResponse;
  parentMessageId: string | null;
  type: MessageType;
  content: string | null;
  metadata: unknown;
  attachments: MessageAttachmentResponse[];
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export interface ConversationMemberResponse {
  user: MessageActorResponse;
  role: ConversationMemberRole;
  joinedAt: Date;
  mutedUntil: Date | null;
  pinnedAt: Date | null;
  archivedAt: Date | null;
  unreadCount: number;
  lastReadAt: Date | null;
}
export interface ConversationResponse {
  id: string;
  type: ConversationType;
  title: string | null;
  communityId: string | null;
  ownerId: string;
  members: ConversationMemberResponse[];
  lastMessage: MessageResponse | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
export interface ConversationFeedResponse {
  items: ConversationResponse[];
  nextCursor: string | null;
}
export interface MessageFeedResponse {
  items: MessageResponse[];
  nextCursor: string | null;
}
