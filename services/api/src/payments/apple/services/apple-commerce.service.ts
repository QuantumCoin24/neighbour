import { Injectable } from '@nestjs/common';

import { SubscriptionService } from '../../subscription/subscription.service';
import type { AppleCommerceHealth } from '../interfaces/apple-product.interface';
import { AppleProductService } from './apple-product.service';
import { AppleTransactionDecoderService } from './apple-transaction-decoder.service';

@Injectable()
export class AppleCommerceService {
  constructor(
    private readonly products: AppleProductService,
    private readonly decoder: AppleTransactionDecoderService,
    private readonly subscriptions: SubscriptionService,
  ) {}

  health(): AppleCommerceHealth {
    return {
      module: 'AppleCommerce',
      status: 'operational',
      productCount: this.products.list().length,
      supportedEnvironments: ['Sandbox', 'Production'],
    };
  }

  listProducts() {
    return this.products.list();
  }

  async verifyAndSync(ownerId: string, signedTransactionInfo: string) {
    const transaction = this.decoder.decode(signedTransactionInfo);

    const product = this.products.require(transaction.productId);

    const overview = await this.subscriptions.activateAppleSubscription(ownerId, {
      plan: product.plan,
      originalTransactionId: transaction.originalTransactionId,
      currentPeriodEnd: transaction.expiresDate,
      purchasedAt: transaction.purchaseDate,
      revokedAt: transaction.revocationDate,
    });

    return {
      transaction,
      product,
      overview,
    };
  }

  async restore(ownerId: string, signedTransactions: string[]) {
    const decoded = signedTransactions.map((transaction) => this.decoder.decode(transaction));

    const supported = decoded
      .map((transaction) => ({
        transaction,
        product: this.products.require(transaction.productId),
      }))
      .sort(
        (left, right) =>
          right.transaction.expiresDate.getTime() - left.transaction.expiresDate.getTime(),
      );

    const latest = supported[0];

    if (!latest) {
      return {
        restored: false,
        overview: await this.subscriptions.getOverview(ownerId),
      };
    }

    const overview = await this.subscriptions.activateAppleSubscription(ownerId, {
      plan: latest.product.plan,
      originalTransactionId: latest.transaction.originalTransactionId,
      currentPeriodEnd: latest.transaction.expiresDate,
      purchasedAt: latest.transaction.purchaseDate,
      revokedAt: latest.transaction.revocationDate,
    });

    return {
      restored: true,
      transaction: latest.transaction,
      product: latest.product,
      overview,
    };
  }
}
