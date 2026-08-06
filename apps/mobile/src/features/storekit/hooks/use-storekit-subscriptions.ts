import {
  ErrorCode,
  finishTransaction,
  getAvailablePurchases,
  restorePurchases,
  useIAP,
  type Product,
} from 'expo-iap';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { APPLE_SUBSCRIPTION_PRODUCT_IDS, type AppleSubscriptionProductId } from '../constants';
import {
  restoreStoreKitPurchases,
  verifyStoreKitPurchase,
} from '../services/storekit-verification.service';

export interface StoreKitSubscriptionState {
  connected: boolean;
  loadingProducts: boolean;
  purchasingProductId: string | null;
  restoring: boolean;
  error: string | null;
  successMessage: string | null;
  products: Product[];
  purchase(productId: AppleSubscriptionProductId): Promise<void>;
  restore(): Promise<void>;
  reloadProducts(): Promise<void>;
  clearMessages(): void;
}

export function useStoreKitSubscriptions(
  onEntitlementsChanged: () => Promise<void>,
): StoreKitSubscriptionState {
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [purchasingProductId, setPurchasingProductId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { connected, products, fetchProducts, requestPurchase } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        await verifyStoreKitPurchase(purchase);

        await finishTransaction({
          purchase,
          isConsumable: false,
        });

        await onEntitlementsChanged();

        setSuccessMessage(
          'Your Apple subscription is active and your premium access has been refreshed.',
        );
      } catch (purchaseError) {
        setError(
          purchaseError instanceof Error
            ? purchaseError.message
            : 'The purchase could not be verified.',
        );
      } finally {
        setPurchasingProductId(null);
      }
    },

    onPurchaseError: (purchaseError) => {
      setPurchasingProductId(null);

      if (purchaseError.code === ErrorCode.UserCancelled) {
        return;
      }

      setError(purchaseError.message || 'The Apple purchase failed.');
    },
  });

  const subscriptionProducts: Product[] = useMemo(
    () =>
      products.filter((product) =>
        APPLE_SUBSCRIPTION_PRODUCT_IDS.includes(product.id as AppleSubscriptionProductId),
      ),
    [products],
  );

  const reloadProducts = useCallback(async () => {
    if (!connected) {
      return;
    }

    setLoadingProducts(true);
    setError(null);

    try {
      await fetchProducts({
        skus: [...APPLE_SUBSCRIPTION_PRODUCT_IDS],
        type: 'subs',
      });
    } catch (productError) {
      setError(
        productError instanceof Error
          ? productError.message
          : 'Apple subscription products could not be loaded.',
      );
    } finally {
      setLoadingProducts(false);
    }
  }, [connected, fetchProducts]);

  useEffect(() => {
    if (connected) {
      void reloadProducts();
    }
  }, [connected, reloadProducts]);

  const purchase = useCallback(
    async (productId: AppleSubscriptionProductId) => {
      setError(null);
      setSuccessMessage(null);
      setPurchasingProductId(productId);

      try {
        await requestPurchase({
          request: {
            apple: {
              sku: productId,
            },
          },
          type: 'subs',
        });
      } catch (purchaseError) {
        setPurchasingProductId(null);

        setError(
          purchaseError instanceof Error
            ? purchaseError.message
            : 'The Apple purchase sheet could not be opened.',
        );
      }
    },
    [requestPurchase],
  );

  const restore = useCallback(async () => {
    setError(null);
    setSuccessMessage(null);
    setRestoring(true);

    try {
      await restorePurchases();

      const purchases = await getAvailablePurchases();

      await restoreStoreKitPurchases(purchases);

      await onEntitlementsChanged();

      setSuccessMessage('Your Apple purchases were restored successfully.');
    } catch (restoreError) {
      setError(
        restoreError instanceof Error
          ? restoreError.message
          : 'Apple purchases could not be restored.',
      );
    } finally {
      setRestoring(false);
    }
  }, [onEntitlementsChanged]);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);

  return {
    connected,
    loadingProducts,
    purchasingProductId,
    restoring,
    error,
    successMessage,
    products: subscriptionProducts,
    purchase,
    restore,
    reloadProducts,
    clearMessages,
  };
}
