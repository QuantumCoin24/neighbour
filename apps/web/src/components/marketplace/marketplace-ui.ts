import type {
  MarketplaceListingCategory,
  MarketplaceListingCondition,
  MarketplaceListingStatus,
} from '@neighbour/api-client';

export const CATEGORIES: MarketplaceListingCategory[] = [
  'ELECTRONICS',
  'HOME_GARDEN',
  'FURNITURE',
  'CLOTHING',
  'BABY_KIDS',
  'SPORTS',
  'HOBBIES',
  'COLLECTABLES',
  'PETS',
  'VEHICLE_PARTS',
  'PROPERTY',
  'JOBS',
  'SERVICES',
  'TICKETS',
  'FREE_ITEMS',
  'WANTED',
  'OTHER',
];

export const CONDITIONS: MarketplaceListingCondition[] = [
  'NEW',
  'LIKE_NEW',
  'GOOD',
  'FAIR',
  'POOR',
  'NOT_APPLICABLE',
];

export function label(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function priceLabel(
  pricePence: number | null,
  isFree: boolean,
) {
  if (isFree) return 'Free';

  if (pricePence === null) return 'Price unavailable';

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pricePence / 100);
}

export function statusLabel(status: MarketplaceListingStatus) {
  return label(status);
}
