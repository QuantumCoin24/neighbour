import type { PostEntity } from './post.entity';

export abstract class PostRepository {
  abstract save(post: PostEntity): Promise<PostEntity>;

  abstract findById(id: string): Promise<PostEntity | undefined>;

  abstract findByCommunity(communityId: string): Promise<PostEntity[]>;

  abstract findByUser(userId: string): Promise<PostEntity[]>;

  abstract remove(id: string): Promise<void>;
}
