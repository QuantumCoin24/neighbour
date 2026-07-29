import type { PostEntity } from '../post/post.entity';

export interface FeedResponse {
  posts: PostEntity[];
}
