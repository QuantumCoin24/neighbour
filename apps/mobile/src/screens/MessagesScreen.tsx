import type { NavigationProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { AppText, Screen } from '../components';
import ScreenHero from '../components/system/ScreenHero';
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
      <ScreenHero
        eyebrow="PRIVATE & LOCAL"
        title="Messages"
        description="Private conversations with neighbours, communities and local connections."
        symbol="◌"
      >
        {messages.unreadCount > 0 ? (
          <View
            style={[
              styles.unreadPill,
              {
                backgroundColor: 'rgba(255,255,255,0.14)',
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="caption" tone="inverse">
              {messages.unreadCount} unread
            </AppText>
          </View>
        ) : null}
      </ScreenHero>

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
    gap: 18,
    paddingBottom: 40,
  },

  unreadPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
});
