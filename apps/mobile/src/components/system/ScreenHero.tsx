import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { useNeighbourTheme } from '../../theme';
import { AppText } from '../AppText';

interface ScreenHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  symbol: string;
}

export default function ScreenHero({
  eyebrow,
  title,
  description,
  symbol,
  children,
}: PropsWithChildren<ScreenHeroProps>) {
  const { theme } = useNeighbourTheme();

  return (
    <View
      style={[
        styles.hero,
        {
          backgroundColor: theme.colors.primaryStrong,
          borderRadius: theme.radius.xl,
        },
        theme.shadows.card,
      ]}
    >
      <View style={styles.headingRow}>
        <View
          style={[
            styles.symbol,
            {
              backgroundColor: 'rgba(255,255,255,0.13)',
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          <AppText tone="inverse" style={styles.symbolText}>
            {symbol}
          </AppText>
        </View>

        <View style={styles.headingCopy}>
          <AppText
            variant="overline"
            style={{
              color: theme.colors.inverseText,
              opacity: 0.72,
            }}
          >
            {eyebrow}
          </AppText>

          <AppText variant="title" tone="inverse">
            {title}
          </AppText>
        </View>
      </View>

      <AppText
        variant="body"
        style={{
          color: theme.colors.inverseText,
          opacity: 0.82,
        }}
      >
        {description}
      </AppText>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: 14,
    padding: 18,
  },

  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 13,
  },

  headingCopy: {
    flex: 1,
    gap: 1,
  },

  symbol: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },

  symbolText: {
    fontSize: 26,
    lineHeight: 30,
  },
});
