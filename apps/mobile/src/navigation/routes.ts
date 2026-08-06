export const ROUTES = {
  LOGIN: 'Login',
  APP: 'App',
  HOME: 'Home',
  COMMUNITIES: 'Communities',
  SEARCH: 'Search',
  MAPS: 'Maps',
  MARKETPLACE: 'Marketplace',
  MARKETPLACE_LISTINGS: 'MarketplaceListings',
  CREATE_MARKETPLACE_LISTING: 'CreateMarketplaceListing',
  MARKETPLACE_LISTING_DETAIL: 'MarketplaceListingDetail',
  MY_MARKETPLACE_LISTINGS: 'MyMarketplaceListings',
  MESSAGES: 'Messages',
  NOTIFICATIONS: 'Notifications',
  PROFILE: 'Profile',
  CONVERSATION: 'Conversation',
  COMMUNITY_DETAIL: 'CommunityDetail',
  CREATE_COMMUNITY: 'CreateCommunity',
  BUSINESS_DETAIL: 'BusinessDetail',
  PREMIUM: 'Premium',
} as const;

export type RootStackParamList = {
  Login: undefined;
  App: undefined;
  Conversation: {
    conversationId: string;
  };
  CommunityDetail: {
    slug: string;
  };
  CreateCommunity: undefined;
  BusinessDetail: {
    business: import('@neighbour/api-client').MarketplaceBusiness;
  };
  MarketplaceListings: undefined;
  CreateMarketplaceListing: undefined;
  MarketplaceListingDetail: {
    listingId: string;
  };
  MyMarketplaceListings: undefined;
  Premium: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Communities: undefined;
  Search: undefined;
  Maps: undefined;
  Marketplace: undefined;
  Messages: undefined;
  Notifications: undefined;
  Profile: undefined;
};
