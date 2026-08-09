import type { FeedPost } from '@neighbour/api-client';
import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../components';
import { useNeighbourTheme } from '../../theme';

import { CommentBar } from './CommentBar';
import { CommunityBadge } from './CommunityBadge';
import { FeedAvatar } from './FeedAvatar';
import { ReactionBar } from './ReactionBar';
import { RelativeTime } from './RelativeTime';

interface FeedCardProps {
  post: FeedPost;
}

export function FeedCard({ post }: FeedCardProps) {
  const { theme } = useNeighbourTheme();

  const contextLabel = post.community?.name ?? post.neighbourhood?.name ?? post.author.localArea;

  const timestamp = post.publishedAt ?? post.createdAt;

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
        <FeedAvatar avatarUrl={post.author.avatarUrl} displayName={post.author.displayName} />

        <View style={styles.identity}>
          <AppText variant="bodyStrong">{post.author.displayName}</AppText>

          <View style={styles.metadata}>
            {post.author.username ? (
              <AppText variant="caption" tone="secondary">
                @{post.author.username}
              </AppText>
            ) : null}

            {post.author.username ? (
              <AppText variant="caption" tone="muted">
                ·
              </AppText>
            ) : null}

            <RelativeTime date={timestamp} />
          </View>
        </View>

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
      </View>

      {contextLabel ? (
        <View style={styles.contextRow}>
          <CommunityBadge label={contextLabel} />
        </View>
      ) : null}

      <View style={styles.content}>
        {post.title ? (
          <AppText variant="subheading" style={styles.title}>
            {post.title}
          </AppText>
        ) : null}

        <AppText tone="secondary" style={styles.body}>
          {post.content}
        </AppText>
      </View>

      {post.editedAt ? (
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
        <ReactionBar initialEngagement={post.engagement} postId={post.id} />

        <CommentBar initialCount={post.engagement.commentCount} postId={post.id} />
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

  engagement: {
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
    paddingTop: 13,
  },
});
