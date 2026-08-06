import { apiRequest } from '../client';

import type {
  AppleSubscriptionProduct,
  RestoreApplePurchasesInput,
  VerifyAppleTransactionInput,
} from './types';

export function getAppleSubscriptionProducts(): Promise<AppleSubscriptionProduct[]> {
  return apiRequest<AppleSubscriptionProduct[]>('/apple-commerce/products');
}

export function verifyAppleTransaction(input: VerifyAppleTransactionInput) {
  return apiRequest('/apple-commerce/verify', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function restoreApplePurchases(input: RestoreApplePurchasesInput) {
  return apiRequest('/apple-commerce/restore', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export * from './types';
