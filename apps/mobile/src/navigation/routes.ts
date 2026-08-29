import type { NavigatorScreenParams } from '@react-navigation/native';

export const ROUTES = {
  LOGIN: 'Login',
  APP: 'App',
  HOME: 'Home',
  COMMUNITIES: 'Communities',
  VIBES: 'Vibes',
  SEARCH: 'Search',
  MAPS: 'Maps',
  LOCAL_AREA: 'LocalArea',
  MARKETPLACE: 'Marketplace',
  MARKETPLACE_LISTINGS: 'MarketplaceListings',
  CREATE_MARKETPLACE_LISTING: 'CreateMarketplaceListing',
  MARKETPLACE_LISTING_DETAIL: 'MarketplaceListingDetail',
  MY_MARKETPLACE_LISTINGS: 'MyMarketplaceListings',
  SAVED_MARKETPLACE_LISTINGS: 'SavedMarketplaceListings',
  MARKETPLACE_OFFERS: 'MarketplaceOffers',
  MARKETPLACE_TRANSACTIONS: 'MarketplaceTransactions',
  MAKE_MARKETPLACE_OFFER: 'MakeMarketplaceOffer',
  MARKETPLACE_OFFER_DETAIL: 'MarketplaceOfferDetail',
  MARKETPLACE_TRANSACTION_DETAIL: 'MarketplaceTransactionDetail',
  MARKETPLACE_FULFILMENT: 'MarketplaceFulfilment',
  MESSAGES: 'Messages',
  NOTIFICATIONS: 'Notifications',
  PROFILE: 'Profile',
  PUBLIC_PROFILE: 'PublicProfile',
  PERSONAL_MAP: 'PersonalMap',
  TRAILS: 'Trails',
  ADVENTURES: 'Adventures',
  CONVERSATION: 'Conversation',
  COMMUNITY_DETAIL: 'CommunityDetail',
  COMMUNITY_MAP: 'CommunityMap',
  CREATE_COMMUNITY: 'CreateCommunity',
  CREATE_EVENT: 'CreateEvent',
  EVENT_DETAIL: 'EventDetail',
  BUSINESS_DETAIL: 'BusinessDetail',
  EDIT_BUSINESS: 'EditBusiness',
  CREATE_BUSINESS: 'CreateBusiness',
  PREMIUM: 'Premium',
} as const;

export type RootStackParamList = {
  Login: undefined;
  App: NavigatorScreenParams<AppTabParamList>;
  Conversation: {
    conversationId: string;
  };
  PublicProfile: {
    username: string;
    userId: string;
    displayName: string;
  };
  PersonalMap: {
    username: string;
    owner: boolean;
    displayName?: string;
  };
  Trails:
    | {
        mode: 'PERSONAL';
        username: string;
        owner: boolean;
        displayName?: string;
      }
    | {
        mode: 'COMMUNITY';
        communityId: string;
        communitySlug: string;
        communityName: string;
        latitude: number | null;
        longitude: number | null;
      };
  Adventures:
    | {
        mode: 'PERSONAL';
        username: string;
        owner: boolean;
        displayName?: string;
      }
    | {
        mode: 'COMMUNITY';
        communityId: string;
        communitySlug: string;
        communityName: string;
        latitude: number | null;
        longitude: number | null;
      };
  CommunityDetail: {
    slug: string;
  };
  CommunityMap: {
    communityId: string;
    communitySlug: string;
    communityName: string;
    latitude: number | null;
    longitude: number | null;
  };
  CreateCommunity: undefined;
  CreateEvent: {
    communityId: string;
    communitySlug: string;
    communityName: string;
  };
  EventDetail: {
    eventId: string;
  };
  Marketplace: undefined;
  BusinessDetail: {
    business: import('@neighbour/api-client').MarketplaceBusiness;
  };
  EditBusiness: {
    business: import('@neighbour/api-client').MarketplaceBusiness;
  };
  CreateBusiness: {
    communityId: string;
    communitySlug: string;
    communityName: string;
  };
  MarketplaceListings: undefined;
  CreateMarketplaceListing: undefined;
  MarketplaceListingDetail: {
    listingId: string;
  };
  MyMarketplaceListings: undefined;
  SavedMarketplaceListings: undefined;
  MarketplaceOffers: undefined;
  MarketplaceTransactions: undefined;
  MakeMarketplaceOffer: {
    listingId: string;
    listingTitle: string;
    askingPricePence: number | null;
  };
  MarketplaceOfferDetail: {
    offerId: string;
  };
  MarketplaceTransactionDetail: {
    transactionId: string;
  };
  MarketplaceFulfilment: {
    transactionId: string;
    sellerId: string;
  };
  LocalArea: undefined;
  Search: undefined;
  Notifications: undefined;
  Premium: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Communities: undefined;
  Vibes: undefined;
  Search: undefined;
  Maps: undefined;
  Marketplace: undefined;
  Messages: undefined;
  Notifications: undefined;
  Profile: undefined;
};
