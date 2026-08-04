import type { FeedPost } from '@neighbour/api-client';
import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../components';

import { CommunityBadge } from './CommunityBadge';
import { FeedAvatar } from './FeedAvatar';
import { RelativeTime } from './RelativeTime';

interface FeedCardProps {
  post: FeedPost;
}

export function FeedCard({ post }: FeedCardProps) {
  const contextLabel = post.community?.name ?? post.neighbourhood?.name ?? post.author.localArea;

  const timestamp = post.publishedAt ?? post.createdAt;

  return (
    <Card style={styles.card}>
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

            <RelativeTime date={timestamp} />
          </View>
        </View>
      </View>

      {contextLabel ? <CommunityBadge label={contextLabel} /> : null}

      <View style={styles.content}>
        {post.title ? <AppText variant="subheading">{post.title}</AppText> : null}

        <AppText tone="secondary">{post.content}</AppText>
      </View>

      {post.editedAt ? (
        <AppText variant="caption" tone="muted">
          Edited
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  identity: {
    flex: 1,
    gap: 2,
  },
  metadata: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  content: {
    gap: 8,
  },
});
