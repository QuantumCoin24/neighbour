import type { FeedPostType } from '@neighbour/api-client';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { useNeighbourTheme } from '../../theme';

interface PostTypeBadgeProps {
  type: FeedPostType;
  pinned?: boolean;
}

const TYPE_CONFIG: Record<
  FeedPostType,
  {
    label: string;
    symbol: string;
  }
> = {
  STANDARD: {
    label: 'Community post',
    symbol: '✎',
  },
  ANNOUNCEMENT: {
    label: 'Announcement',
    symbol: '◉',
  },
  QUESTION: {
    label: 'Question',
    symbol: '?',
  },
  RECOMMENDATION: {
    label: 'Recommendation',
    symbol: '★',
  },
  HELP_REQUEST: {
    label: 'Help request',
    symbol: '♡',
  },
  LOST_FOUND: {
    label: 'Lost & found',
    symbol: '⌕',
  },
  SAFETY_ALERT: {
    label: 'Safety alert',
    symbol: '!',
  },
  ROAD_CLOSURE: {
    label: 'Road closure',
    symbol: '↯',
  },
  LOCAL_UPDATE: {
    label: 'Local update',
    symbol: '⌖',
  },
  POLL: {
    label: 'Poll',
    symbol: '▤',
  },
  EVENT_SHARE: {
    label: 'Event',
    symbol: '◇',
  },
  MARKETPLACE_SHARE: {
    label: 'Marketplace',
    symbol: '▣',
  },
  BUSINESS_UPDATE: {
    label: 'Business update',
    symbol: '▥',
  },
  VOLUNTEER_REQUEST: {
    label: 'Volunteers needed',
    symbol: '+',
  },
};

export function PostTypeBadge({ type, pinned = false }: PostTypeBadgeProps) {
  const { theme } = useNeighbourTheme();
  const config = TYPE_CONFIG[type];

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: theme.colors.primarySoft,
            borderRadius: theme.radius.pill,
          },
        ]}
      >
        <AppText variant="caption" tone="brand" style={styles.symbol}>
          {config.symbol}
        </AppText>

        <AppText variant="caption" tone="brand">
          {config.label}
        </AppText>
      </View>

      {pinned ? (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="caption" tone="secondary">
            Pinned
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  badge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  symbol: {
    fontWeight: '800',
  },
});
