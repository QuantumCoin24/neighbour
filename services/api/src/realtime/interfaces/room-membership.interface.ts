import type { ConversationMemberRole } from '../../generated/prisma/enums.js';

export interface RoomMembership {
  conversationId: string;
  userId: string;
  role: ConversationMemberRole;
  roomName: string;
  joinedAt: string;
}
