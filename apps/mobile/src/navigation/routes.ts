export const ROUTES = {
  LOGIN: 'Login',
  HOME: 'Home',
  PROFILE: 'Profile',
} as const;

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Profile: undefined;
};
