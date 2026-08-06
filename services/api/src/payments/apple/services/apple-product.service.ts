import { Injectable, NotFoundException } from '@nestjs/common';

import type { AppleSubscriptionProduct } from '../interfaces/apple-product.interface';

@Injectable()
export class AppleProductService {
  private readonly products: AppleSubscriptionProduct[] = [
    {
      productId: 'neighbour.plus.monthly',
      plan: 'PLUS',
      period: 'MONTHLY',
      displayName: 'Neighbour Plus Monthly',
      description: 'Premium tools for active neighbours and community contributors.',
      pricePence: 499,
    },
    {
      productId: 'neighbour.plus.yearly',
      plan: 'PLUS',
      period: 'YEARLY',
      displayName: 'Neighbour Plus Yearly',
      description: 'A full year of Neighbour Plus.',
      pricePence: 4999,
    },
    {
      productId: 'neighbour.business.monthly',
      plan: 'BUSINESS',
      period: 'MONTHLY',
      displayName: 'Neighbour Business Monthly',
      description: 'Professional tools for verified local businesses.',
      pricePence: 1499,
    },
    {
      productId: 'neighbour.business.yearly',
      plan: 'BUSINESS',
      period: 'YEARLY',
      displayName: 'Neighbour Business Yearly',
      description: 'A full year of Neighbour Business.',
      pricePence: 14999,
    },
  ];

  list(): AppleSubscriptionProduct[] {
    return this.products.map((product) => ({
      ...product,
    }));
  }

  require(productId: string): AppleSubscriptionProduct {
    const product = this.products.find((candidate) => candidate.productId === productId);

    if (!product) {
      throw new NotFoundException(`Unsupported Apple subscription product: ${productId}`);
    }

    return {
      ...product,
    };
  }
}
