export const ROUTES = {
  LOGIN: 'Login',
  APP: 'App',
  HOME: 'Home',
  COMMUNITIES: 'Communities',
  MESSAGES: 'Messages',
  NOTIFICATIONS: 'Notifications',
  PROFILE: 'Profile',
} as const;

export type RootStackParamList = {
  Login: undefined;
  App: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Communities: undefined;
  Messages: undefined;
  Notifications: undefined;
  Profile: undefined;
};
