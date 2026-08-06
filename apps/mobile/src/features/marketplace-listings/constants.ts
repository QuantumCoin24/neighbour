import type {
  MarketplaceListingCategory,
  MarketplaceListingCondition,
} from '@neighbour/api-client';

export interface MarketplaceCategoryOption {
  value: MarketplaceListingCategory;
  label: string;
  symbol: string;
}

export interface MarketplaceConditionOption {
  value: MarketplaceListingCondition;
  label: string;
}

export const MARKETPLACE_CATEGORIES: MarketplaceCategoryOption[] = [
  {
    value: 'ELECTRONICS',
    label: 'Electronics',
    symbol: '⌘',
  },
  {
    value: 'HOME_GARDEN',
    label: 'Home & Garden',
    symbol: '⌂',
  },
  {
    value: 'FURNITURE',
    label: 'Furniture',
    symbol: '▤',
  },
  {
    value: 'CLOTHING',
    label: 'Clothing',
    symbol: '◇',
  },
  {
    value: 'BABY_KIDS',
    label: 'Baby & Kids',
    symbol: '●',
  },
  {
    value: 'SPORTS',
    label: 'Sports',
    symbol: '◎',
  },
  {
    value: 'HOBBIES',
    label: 'Hobbies',
    symbol: '✦',
  },
  {
    value: 'COLLECTABLES',
    label: 'Collectables',
    symbol: '◆',
  },
  {
    value: 'PETS',
    label: 'Pets',
    symbol: '♧',
  },
  {
    value: 'VEHICLE_PARTS',
    label: 'Vehicle Parts',
    symbol: '◈',
  },
  {
    value: 'PROPERTY',
    label: 'Property',
    symbol: '⌂',
  },
  {
    value: 'JOBS',
    label: 'Jobs',
    symbol: '▣',
  },
  {
    value: 'SERVICES',
    label: 'Services',
    symbol: '✚',
  },
  {
    value: 'TICKETS',
    label: 'Tickets',
    symbol: '▱',
  },
  {
    value: 'FREE_ITEMS',
    label: 'Free Items',
    symbol: '♡',
  },
  {
    value: 'WANTED',
    label: 'Wanted',
    symbol: '⌕',
  },
  {
    value: 'OTHER',
    label: 'Other',
    symbol: '•••',
  },
];

export const MARKETPLACE_CONDITIONS: MarketplaceConditionOption[] = [
  {
    value: 'NEW',
    label: 'New',
  },
  {
    value: 'LIKE_NEW',
    label: 'Like New',
  },
  {
    value: 'GOOD',
    label: 'Good',
  },
  {
    value: 'FAIR',
    label: 'Fair',
  },
  {
    value: 'POOR',
    label: 'Needs Repair',
  },
  {
    value: 'NOT_APPLICABLE',
    label: 'Not Applicable',
  },
];

export function marketplaceCategoryLabel(category: MarketplaceListingCategory): string {
  return MARKETPLACE_CATEGORIES.find((option) => option.value === category)?.label ?? category;
}

export function marketplaceConditionLabel(condition: MarketplaceListingCondition): string {
  return MARKETPLACE_CONDITIONS.find((option) => option.value === condition)?.label ?? condition;
}

export function formatMarketplacePrice(pricePence: number | null, isFree: boolean): string {
  if (isFree) {
    return 'Free';
  }

  if (pricePence === null) {
    return 'Price unavailable';
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pricePence / 100);
}
