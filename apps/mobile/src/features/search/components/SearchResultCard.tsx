import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

interface SearchResultCardProps {
  symbol: string;
  title: string;
  description?: string | null;
  metadata?: string | null;
  accent: 'primary' | 'community' | 'event' | 'information' | 'business';
  onPress?: () => void;
}

export function SearchResultCard({
  symbol,
  title,
  description,
  metadata,
  accent,
  onPress,
}: SearchResultCardProps) {
  const { theme } = useNeighbourTheme();

  const accentColor = {
    primary: theme.colors.primary,
    community: theme.colors.community,
    event: theme.colors.event,
    information: theme.colors.information,
    business: theme.colors.business,
  }[accent];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.77 : 1,
      })}
    >
      <Card variant="muted" style={styles.card}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: `${accentColor}18`,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          <AppText
            style={{
              color: accentColor,
              fontSize: 21,
              lineHeight: 25,
            }}
          >
            {symbol}
          </AppText>
        </View>

        <View style={styles.copy}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {title}
          </AppText>

          {description ? (
            <AppText variant="caption" tone="secondary" numberOfLines={2}>
              {description}
            </AppText>
          ) : null}

          {metadata ? (
            <AppText variant="caption" tone="brand">
              {metadata}
            </AppText>
          ) : null}
        </View>

        <AppText tone="muted">›</AppText>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
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
