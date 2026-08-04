import type { PropsWithChildren } from 'react';
import { Text, type TextProps, type TextStyle, type StyleProp } from 'react-native';

import { type TypographyVariant, useNeighbourTheme } from '../theme';

interface AppTextProps extends TextProps {
  variant?: TypographyVariant;
  tone?: 'primary' | 'secondary' | 'muted' | 'inverse' | 'brand';
  style?: StyleProp<TextStyle>;
}

export function AppText({
  children,
  variant = 'body',
  tone = 'primary',
  style,
  ...props
}: PropsWithChildren<AppTextProps>) {
  const { theme } = useNeighbourTheme();

  const color = {
    primary: theme.colors.text,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    inverse: theme.colors.inverseText,
    brand: theme.colors.primary,
  }[tone];

  return (
    <Text {...props} style={[theme.typography[variant], { color }, style]}>
      {children}
    </Text>
  );
}
