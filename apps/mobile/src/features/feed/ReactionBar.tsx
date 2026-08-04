import {
  getReactionSummary,
  removeReaction,
  setReaction,
  type ReactionSummary,
  type ReactionType,
} from '@neighbour/api-client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { useNeighbourTheme } from '../../theme';

interface ReactionBarProps {
  postId: string;
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
    symbol: '🤝',
    label: 'Support',
  },
  {
    type: 'CELEBRATE',
    symbol: '🎉',
    label: 'Celebrate',
  },
  {
    type: 'INSIGHTFUL',
    symbol: '💡',
    label: 'Insightful',
  },
];

function emptySummary(): ReactionSummary {
  return {
    counts: [],
    total: 0,
    viewerReaction: null,
  };
}

function getReactionCount(summary: ReactionSummary, type: ReactionType): number {
  return summary.counts.find((count) => count.type === type)?.count ?? 0;
}

function updateReactionCount(
  summary: ReactionSummary,
  type: ReactionType,
  adjustment: number,
): ReactionSummary {
  const existingCount = getReactionCount(summary, type);
  const updatedCount = Math.max(0, existingCount + adjustment);

  const otherCounts = summary.counts.filter((count) => count.type !== type);

  return {
    ...summary,
    counts:
      updatedCount > 0
        ? [
            ...otherCounts,
            {
              type,
              count: updatedCount,
            },
          ]
        : otherCounts,
    total: Math.max(0, summary.total + adjustment),
  };
}

function applyOptimisticReaction(
  summary: ReactionSummary,
  nextReaction: ReactionType,
): ReactionSummary {
  const currentReaction = summary.viewerReaction;

  if (currentReaction === nextReaction) {
    return {
      ...updateReactionCount(summary, currentReaction, -1),
      viewerReaction: null,
    };
  }

  let nextSummary = summary;

  if (currentReaction) {
    nextSummary = updateReactionCount(nextSummary, currentReaction, -1);
  }

  nextSummary = updateReactionCount(nextSummary, nextReaction, 1);

  return {
    ...nextSummary,
    viewerReaction: nextReaction,
  };
}

export function ReactionBar({ postId }: ReactionBarProps) {
  const { theme } = useNeighbourTheme();

  const [summary, setSummary] = useState<ReactionSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getReactionSummary(postId);

      setSummary(response);
    } catch {
      setError('Reactions unavailable');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const visibleReactions = useMemo(
    () =>
      REACTIONS.map((reaction) => ({
        ...reaction,
        count: getReactionCount(summary, reaction.type),
        selected: summary.viewerReaction === reaction.type,
      })),
    [summary],
  );

  const handleReaction = useCallback(
    async (reaction: ReactionType) => {
      if (updating) {
        return;
      }

      const previousSummary = summary;
      const removing = summary.viewerReaction === reaction;
      const optimisticSummary = applyOptimisticReaction(summary, reaction);

      setSummary(optimisticSummary);
      setUpdating(true);
      setError(null);

      try {
        if (removing) {
          await removeReaction(postId);
        } else {
          await setReaction(postId, reaction);
        }
      } catch {
        setSummary(previousSummary);
        setError('Reaction could not be saved');
      } finally {
        setUpdating(false);
      }
    },
    [postId, summary, updating],
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="small" />

        <AppText variant="caption" tone="muted">
          Loading reactions…
        </AppText>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.summary}>
        <AppText variant="caption" tone="secondary">
          {summary.total === 1 ? '1 reaction' : `${summary.total} reactions`}
        </AppText>

        {updating ? <ActivityIndicator color={theme.colors.primary} size="small" /> : null}
      </View>

      <View style={styles.options}>
        {visibleReactions.map((reaction) => (
          <Pressable
            key={reaction.type}
            accessibilityLabel={`${reaction.label}, ${reaction.count} reactions`}
            accessibilityRole="button"
            accessibilityState={{
              selected: reaction.selected,
              disabled: updating,
            }}
            disabled={updating}
            onPress={() => {
              void handleReaction(reaction.type);
            }}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor: reaction.selected
                  ? theme.colors.primarySoft
                  : theme.colors.surfaceMuted,
                borderColor: reaction.selected ? theme.colors.primary : theme.colors.border,
                borderRadius: theme.radius.pill,
                opacity: updating ? 0.62 : pressed ? 0.76 : 1,
              },
            ]}
          >
            <AppText style={styles.symbol}>{reaction.symbol}</AppText>

            {reaction.count > 0 ? (
              <AppText
                variant="caption"
                style={{
                  color: reaction.selected ? theme.colors.primary : theme.colors.textSecondary,
                  fontWeight: '600',
                }}
              >
                {reaction.count}
              </AppText>
            ) : null}
          </Pressable>
        ))}
      </View>

      {error ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void loadSummary();
          }}
          style={styles.error}
        >
          <AppText
            variant="caption"
            style={{
              color: theme.colors.danger,
            }}
          >
            {error}. Tap to retry.
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
    paddingTop: 14,
  },
  loading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minHeight: 38,
  },
  summary: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 5,
    minHeight: 38,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  symbol: {
    fontSize: 17,
    lineHeight: 21,
  },
  error: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
});
