import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '../../components';
import { useNeighbourTheme } from '../../theme';

import { CommentSheet } from './CommentSheet';

interface CommentBarProps {
  postId: string;
  initialCount: number;
}

export function CommentBar({ postId, initialCount }: CommentBarProps) {
  const { theme } = useNeighbourTheme();

  const [open, setOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCount);

  return (
    <>
      <Pressable
        accessibilityLabel={
          commentCount === 0 ? 'Comment on this post' : `View ${commentCount} comments`
        }
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

        <AppText variant="caption" tone="secondary">
          {commentCount > 0
            ? `${commentCount} ${commentCount === 1 ? 'comment' : 'comments'}`
            : 'Comment'}
        </AppText>
      </Pressable>

      <CommentSheet
        onClose={() => {
          setOpen(false);
        }}
        onCommentCreated={() => {
          setCommentCount((value) => value + 1);
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
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 7,
    minHeight: 38,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  symbol: {
    fontSize: 15,
    lineHeight: 18,
  },
});
