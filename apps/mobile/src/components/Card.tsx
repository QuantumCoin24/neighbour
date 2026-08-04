import type { PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useNeighbourTheme } from '../theme';

interface CardProps {
  variant?: 'default' | 'muted' | 'glass';
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  variant = 'default',
  padded = true,
  style,
}: PropsWithChildren<CardProps>) {
  const { theme } = useNeighbourTheme();

  const backgroundColor = {
    default: theme.colors.surface,
    muted: theme.colors.surfaceMuted,
    glass: theme.colors.glass,
  }[variant];

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.xl,
          padding: padded ? theme.spacing.xl : 0,
        },
        theme.shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
