import type { DashboardPost } from '@neighbour/api-client';
import { StyleSheet, View } from 'react-native';

import { FeedCard } from './FeedCard';
import { FeedEmptyState } from './FeedEmptyState';

interface FeedListProps {
  posts: DashboardPost[];
}

export function FeedList({ posts }: FeedListProps) {
  if (posts.length === 0) {
    return <FeedEmptyState />;
  }

  return (
    <View style={styles.list}>
      {posts.map((post) => (
        <FeedCard key={post.id} post={post} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14,
  },
});
