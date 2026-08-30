import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './routes';
import { ROUTES } from './routes';

export const navigationRef =
  createNavigationContainerRef<RootStackParamList>();

let pendingConversationId: string | null = null;

export function openPushConversation(conversationId: string): void {
  const id = conversationId.trim();

  if (!id) {
    return;
  }

  if (!navigationRef.isReady()) {
    pendingConversationId = id;
    return;
  }

  navigationRef.navigate(ROUTES.CONVERSATION, {
    conversationId: id,
  });
}

export function flushPendingPushNavigation(): void {
  if (!pendingConversationId || !navigationRef.isReady()) {
    return;
  }

  const conversationId = pendingConversationId;
  pendingConversationId = null;

  navigationRef.navigate(ROUTES.CONVERSATION, {
    conversationId,
  });
}
