import { Injectable } from '@nestjs/common';

import type {
  CreateProviderPaymentInput,
  CreateProviderPaymentResult,
  MarketplacePaymentProviderAdapter,
} from './marketplace-payment-provider.interface';

@Injectable()
export class ManualPaymentProvider implements MarketplacePaymentProviderAdapter {
  readonly provider = 'MANUAL' as const;

  createPayment(input: CreateProviderPaymentInput): Promise<CreateProviderPaymentResult> {
    void input;

    return Promise.resolve({
      provider: this.provider,
      providerReference: null,
      clientSecret: null,
      requiresAction: false,
    });
  }

  capturePayment(providerReference: string): Promise<void> {
    void providerReference;

    return Promise.resolve();
  }

  cancelPayment(providerReference: string): Promise<void> {
    void providerReference;

    return Promise.resolve();
  }

  refundPayment(providerReference: string, amountPence: number): Promise<string | null> {
    void providerReference;
    void amountPence;

    return Promise.resolve(null);
  }
}
