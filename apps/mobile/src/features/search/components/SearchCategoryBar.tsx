import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '../../../components';
import { useNeighbourTheme } from '../../../theme';
import type { SearchCategory, SearchCategoryDefinition, SearchResultCounts } from '../types';

interface SearchCategoryBarProps {
  selected: SearchCategory;
  counts: SearchResultCounts;
  onSelect: (category: SearchCategory) => void;
}

const CATEGORIES: SearchCategoryDefinition[] = [
  {
    id: 'all',
    label: 'All',
    symbol: '⌕',
  },
  {
    id: 'people',
    label: 'People',
    symbol: '◉',
  },
  {
    id: 'communities',
    label: 'Communities',
    symbol: '◎',
  },
  {
    id: 'neighbourhoods',
    label: 'Places',
    symbol: '⌖',
  },
  {
    id: 'events',
    label: 'Events',
    symbol: '◇',
  },
  {
    id: 'posts',
    label: 'Posts',
    symbol: '▤',
  },
];

export function SearchCategoryBar({ selected, counts, onSelect }: SearchCategoryBarProps) {
  const { theme } = useNeighbourTheme();

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {CATEGORIES.map((category) => {
        const active = category.id === selected;
        const count = counts[category.id];

        return (
          <Pressable
            key={category.id}
            accessibilityRole="button"
            accessibilityState={{
              selected: active,
            }}
            onPress={() => {
              onSelect(category.id);
            }}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                borderColor: active ? theme.colors.primary : theme.colors.border,
                borderRadius: theme.radius.pill,
                opacity: pressed ? 0.76 : 1,
              },
            ]}
          >
            <AppText tone={active ? 'inverse' : 'secondary'}>{category.symbol}</AppText>

            <AppText variant="caption" tone={active ? 'inverse' : 'primary'} style={styles.label}>
              {category.label}
            </AppText>

            <AppText variant="caption" tone={active ? 'inverse' : 'muted'}>
              {count}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 9,
    paddingVertical: 2,
  },
  button: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  label: {
    fontWeight: '600',
  },
});
