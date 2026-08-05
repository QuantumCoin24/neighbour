import type { GeoEntityType } from '@neighbour/api-client';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

interface MapFiltersProps {
  selectedTypes: GeoEntityType[];
  counts: Record<GeoEntityType, number>;
  onToggle: (type: GeoEntityType) => void;
}

const FILTERS: {
  type: GeoEntityType;
  label: string;
  symbol: string;
}[] = [
  {
    type: 'NEIGHBOURHOOD',
    label: 'Areas',
    symbol: '⌖',
  },
  {
    type: 'COMMUNITY',
    label: 'Communities',
    symbol: '◎',
  },
  {
    type: 'EVENT',
    label: 'Events',
    symbol: '◇',
  },
  {
    type: 'BUSINESS',
    label: 'Businesses',
    symbol: '▣',
  },
];

export function MapFilters({ selectedTypes, counts, onToggle }: MapFiltersProps) {
  const { theme } = useNeighbourTheme();

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {FILTERS.map((filter) => {
        const selected = selectedTypes.includes(filter.type);

        return (
          <Pressable
            key={filter.type}
            accessibilityRole="button"
            accessibilityState={{
              selected,
            }}
            onPress={() => {
              onToggle(filter.type);
            }}
            style={({ pressed }) => [
              styles.filter,
              {
                backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                borderColor: selected ? theme.colors.primary : theme.colors.border,
                borderRadius: theme.radius.pill,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <AppText tone={selected ? 'inverse' : 'brand'}>{filter.symbol}</AppText>

            <AppText variant="caption" tone={selected ? 'inverse' : 'primary'} style={styles.label}>
              {filter.label}
            </AppText>

            <View
              style={[
                styles.count,
                {
                  backgroundColor: selected ? 'rgba(255,255,255,0.18)' : theme.colors.surfaceMuted,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <AppText variant="caption" tone={selected ? 'inverse' : 'secondary'}>
                {counts[filter.type]}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 9,
  },
  filter: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 7,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  label: {
    fontWeight: '600',
  },
  count: {
    alignItems: 'center',
    minWidth: 23,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
});
