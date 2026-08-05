import type { EventItem } from '@neighbour/api-client';
import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

function formatEventDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function CommunityEventCard({ event }: { event: EventItem }) {
  const { theme } = useNeighbourTheme();

  return (
    <Card variant="muted" style={styles.card}>
      <View
        style={[
          styles.icon,
          {
            backgroundColor: `${theme.colors.event}18`,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <AppText
          style={{
            color: theme.colors.event,
            fontSize: 22,
          }}
        >
          ◇
        </AppText>
      </View>

      <View style={styles.copy}>
        <AppText variant="bodyStrong">{event.title}</AppText>

        <AppText variant="caption" tone="brand">
          {formatEventDate(event.startsAt)}
        </AppText>

        <AppText variant="caption" tone="secondary" numberOfLines={3}>
          {event.description}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  icon: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  copy: {
    flex: 1,
    gap: 5,
  },
});
