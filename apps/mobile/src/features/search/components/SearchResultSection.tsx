import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../components';

interface SearchResultSectionProps {
  title: string;
  symbol: string;
  count: number;
}

export function SearchResultSection({
  title,
  symbol,
  count,
  children,
}: PropsWithChildren<SearchResultSectionProps>) {
  if (count === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.title}>
          <AppText tone="brand">{symbol}</AppText>

          <AppText variant="subheading">{title}</AppText>
        </View>

        <AppText variant="caption" tone="secondary">
          {count}
        </AppText>
      </View>

      <View style={styles.results}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 13,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 9,
  },
  results: {
    gap: 10,
  },
});
