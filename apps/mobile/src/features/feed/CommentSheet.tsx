import { createComment, getComments, type Comment } from '@neighbour/api-client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../auth/auth-context';
import { AppText, Card } from '../../components';
import { useNeighbourTheme } from '../../theme';

import { FeedAvatar } from './FeedAvatar';
import { RelativeTime } from './RelativeTime';

interface CommentSheetProps {
  postId: string;
  visible: boolean;
  onClose: () => void;
  onCommentCreated?: () => void;
}

const PAGE_SIZE = 30;

function CommentItem({ comment }: { comment: Comment }) {
  const optimistic = comment.id.startsWith('optimistic-');

  return (
    <View style={styles.comment}>
      <FeedAvatar avatarUrl={comment.author.avatarUrl} displayName={comment.author.displayName} />

      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <AppText variant="bodyStrong">{comment.author.displayName}</AppText>

          <RelativeTime date={comment.createdAt} />
        </View>

        <AppText tone="secondary">{comment.content}</AppText>

        {optimistic ? (
          <AppText variant="caption" tone="muted">
            Posting…
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

export function CommentSheet({ postId, visible, onClose, onCommentCreated }: CommentSheetProps) {
  const { theme } = useNeighbourTheme();
  const { user } = useAuth();

  const [comments, setComments] = useState<Comment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedText = text.trim();

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getComments(postId, {
        limit: PAGE_SIZE,
      });

      setComments(response.items);
      setNextCursor(response.nextCursor);
    } catch {
      setError('Comments could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const response = await getComments(postId, {
        limit: PAGE_SIZE,
      });

      setComments(response.items);
      setNextCursor(response.nextCursor);
    } catch {
      setError('Comments could not be refreshed.');
    } finally {
      setRefreshing(false);
    }
  }, [postId]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const response = await getComments(postId, {
        cursor: nextCursor,
        limit: PAGE_SIZE,
      });

      setComments((current) => {
        const existingIds = new Set(current.map((comment) => comment.id));

        return [...current, ...response.items.filter((comment) => !existingIds.has(comment.id))];
      });

      setNextCursor(response.nextCursor);
    } catch {
      setError('More comments could not be loaded.');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor, postId]);

  useEffect(() => {
    if (visible) {
      void loadInitial();
    }
  }, [loadInitial, visible]);

  const submit = useCallback(async () => {
    if (!trimmedText || posting || !user) {
      return;
    }

    const optimisticId = `optimistic-${Date.now()}`;
    const now = new Date().toISOString();

    const optimisticComment: Comment = {
      id: optimisticId,
      postId,
      parentId: null,
      content: trimmedText,
      editedAt: null,
      createdAt: now,
      updatedAt: now,
      author: {
        id: user.id,
        displayName: user.displayName,
        username: null,
        avatarUrl: null,
      },
    };

    setComments((current) => [optimisticComment, ...current]);
    setText('');
    setPosting(true);
    setError(null);

    try {
      const created = await createComment(postId, trimmedText);

      setComments((current) =>
        current.map((comment) => (comment.id === optimisticId ? created : comment)),
      );

      onCommentCreated?.();
    } catch {
      setComments((current) => current.filter((comment) => comment.id !== optimisticId));
      setText(trimmedText);
      setError('Your comment could not be posted.');
    } finally {
      setPosting(false);
    }
  }, [onCommentCreated, postId, posting, trimmedText, user]);

  const footer = useMemo(() => {
    if (loadingMore) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator color={theme.colors.primary} size="small" />

          <AppText variant="caption" tone="secondary">
            Loading more comments…
          </AppText>
        </View>
      );
    }

    if (nextCursor) {
      return (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void loadMore();
          }}
          style={[
            styles.loadMore,
            {
              borderColor: theme.colors.borderStrong,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          <AppText variant="label" tone="brand">
            Load more comments
          </AppText>
        </Pressable>
      );
    }

    return null;
  }, [
    loadMore,
    loadingMore,
    nextCursor,
    theme.colors.borderStrong,
    theme.colors.primary,
    theme.radius.lg,
  ]);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <View
            style={[
              styles.header,
              {
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <View>
              <AppText variant="heading">Comments</AppText>

              <AppText variant="caption" tone="secondary">
                {comments.length === 1 ? '1 loaded comment' : `${comments.length} loaded comments`}
              </AppText>
            </View>

            <Pressable
              accessibilityLabel="Close comments"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderRadius: theme.radius.pill,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <AppText variant="bodyStrong">Done</AppText>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.colors.primary} size="large" />

              <AppText tone="secondary">Loading comments…</AppText>
            </View>
          ) : (
            <FlatList
              contentContainerStyle={[
                styles.list,
                comments.length === 0 ? styles.emptyList : undefined,
              ]}
              data={comments}
              keyExtractor={(comment) => comment.id}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Card variant="muted" style={styles.emptyCard}>
                  <AppText variant="subheading">Start the conversation</AppText>

                  <AppText tone="secondary">
                    Be the first neighbour to comment on this post.
                  </AppText>
                </Card>
              }
              ListFooterComponent={footer}
              onEndReached={() => {
                if (nextCursor) {
                  void loadMore();
                }
              }}
              onEndReachedThreshold={0.4}
              onRefresh={() => {
                void refresh();
              }}
              refreshing={refreshing}
              renderItem={({ item }) => <CommentItem comment={item} />}
              showsVerticalScrollIndicator={false}
            />
          )}

          {error ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void refresh();
              }}
              style={styles.error}
            >
              <AppText
                variant="caption"
                style={{
                  color: theme.colors.danger,
                }}
              >
                {error} Tap to retry.
              </AppText>
            </Pressable>
          ) : null}

          <View
            style={[
              styles.composer,
              {
                backgroundColor: theme.colors.backgroundElevated,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            <TextInput
              accessibilityLabel="Write a comment"
              editable={!posting}
              maxLength={2000}
              multiline
              onChangeText={setText}
              placeholder="Write a comment…"
              placeholderTextColor={theme.colors.textMuted}
              selectionColor={theme.colors.primary}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.inputBackground,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.lg,
                  color: theme.colors.text,
                },
              ]}
              value={text}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                disabled: !trimmedText || posting || !user,
                busy: posting,
              }}
              disabled={!trimmedText || posting || !user}
              onPress={() => {
                void submit();
              }}
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.radius.lg,
                  opacity: !trimmedText || posting || !user ? 0.45 : pressed ? 0.78 : 1,
                },
              ]}
            >
              {posting ? (
                <ActivityIndicator color={theme.colors.inverseText} size="small" />
              ) : (
                <AppText variant="label" tone="inverse">
                  Post
                </AppText>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  list: {
    gap: 18,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyCard: {
    gap: 8,
  },
  comment: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  commentBody: {
    flex: 1,
    gap: 6,
  },
  commentHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  footer: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  loadMore: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 50,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  error: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  composer: {
    alignItems: 'flex-end',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    borderWidth: 1,
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 130,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sendButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 64,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
