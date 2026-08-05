export const ROUTES = {
  LOGIN: 'Login',
  APP: 'App',
  HOME: 'Home',
  COMMUNITIES: 'Communities',
  SEARCH: 'Search',
  MAPS: 'Maps',
  MARKETPLACE: 'Marketplace',
  MESSAGES: 'Messages',
  NOTIFICATIONS: 'Notifications',
  PROFILE: 'Profile',
  CONVERSATION: 'Conversation',
  COMMUNITY_DETAIL: 'CommunityDetail',
  BUSINESS_DETAIL: 'BusinessDetail',
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
  BusinessDetail: {
    business: import('@neighbour/api-client').MarketplaceBusiness;
  };
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
