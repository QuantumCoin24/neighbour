export const APPLE_SUBSCRIPTION_PRODUCT_IDS = [
  'neighbour.plus.monthly',
  'neighbour.plus.yearly',
  'neighbour.business.monthly',
  'neighbour.business.yearly',
] as const;

export type AppleSubscriptionProductId = (typeof APPLE_SUBSCRIPTION_PRODUCT_IDS)[number];

export const APPLE_PRODUCT_LABELS: Record<
  AppleSubscriptionProductId,
  {
    plan: 'PLUS' | 'BUSINESS';
    period: 'MONTHLY' | 'YEARLY';
    title: string;
    fallbackPrice: string;
  }
> = {
  'neighbour.plus.monthly': {
    plan: 'PLUS',
    period: 'MONTHLY',
    title: 'Neighbour Plus Monthly',
    fallbackPrice: '£4.99 / month',
  },
  'neighbour.plus.yearly': {
    plan: 'PLUS',
    period: 'YEARLY',
    title: 'Neighbour Plus Yearly',
    fallbackPrice: '£49.99 / year',
  },
  'neighbour.business.monthly': {
    plan: 'BUSINESS',
    period: 'MONTHLY',
    title: 'Neighbour Business Monthly',
    fallbackPrice: '£14.99 / month',
  },
  'neighbour.business.yearly': {
    plan: 'BUSINESS',
    period: 'YEARLY',
    title: 'Neighbour Business Yearly',
    fallbackPrice: '£149.99 / year',
  },
};
