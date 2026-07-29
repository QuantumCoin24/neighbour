import { Injectable } from '@nestjs/common';

import type { ReactionEntity } from './reaction.entity';

import { ReactionRepository } from './reaction.repository';

@Injectable()
export class ReactionService {
  constructor(private readonly repository: ReactionRepository) {}

  add(reaction: ReactionEntity): Promise<ReactionEntity> {
    return this.repository.save(reaction);
  }

  remove(userId: string, postId: string): Promise<void> {
    return this.repository.remove(userId, postId);
  }

  list(postId: string): Promise<ReactionEntity[]> {
    return this.repository.findByPost(postId);
  }
}
