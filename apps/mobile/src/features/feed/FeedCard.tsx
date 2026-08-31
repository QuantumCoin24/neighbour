import { updatePost, type FeedPost } from '@neighbour/api-client';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../../auth/auth-context';
import { AppText, Card } from '../../components';
import { useNeighbourTheme } from '../../theme';

import { CommentBar } from './CommentBar';
import { CommunityBadge } from './CommunityBadge';
import { FeedAvatar } from './FeedAvatar';
import { MediaGallery } from '../media';
import { ReactionBar } from './ReactionBar';
import { RelativeTime } from './RelativeTime';

interface FeedCardProps {
  post: FeedPost;
}

export function FeedCard({ post }: FeedCardProps) {
  const { theme } = useNeighbourTheme();
  const { user } = useAuth();
  const [localPost, setLocalPost] = useState<FeedPost | null>(null);
  const [editing, setEditing] = useState(false);
  const [editingContent, setEditingContent] = useState(post.content);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    setLocalPost(null);
    setEditingContent(activePost.content);
    setEditing(false);
  }, [post]);

  const activePost = localPost ?? post;
  const mine = Boolean(user?.id && activePost.author.id === user.id);

  const contextLabel =
    activePost.community?.name ??
    activePost.neighbourhood?.name ??
    activePost.author.localArea;

  const timestamp = activePost.publishedAt ?? activePost.createdAt;

  const startEditing = () => {
    setEditingContent(activePost.content);
    setEditing(true);
  };

  const openPostMenu = () => {
    if (!mine) {
      return;
    }

    Alert.alert('Post options', undefined, [
      {
        text: 'Edit Post',
        onPress: startEditing,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const saveEdit = async () => {
    const content = editingContent.trim();

    if (!content || editSaving) {
      if (!content) {
        Alert.alert('Post not updated', 'A post cannot be empty.');
      }
      return;
    }

    setEditSaving(true);

    try {
      const updated = await updatePost(activePost.id, { content });
      setLocalPost(updated);
      setEditingContent(updated.content);
      setEditing(false);
    } catch (caughtError) {
      Alert.alert(
        'Post not updated',
        caughtError instanceof Error
          ? caughtError.message
          : 'Neighbour could not update this post.',
      );
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <Card
      style={[
        styles.card,
        {
          borderColor: theme.colors.border,
          borderRadius: theme.radius.xl,
        },
        theme.shadows.subtle,
      ]}
    >
      <View style={styles.header}>
        <FeedAvatar avatarUrl={activePost.author.avatarUrl} displayName={activePost.author.displayName} />

        <View style={styles.identity}>
          <AppText variant="bodyStrong">{activePost.author.displayName}</AppText>

          <View style={styles.metadata}>
            {activePost.author.username ? (
              <AppText variant="caption" tone="secondary">
                @{activePost.author.username}
              </AppText>
            ) : null}

            {activePost.author.username ? (
              <AppText variant="caption" tone="muted">
                ·
              </AppText>
            ) : null}

            <RelativeTime date={timestamp} />
          </View>
        </View>

        {mine ? (
          <Pressable
            accessibilityLabel="Post options"
            accessibilityRole="button"
            disabled={editSaving}
            onPress={openPostMenu}
            style={({ pressed }) => [
              styles.menuButton,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radius.pill,
              },
              pressed ? styles.pressed : null,
            ]}
          >
            <AppText variant="bodyStrong" tone="muted">
              ···
            </AppText>
          </Pressable>
        ) : (
          <View
            style={[
              styles.menuButton,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="bodyStrong" tone="muted">
              ···
            </AppText>
          </View>
        )}
      </View>

      {contextLabel ? (
        <View style={styles.contextRow}>
          <CommunityBadge label={contextLabel} />
        </View>
      ) : null}

      <View style={styles.content}>
        {activePost.title ? (
          <AppText variant="subheading" style={styles.title}>
            {activePost.title}
          </AppText>
        ) : null}

        {editing ? (
          <>
            <TextInput
              accessibilityLabel="Edit post content"
              editable={!editSaving}
              multiline
              onChangeText={setEditingContent}
              style={[
                styles.editInput,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderColor: theme.colors.border,
                },
              ]}
              value={editingContent}
            />

            <View style={styles.editActions}>
              <Pressable
                accessibilityRole="button"
                disabled={editSaving || !editingContent.trim()}
                onPress={() => {
                  void saveEdit();
                }}
                style={({ pressed }) => [
                  styles.editAction,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.pill,
                  },
                  pressed ? styles.pressed : null,
                  editSaving || !editingContent.trim()
                    ? styles.editActionDisabled
                    : null,
                ]}
              >
                <AppText variant="caption">
                  {editSaving ? 'Saving…' : 'Save'}
                </AppText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={editSaving}
                onPress={() => {
                  setEditingContent(activePost.content);
                  setEditing(false);
                }}
                style={({ pressed }) => [
                  styles.editAction,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.pill,
                  },
                  pressed ? styles.pressed : null,
                ]}
              >
                <AppText variant="caption">Cancel</AppText>
              </Pressable>
            </View>
          </>
        ) : (
          <AppText tone="secondary" style={styles.body}>
            {activePost.content}
          </AppText>
        )}
      </View>

      {activePost.media && activePost.media.length > 0 ? <MediaGallery items={activePost.media} /> : null}

      {activePost.editedAt ? (
        <AppText variant="caption" tone="muted">
          Edited
        </AppText>
      ) : null}

      <View
        style={[
          styles.engagement,
          {
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <ReactionBar
          authorName={activePost.author.displayName}
          initialEngagement={activePost.engagement}
          postContent={activePost.content}
          postId={activePost.id}
        />

        <CommentBar initialCount={activePost.engagement.commentCount} postId={activePost.id} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    gap: 14,
    padding: 17,
  },

  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 11,
  },

  identity: {
    flex: 1,
    gap: 2,
  },

  metadata: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },

  menuButton: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 34,
  },

  contextRow: {
    alignItems: 'flex-start',
  },

  content: {
    gap: 7,
  },

  title: {
    lineHeight: 24,
  },

  body: {
    lineHeight: 23,
  },

  editInput: {
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 110,
    paddingHorizontal: 13,
    paddingVertical: 11,
    textAlignVertical: 'top',
  },

  editActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },

  editAction: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  editActionDisabled: {
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.72,
  },

  engagement: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
    paddingTop: 13,
  },
});
