import { Injectable } from '@nestjs/common';

import type { TransactionEntity } from './transaction.entity';

@Injectable()
export class TransactionService {
  private transactions: TransactionEntity[] = [];

  create(transaction: TransactionEntity): TransactionEntity {
    this.transactions.push(transaction);

    return transaction;
  }

  complete(id: string): TransactionEntity | undefined {
    const transaction = this.transactions.find((item) => item.id === id);

    if (!transaction) {
      return undefined;
    }

    transaction.status = 'completed';

    return transaction;
  }
}
