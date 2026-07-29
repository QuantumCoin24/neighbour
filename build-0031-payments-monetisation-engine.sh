#!/bin/bash

set -e

echo "🚀 BUILD 0031 — Payments Monetisation Engine"

cd services/api

mkdir -p src/payments/account
mkdir -p src/payments/transaction
mkdir -p src/payments/subscription
mkdir -p src/payments/events


# =====================================
# PAYMENT ACCOUNT
# =====================================

cat > src/payments/account/payment-account.entity.ts <<'TS'
export interface PaymentAccountEntity {
  id: string;
  ownerId: string;
  ownerType: 'user' | 'business' | 'community';
  status: 'active' | 'suspended';
  createdAt: Date;
}
TS


cat > src/payments/account/payment-account.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { PaymentAccountEntity } from './payment-account.entity';


@Injectable()
export class PaymentAccountService {

  private accounts:
    PaymentAccountEntity[] = [];


  create(
    account: PaymentAccountEntity,
  ): PaymentAccountEntity {

    this.accounts.push(account);

    return account;
  }


  findByOwner(
    ownerId: string,
  ): PaymentAccountEntity | undefined {

    return this.accounts.find(
      (account) =>
        account.ownerId === ownerId,
    );
  }

}
TS


# =====================================
# TRANSACTIONS
# =====================================

cat > src/payments/transaction/transaction.entity.ts <<'TS'
export interface TransactionEntity {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  status:
    | 'pending'
    | 'completed'
    | 'failed'
    | 'refunded';
  createdAt: Date;
}
TS


cat > src/payments/transaction/transaction.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { TransactionEntity } from './transaction.entity';


@Injectable()
export class TransactionService {

  private transactions:
    TransactionEntity[] = [];


  create(
    transaction: TransactionEntity,
  ): TransactionEntity {

    this.transactions.push(
      transaction,
    );

    return transaction;
  }


  complete(
    id: string,
  ): TransactionEntity | undefined {

    const transaction =
      this.transactions.find(
        (item) =>
          item.id === id,
      );

    if (!transaction) {
      return undefined;
    }

    transaction.status = 'completed';

    return transaction;
  }

}
TS


# =====================================
# SUBSCRIPTIONS
# =====================================

cat > src/payments/subscription/subscription.entity.ts <<'TS'
export interface SubscriptionEntity {
  id: string;
  ownerId: string;
  plan:
    | 'free'
    | 'plus'
    | 'business';
  status:
    | 'active'
    | 'cancelled';
  createdAt: Date;
}
TS


cat > src/payments/subscription/subscription.service.ts <<'TS'
import { Injectable } from '@nestjs/common';

import type { SubscriptionEntity } from './subscription.entity';


@Injectable()
export class SubscriptionService {

  private subscriptions:
    SubscriptionEntity[] = [];


  create(
    subscription: SubscriptionEntity,
  ): SubscriptionEntity {

    this.subscriptions.push(
      subscription,
    );

    return subscription;
  }


  findByOwner(
    ownerId: string,
  ): SubscriptionEntity[] {

    return this.subscriptions.filter(
      (item) =>
        item.ownerId === ownerId,
    );
  }

}
TS


# =====================================
# PAYMENT EVENTS
# =====================================

cat > src/payments/events/payment-event-bus.service.ts <<'TS'
import { Injectable } from '@nestjs/common';


export type PaymentEvent =
  | {
      type: 'payment.completed';
      transactionId: string;
    }
  | {
      type: 'subscription.started';
      subscriptionId: string;
    }
  | {
      type: 'subscription.cancelled';
      subscriptionId: string;
    };


@Injectable()
export class PaymentEventBusService {

  private listeners:
    ((event: PaymentEvent) => void)[] = [];


  subscribe(
    listener: (event: PaymentEvent) => void,
  ) {

    this.listeners.push(listener);

  }


  publish(
    event: PaymentEvent,
  ) {

    for (const listener of this.listeners) {
      listener(event);
    }

  }

}
TS


# =====================================
# TEST
# =====================================

mkdir -p test/payments

cat > test/payments/payment-account.service.test.ts <<'TS'
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PaymentAccountService } from '../../src/payments/account/payment-account.service';


describe('PaymentAccountService', () => {

  it('creates payment accounts', () => {

    const service =
      new PaymentAccountService();


    const result =
      service.create({
        id: 'account-1',
        ownerId: 'business-1',
        ownerType: 'business',
        status: 'active',
        createdAt: new Date(),
      });


    assert.equal(
      result.status,
      'active',
    );

  });

});
TS


cd ../..

pnpm exec prettier --write .
pnpm --filter @neighbour/api run lint
pnpm --filter @neighbour/api run test
pnpm --filter @neighbour/api run build

echo "🎉 BUILD 0031 COMPLETE"

