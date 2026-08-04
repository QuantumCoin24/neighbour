import { ApiClientError, apiRequest } from './client';

export interface DashboardProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  localArea: string | null;
  showLocalArea: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardCommunitySummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardCommunityMembership {
  id: string;
  role: string;
  status: string;
  joinedAt: string;
  updatedAt: string;
  community: DashboardCommunitySummary;
}

export interface DashboardConversationMember {
  user: {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
  };
  role: string;
  joinedAt: string;
  mutedUntil: string | null;
  pinnedAt: string | null;
  archivedAt: string | null;
  unreadCount: number;
  lastReadAt: string | null;
}

export interface DashboardConversation {
  id: string;
  type: string;
  title: string | null;
  communityId: string | null;
  ownerId: string;
  members: DashboardConversationMember[];
  lastMessage: {
    id: string;
    conversationId: string;
    sender: {
      id: string;
      displayName: string;
      username: string | null;
      avatarUrl: string | null;
    };
    content: string | null;
    createdAt: string;
  } | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardConversationFeed {
  items: DashboardConversation[];
  nextCursor: string | null;
}

export interface DashboardNotificationSummary {
  unreadCount: number;
}

export interface DashboardData {
  profile: DashboardProfile | null;
  communities: DashboardCommunityMembership[];
  conversations: DashboardConversation[];
  unreadMessages: number;
  unreadNotifications: number;
}

async function getDashboardProfile(): Promise<DashboardProfile | null> {
  try {
    return await apiRequest<DashboardProfile>('/profiles/me');
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const [profile, communities, conversations, notifications] = await Promise.all([
    getDashboardProfile(),
    apiRequest<DashboardCommunityMembership[]>('/communities/mine'),
    apiRequest<DashboardConversationFeed>('/messages/conversations?limit=5'),
    apiRequest<DashboardNotificationSummary>('/notifications/unread-count'),
  ]);

  const unreadMessages = conversations.items.reduce(
    (total, conversation) =>
      total +
      conversation.members.reduce((memberTotal, member) => memberTotal + member.unreadCount, 0),
    0,
  );

  return {
    profile,
    communities,
    conversations: conversations.items,
    unreadMessages,
    unreadNotifications: notifications.unreadCount,
  };
}
