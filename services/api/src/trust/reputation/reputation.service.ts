import { Injectable } from '@nestjs/common';

import type { ReputationEntity } from './reputation.entity';

@Injectable()
export class ReputationService {
  private records: ReputationEntity[] = [];

  create(reputation: ReputationEntity): ReputationEntity {
    this.records.push(reputation);

    return reputation;
  }

  findByUser(userId: string): ReputationEntity | undefined {
    return this.records.find((item) => item.userId === userId);
  }

  updateScore(userId: string, amount: number): ReputationEntity | undefined {
    const record = this.findByUser(userId);

    if (!record) {
      return undefined;
    }

    record.score += amount;
    record.updatedAt = new Date();

    return record;
  }
}
