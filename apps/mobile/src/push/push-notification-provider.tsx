import * as Notifications from 'expo-notifications';
import {
  type PropsWithChildren,
  useEffect,
  useRef,
} from 'react';
import { useAuth } from '../auth/auth-context';
import { openPushConversation } from '../navigation/navigation-ref';
import { registerCurrentPushDevice } from './push-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function getConversationId(
  response: Notifications.NotificationResponse,
): string | null {
  const raw = response.notification.request.content.data;

  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const directType = raw.type;
  const directConversationId = raw.conversationId;

  if (
    directType === 'MESSAGE' &&
    typeof directConversationId === 'string' &&
    directConversationId.trim()
  ) {
    return directConversationId.trim();
  }

  const nested = raw.data;

  if (!nested || typeof nested !== 'object' || Array.isArray(nested)) {
    return null;
  }

  const nestedRecord = nested as Record<string, unknown>;

  if (
    nestedRecord.type === 'MESSAGE' &&
    typeof nestedRecord.conversationId === 'string' &&
    nestedRecord.conversationId.trim()
  ) {
    return nestedRecord.conversationId.trim();
  }

  return null;
}

export function PushNotificationProvider({
  children,
}: PropsWithChildren) {
  const { status, user } = useAuth();
  const lastHandledResponseId = useRef<string | null>(null);

  useEffect(() => {
    if (status !== 'authenticated' || !user) {
      return;
    }

    void registerCurrentPushDevice();
  }, [status, user]);

  useEffect(() => {
    if (status !== 'authenticated' || !user) {
      return;
    }

    const handleResponse = (
      response: Notifications.NotificationResponse,
    ) => {
      const responseId = response.notification.request.identifier;

      if (
        responseId &&
        lastHandledResponseId.current === responseId
      ) {
        return;
      }

      const conversationId = getConversationId(response);

      if (!conversationId) {
        return;
      }

      lastHandledResponseId.current = responseId;
      openPushConversation(conversationId);
    };

    const subscription =
      Notifications.addNotificationResponseReceivedListener(
        handleResponse,
      );

    void Notifications.getLastNotificationResponseAsync().then(
      (response) => {
        if (response) {
          handleResponse(response);
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, [status, user]);

  return children;
}
