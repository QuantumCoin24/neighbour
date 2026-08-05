import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { AppText, Screen } from '../components';
import { ConversationList, useMessages } from '../features/messages';
import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

export default function MessagesScreen() {
  const { theme } = useNeighbourTheme();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const messages = useMessages();

  return (
    <Screen
      contentStyle={styles.screen}
      refreshControl={
        <RefreshControl
          refreshing={messages.refreshing}
          onRefresh={() => {
            void messages.refresh();
          }}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <AppText variant="overline" tone="brand">
          Private conversations
        </AppText>

        <AppText variant="title">Messages</AppText>

        <AppText variant="bodyLarge" tone="secondary">
          Stay connected with neighbours, communities and trusted local organisations.
        </AppText>

        <AppText variant="caption" tone="secondary">
          {messages.unreadCount === 0
            ? 'No unread messages'
            : messages.unreadCount === 1
              ? '1 unread message'
              : `${messages.unreadCount} unread messages`}
        </AppText>
      </View>

      <ConversationList
        onOpenConversation={(conversationId) => {
          navigation.navigate('Conversation', {
            conversationId,
          });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 24,
    paddingBottom: 40,
  },
  header: {
    gap: 10,
  },
});
