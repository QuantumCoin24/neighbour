import type { Business } from '@neighbour/api-client';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

export function CommunityBusinessCard({
  business,
  onPress,
}: {
  business: Business;
  onPress?: () => void;
}) {
  const { theme } = useNeighbourTheme();

  const content = (
    <Card variant="muted" style={styles.card}>
      <View
        style={[
          styles.icon,
          {
            backgroundColor: `${theme.colors.business}18`,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <AppText
          style={{
            color: theme.colors.business,
            fontSize: 22,
          }}
        >
          ▣
        </AppText>
      </View>

      <View style={styles.copy}>
        <View style={styles.heading}>
          <AppText variant="bodyStrong" numberOfLines={1} style={styles.title}>
            {business.name}
          </AppText>

          {business.verified ? (
            <AppText variant="caption" tone="brand">
              Verified ✓
            </AppText>
          ) : null}
        </View>

        <AppText variant="caption" tone="brand">
          {business.category}
        </AppText>

        <AppText variant="caption" tone="secondary" numberOfLines={3}>
          {business.description}
        </AppText>
      </View>
    </Card>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${business.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed ? styles.pressed : null]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  pressed: {
    opacity: 0.82,
  },
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
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  title: {
    flex: 1,
  },
});
