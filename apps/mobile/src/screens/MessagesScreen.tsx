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
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.primaryStrong,
            borderRadius: theme.radius.xl,
          },
          theme.shadows.card,
        ]}
      >
        <View style={styles.messageBrand}>
          <View
            style={[
              styles.messageGlyph,
              {
                backgroundColor: 'rgba(255,255,255,0.14)',
                borderRadius: theme.radius.lg,
              },
            ]}
          >
            <AppText tone="inverse" style={styles.messageGlyphText}>
              ◌
            </AppText>
          </View>

          <View style={styles.messageCopy}>
            <AppText
              variant="overline"
              style={{
                color: theme.colors.inverseText,
                opacity: 0.72,
              }}
            >
              PRIVATE & LOCAL
            </AppText>

            <AppText variant="title" tone="inverse">
              Messages
            </AppText>
          </View>

          <View
            style={[
              styles.unreadBadge,
              {
                backgroundColor: theme.colors.inverseText,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="label" tone="brand">
              {messages.unreadCount}
            </AppText>
          </View>
        </View>

        <AppText
          variant="bodyLarge"
          style={{
            color: theme.colors.inverseText,
            opacity: 0.84,
          }}
        >
          Conversations with the people and places around you.
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
  messageBrand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  messageGlyph: {
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  messageGlyphText: {
    fontSize: 30,
    lineHeight: 34,
  },
  messageCopy: {
    flex: 1,
    gap: 2,
  },
  unreadBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
    minWidth: 34,
    paddingHorizontal: 9,
  },
});
