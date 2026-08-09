import { Pressable, StyleSheet, View } from 'react-native';

import { useNeighbourTheme } from '../../theme';
import { AppText } from '../AppText';

interface CompactStatusCardProps {
  title: string;
  message: string;
  actionLabel?: string;
  onPress?: () => void;
  tone?: 'warning' | 'danger';
}

export default function CompactStatusCard({
  title,
  message,
  actionLabel = 'Try again',
  onPress,
  tone = 'warning',
}: CompactStatusCardProps) {
  const { theme } = useNeighbourTheme();

  const accent = tone === 'danger' ? theme.colors.danger : theme.colors.warning;

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      <View
        style={[
          styles.dot,
          {
            backgroundColor: accent,
          },
        ]}
      />

      <View style={styles.copy}>
        <AppText variant="bodyStrong">{title}</AppText>

        <AppText variant="caption" tone="secondary">
          {message}
        </AppText>
      </View>

      {onPress ? (
        <AppText variant="label" tone="brand">
          {actionLabel}
        </AppText>
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.72 : 1,
      })}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 11,
    minHeight: 62,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  dot: {
    borderRadius: 5,
    height: 8,
    width: 8,
  },

  copy: {
    flex: 1,
    gap: 2,
  },
});
