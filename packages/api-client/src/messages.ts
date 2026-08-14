import { apiRequest } from './client';

export interface MessageActor {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
}

export interface MessageAttachment {
  id: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: MessageActor;
  parentMessageId: string | null;
  type: string;
  content: string | null;
  metadata: unknown;
  attachments: MessageAttachment[];
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMember {
  user: MessageActor;
  role: string;
  joinedAt: string;
  mutedUntil: string | null;
  pinnedAt: string | null;
  archivedAt: string | null;
  unreadCount: number;
  lastReadAt: string | null;
}

export interface Conversation {
  id: string;
  type: string;
  title: string | null;
  communityId: string | null;
  ownerId: string;
  members: ConversationMember[];
  lastMessage: Message | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationFeed {
  items: Conversation[];
  nextCursor: string | null;
}

export interface MessageFeed {
  items: Message[];
  nextCursor: string | null;
}

export interface ConversationQuery {
  cursor?: string;
  limit?: number;
  archived?: boolean;
}

export interface MessageQuery {
  cursor?: string;
  limit?: number;
}

export interface CreateConversationRequest {
  type: string;
  title?: string;
  memberIds: string[];
  communityId?: string;
}

export interface CreateMessageRequest {
  type?: string;
  content?: string;
  parentMessageId?: string;
  clientNonce?: string;
  metadata?: Record<string, unknown>;
  attachments?: {
    storageKey: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    width?: number;
    height?: number;
    durationMs?: number;
  }[];
}

export interface ConversationStateRequest {
  archived?: boolean;
  pinned?: boolean;
  mutedUntil?: string;
}

export interface MarkConversationReadResponse {
  unreadCount: number;
  lastReadAt: string;
}

function tokenHeaders(token?: string): HeadersInit | undefined {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined;
}

function buildQuery(query: ConversationQuery | MessageQuery): string {
  const parameters = new URLSearchParams();

  if (query.cursor) {
    parameters.set('cursor', query.cursor);
  }

  if (query.limit !== undefined) {
    parameters.set('limit', String(query.limit));
  }

  if ('archived' in query && query.archived !== undefined) {
    parameters.set('archived', String(query.archived));
  }

  const value = parameters.toString();

  return value ? `?${value}` : '';
}

export function createConversation(data: CreateConversationRequest): Promise<Conversation>;

export function createConversation(
  token: string,
  data: CreateConversationRequest,
): Promise<Conversation>;

export function createConversation(
  first: string | CreateConversationRequest,
  second?: CreateConversationRequest,
): Promise<Conversation> {
  const legacyCall = typeof first === 'string';

  const token = legacyCall ? first : undefined;
  const data = legacyCall ? second : first;

  if (!data) {
    throw new Error('Conversation data is required.');
  }

  return apiRequest<Conversation>('/messages/conversations', {
    method: 'POST',
    headers: tokenHeaders(token),
    body: JSON.stringify(data),
  });
}

export function getConversations(query?: ConversationQuery): Promise<ConversationFeed>;

export function getConversations(
  token: string,
  query?: ConversationQuery,
): Promise<ConversationFeed>;

export function getConversations(
  first: string | ConversationQuery = {},
  second: ConversationQuery = {},
): Promise<ConversationFeed> {
  const legacyCall = typeof first === 'string';

  const token = legacyCall ? first : undefined;
  const query = legacyCall ? second : first;

  return apiRequest<ConversationFeed>(`/messages/conversations${buildQuery(query)}`, {
    headers: tokenHeaders(token),
  });
}

export function getConversation(conversationId: string): Promise<Conversation>;

export function getConversation(token: string, conversationId: string): Promise<Conversation>;

export function getConversation(first: string, second?: string): Promise<Conversation> {
  const legacyCall = second !== undefined;

  const token = legacyCall ? first : undefined;
  const conversationId = legacyCall ? second : first;

  return apiRequest<Conversation>(`/messages/conversations/${encodeURIComponent(conversationId)}`, {
    headers: tokenHeaders(token),
  });
}

export function updateConversationState(
  conversationId: string,
  data: ConversationStateRequest,
): Promise<Conversation> {
  return apiRequest<Conversation>(`/messages/conversations/${encodeURIComponent(conversationId)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function sendMessage(conversationId: string, data: CreateMessageRequest): Promise<Message>;

export function sendMessage(
  token: string,
  conversationId: string,
  content: string,
): Promise<Message>;

export function sendMessage(
  first: string,
  second: string | CreateMessageRequest,
  third?: string,
): Promise<Message> {
  const legacyCall = third !== undefined;

  const token = legacyCall ? first : undefined;
  const conversationId = legacyCall ? (second as string) : first;
  const data: CreateMessageRequest = legacyCall
    ? {
        content: third,
      }
    : (second as CreateMessageRequest);

  return apiRequest<Message>(
    `/messages/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: 'POST',
      headers: tokenHeaders(token),
      body: JSON.stringify(data),
    },
  );
}

export function getMessages(conversationId: string, query?: MessageQuery): Promise<MessageFeed>;

export function getMessages(
  token: string,
  conversationId: string,
  query?: MessageQuery,
): Promise<MessageFeed>;

export function getMessages(
  first: string,
  second: string | MessageQuery = {},
  third: MessageQuery = {},
): Promise<MessageFeed> {
  const legacyCall = typeof second === 'string';

  const token = legacyCall ? first : undefined;
  const conversationId = legacyCall ? second : first;
  const query = legacyCall ? third : second;

  return apiRequest<MessageFeed>(
    `/messages/conversations/${encodeURIComponent(conversationId)}/messages${buildQuery(query)}`,
    {
      headers: tokenHeaders(token),
    },
  );
}

export function markConversationRead(
  conversationId: string,
  messageId?: string,
): Promise<MarkConversationReadResponse>;

export function markConversationRead(
  token: string,
  conversationId: string,
): Promise<MarkConversationReadResponse>;

export function markConversationRead(
  first: string,
  second?: string,
): Promise<MarkConversationReadResponse> {
  const legacyCall = second !== undefined;

  const token = legacyCall ? first : undefined;
  const conversationId = legacyCall ? second : first;
  const messageId = legacyCall ? undefined : second;

  return apiRequest<MarkConversationReadResponse>(
    `/messages/conversations/${encodeURIComponent(conversationId)}/read`,
    {
      method: 'POST',
      headers: tokenHeaders(token),
      body: JSON.stringify(
        messageId
          ? {
              messageId,
            }
          : {},
      ),
    },
  );
}
