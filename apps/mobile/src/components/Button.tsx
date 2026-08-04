import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useNeighbourTheme } from '../theme';

import { AppText } from './AppText';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
}: ButtonProps) {
  const { theme } = useNeighbourTheme();
  const isDisabled = disabled || loading;

  const backgroundColor = {
    primary: theme.colors.primary,
    secondary: theme.colors.surface,
    ghost: 'transparent',
  }[variant];

  const borderColor = variant === 'secondary' ? theme.colors.borderStrong : 'transparent';

  const textTone = variant === 'primary' ? 'inverse' : 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor,
          borderColor,
          borderRadius: theme.radius.lg,
          minHeight: 56,
          opacity: isDisabled ? 0.5 : pressed ? 0.86 : 1,
        },
        variant === 'secondary' ? theme.shadows.subtle : undefined,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? theme.colors.inverseText : theme.colors.primary}
        />
      ) : (
        <>
          {icon}
          <AppText variant="bodyStrong" tone={textTone}>
            {label}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
});
