import { apiRequest } from './client';

export interface MessageActor {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageActor;
  content: string | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  type: string;
  title: string | null;
  members: any[];
  lastMessage: Message | null;
  createdAt: string;
}

export interface ConversationFeed {
  items: Conversation[];
  nextCursor: string | null;
}

export interface MessageFeed {
  items: Message[];
  nextCursor: string | null;
}

export function createConversation(token: string, data: any) {
  return apiRequest<Conversation>('/messages/conversations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export function getConversations(token: string) {
  return apiRequest<ConversationFeed>('/messages/conversations', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getConversation(token: string, conversationId: string) {
  return apiRequest<Conversation>(`/messages/conversations/${conversationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function sendMessage(token: string, conversationId: string, content: string) {
  return apiRequest<Message>(`/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      content,
    }),
  });
}

export function getMessages(token: string, conversationId: string) {
  return apiRequest<MessageFeed>(`/messages/conversations/${conversationId}/messages`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function markConversationRead(token: string, conversationId: string) {
  return apiRequest(`/messages/conversations/${conversationId}/read`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
}
