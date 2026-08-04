import type { TextStyle } from 'react-native';

export const fontFamilies = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
} as const;

export const typography = {
  display: {
    fontFamily: fontFamilies.bold,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '700',
    letterSpacing: -1.3,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  heading: {
    fontFamily: fontFamilies.semibold,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '600',
    letterSpacing: -0.35,
  },
  subheading: {
    fontFamily: fontFamilies.semibold,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  bodyLarge: {
    fontFamily: fontFamilies.regular,
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '400',
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyStrong: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  label: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
  },
  overline: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
