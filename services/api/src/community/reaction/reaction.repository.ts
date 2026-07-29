import type { ReactionEntity } from './reaction.entity';

export abstract class ReactionRepository {
  abstract save(reaction: ReactionEntity): Promise<ReactionEntity>;

  abstract remove(userId: string, postId: string): Promise<void>;

  abstract findByPost(postId: string): Promise<ReactionEntity[]>;
}
