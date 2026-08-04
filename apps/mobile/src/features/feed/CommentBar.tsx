import { getComments } from '@neighbour/api-client';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../../components';
import { useNeighbourTheme } from '../../theme';

import { CommentSheet } from './CommentSheet';

interface CommentBarProps {
  postId: string;
}

export function CommentBar({ postId }: CommentBarProps) {
  const { theme } = useNeighbourTheme();

  const [open, setOpen] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadPreview = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getComments(postId, {
        limit: 30,
      });

      setLoadedCount(response.items.length);
    } catch {
      // The full comment sheet contains its own retry state.
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setOpen(true);
        }}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.colors.surfaceMuted,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.pill,
            opacity: pressed ? 0.76 : 1,
          },
        ]}
      >
        <AppText style={styles.symbol}>💬</AppText>

        {loading ? (
          <ActivityIndicator color={theme.colors.primary} size="small" />
        ) : (
          <AppText variant="caption" tone="secondary">
            {loadedCount > 0 ? `${loadedCount} comments` : 'Comment'}
          </AppText>
        )}
      </Pressable>

      <CommentSheet
        onClose={() => {
          setOpen(false);
        }}
        onCommentCreated={() => {
          setLoadedCount((value) => value + 1);
        }}
        postId={postId}
        visible={open}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 7,
    minHeight: 40,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  symbol: {
    fontSize: 17,
    lineHeight: 21,
  },
});
