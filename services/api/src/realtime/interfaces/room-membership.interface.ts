import type { ConversationMemberRole } from '../../generated/prisma/client.js';

export interface RoomMembership {
  conversationId: string;
  userId: string;
  role: ConversationMemberRole;
  roomName: string;
  joinedAt: string;
}
