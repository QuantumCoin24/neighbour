import { darkColors, lightColors } from './colors';
import { radius } from './radius';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

export const lightTheme = {
  mode: 'light',
  colors: lightColors,
  spacing,
  radius,
  shadows,
  typography,
} as const;

export const darkTheme = {
  mode: 'dark',
  colors: darkColors,
  spacing,
  radius,
  shadows,
  typography,
} as const;

export type NeighbourTheme = typeof lightTheme | typeof darkTheme;
