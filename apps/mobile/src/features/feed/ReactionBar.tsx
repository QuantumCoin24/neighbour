import {
  removeReaction,
  setReaction,
  type FeedPostEngagement,
  type ReactionType,
} from '@neighbour/api-client';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { useNeighbourTheme } from '../../theme';

interface ReactionBarProps {
  postId: string;
  initialEngagement: FeedPostEngagement;
}

interface ReactionOption {
  type: ReactionType;
  symbol: string;
  label: string;
}

const REACTIONS: ReactionOption[] = [
  {
    type: 'LIKE',
    symbol: '👍',
    label: 'Like',
  },
  {
    type: 'LOVE',
    symbol: '❤️',
    label: 'Love',
  },
  {
    type: 'SUPPORT',
    symbol: '🏡',
    label: 'Helpful',
  },
  {
    type: 'CELEBRATE',
    symbol: '👏',
    label: 'Thanks',
  },
  {
    type: 'INSIGHTFUL',
    symbol: '💡',
    label: 'Useful',
  },
];

function createCountMap(engagement: FeedPostEngagement): Record<ReactionType, number> {
  const result: Record<ReactionType, number> = {
    LIKE: 0,
    LOVE: 0,
    SUPPORT: 0,
    CELEBRATE: 0,
    INSIGHTFUL: 0,
  };

  for (const entry of engagement.reactionCounts) {
    result[entry.type] = entry.count;
  }

  return result;
}

export function ReactionBar({ postId, initialEngagement }: ReactionBarProps) {
  const { theme } = useNeighbourTheme();

  const [counts, setCounts] = useState<Record<ReactionType, number>>(() =>
    createCountMap(initialEngagement),
  );

  const [viewerReaction, setViewerReaction] = useState<ReactionType | null>(
    initialEngagement.viewerReaction,
  );

  const [updating, setUpdating] = useState<ReactionType | null>(null);

  const total = useMemo(
    () => Object.values(counts).reduce((sum, count) => sum + count, 0),
    [counts],
  );

  const react = async (type: ReactionType) => {
    if (updating) {
      return;
    }

    const previousReaction = viewerReaction;
    const previousCounts = {
      ...counts,
    };

    setUpdating(type);

    if (previousReaction === type) {
      setViewerReaction(null);
      setCounts((current) => ({
        ...current,
        [type]: Math.max(0, current[type] - 1),
      }));

      try {
        await removeReaction(postId);
      } catch {
        setViewerReaction(previousReaction);
        setCounts(previousCounts);
      } finally {
        setUpdating(null);
      }

      return;
    }

    setViewerReaction(type);

    setCounts((current) => {
      const next = {
        ...current,
      };

      if (previousReaction) {
        next[previousReaction] = Math.max(0, next[previousReaction] - 1);
      }

      next[type] += 1;

      return next;
    });

    try {
      await setReaction(postId, type);
    } catch {
      setViewerReaction(previousReaction);
      setCounts(previousCounts);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <View style={styles.container}>
      {total > 0 ? (
        <View style={styles.summary}>
          <View style={styles.summarySymbols}>
            {REACTIONS.filter((reaction) => counts[reaction.type] > 0)
              .slice(0, 3)
              .map((reaction) => (
                <AppText key={reaction.type} style={styles.summarySymbol}>
                  {reaction.symbol}
                </AppText>
              ))}
          </View>

          <AppText variant="caption" tone="secondary">
            {total} {total === 1 ? 'reaction' : 'reactions'}
          </AppText>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.reactions}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {REACTIONS.map((reaction) => {
          const selected = viewerReaction === reaction.type;

          const count = counts[reaction.type];

          return (
            <Pressable
              accessibilityLabel={`${reaction.label}${count > 0 ? `, ${count}` : ''}`}
              accessibilityRole="button"
              accessibilityState={{
                selected,
                busy: updating === reaction.type,
              }}
              disabled={updating !== null}
              key={reaction.type}
              onPress={() => {
                void react(reaction.type);
              }}
              style={({ pressed }) => [
                styles.reaction,
                {
                  backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surfaceMuted,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  borderRadius: theme.radius.pill,
                  opacity: pressed || updating !== null ? 0.68 : 1,
                },
              ]}
            >
              {updating === reaction.type ? (
                <ActivityIndicator color={theme.colors.primary} size="small" />
              ) : (
                <>
                  <AppText style={styles.symbol}>{reaction.symbol}</AppText>

                  <AppText variant="caption" tone={selected ? 'brand' : 'secondary'}>
                    {count > 0 ? `${reaction.label} ${count}` : reaction.label}
                  </AppText>
                </>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 9,
  },
  summary: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  summarySymbols: {
    flexDirection: 'row',
  },
  summarySymbol: {
    fontSize: 14,
    lineHeight: 18,
    marginRight: -2,
  },
  reactions: {
    gap: 7,
  },
  reaction: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  symbol: {
    fontSize: 15,
    lineHeight: 18,
  },
});
