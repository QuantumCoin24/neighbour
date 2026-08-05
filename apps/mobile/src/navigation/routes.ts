export const ROUTES = {
  LOGIN: 'Login',
  APP: 'App',
  HOME: 'Home',
  COMMUNITIES: 'Communities',
  SEARCH: 'Search',
  MESSAGES: 'Messages',
  NOTIFICATIONS: 'Notifications',
  PROFILE: 'Profile',
  CONVERSATION: 'Conversation',
} as const;

export type RootStackParamList = {
  Login: undefined;
  App: undefined;
  Conversation: {
    conversationId: string;
  };
};

export type AppTabParamList = {
  Home: undefined;
  Communities: undefined;
  Search: undefined;
  Messages: undefined;
  Notifications: undefined;
  Profile: undefined;
};
