import { Platform } from 'react-native';

export const shadows = {
  none: {},
  subtle: Platform.select({
    ios: {
      shadowColor: '#17231D',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  card: Platform.select({
    ios: {
      shadowColor: '#17231D',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
    },
    android: {
      elevation: 5,
    },
    default: {},
  }),
  floating: Platform.select({
    ios: {
      shadowColor: '#17231D',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.14,
      shadowRadius: 28,
    },
    android: {
      elevation: 10,
    },
    default: {},
  }),
} as const;
