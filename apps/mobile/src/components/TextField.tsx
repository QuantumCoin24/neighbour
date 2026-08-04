import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useNeighbourTheme } from '../theme';

import { AppText } from './AppText';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, style, ...props }: TextFieldProps) {
  const { theme } = useNeighbourTheme();

  return (
    <View style={styles.wrapper}>
      <AppText variant="label">{label}</AppText>

      <TextInput
        {...props}
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.primary}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.inputBackground,
            borderColor: error ? theme.colors.danger : theme.colors.border,
            borderRadius: theme.radius.lg,
            color: theme.colors.text,
          },
          style,
        ]}
      />

      {error ? (
        <AppText variant="caption" style={{ color: theme.colors.danger }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
