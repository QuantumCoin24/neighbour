import { restoreApplePurchases, verifyAppleTransaction } from '@neighbour/api-client';
import type { Purchase } from 'expo-iap';

function requireSignedTransaction(purchase: Purchase): string {
  const token = purchase.purchaseToken;

  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('StoreKit did not return signed transaction evidence.');
  }

  return token;
}

export async function verifyStoreKitPurchase(purchase: Purchase): Promise<void> {
  await verifyAppleTransaction({
    signedTransactionInfo: requireSignedTransaction(purchase),
  });
}

export async function restoreStoreKitPurchases(purchases: Purchase[]): Promise<void> {
  const signedTransactions = purchases
    .map((purchase) => purchase.purchaseToken)
    .filter((token): token is string => typeof token === 'string' && token.trim().length > 0);

  if (signedTransactions.length === 0) {
    throw new Error('No active Apple subscriptions were found.');
  }

  await restoreApplePurchases({
    signedTransactions,
  });
}
