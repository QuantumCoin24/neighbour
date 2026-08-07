export const brandColors = {
  primary: '#0E5B3A',
  primaryStrong: '#063F2A',
  primarySoft: '#E1F3E8',

  secondary: '#22C55E',
  secondarySoft: '#EAFBEF',

  mint: '#A7F3D0',
  warmCream: '#FAF7F2',
  charcoal: '#111827',
  stone: '#64748B',

  community: '#158A59',
  business: '#D97706',
  organisation: '#475569',
  event: '#7C3AED',
  marketplace: '#2563EB',

  safety: '#C24141',
  trust: '#0F766E',
} as const;

export const lightColors = {
  background: '#FAF7F2',
  backgroundElevated: '#FFFFFF',

  surface: '#FFFFFF',
  surfaceMuted: '#F2F6F3',
  surfaceStrong: '#E7F0EA',

  glass: 'rgba(255, 255, 255, 0.88)',
  glassStrong: 'rgba(255, 255, 255, 0.97)',

  border: '#E2E8E4',
  borderStrong: '#C9D8CF',

  text: '#102019',
  textSecondary: '#516158',
  textMuted: '#7B8A82',

  inverseText: '#FFFFFF',
  overlay: 'rgba(6, 36, 24, 0.46)',

  success: '#158A59',
  warning: '#B86B10',
  danger: '#C24141',
  information: '#2563EB',

  inputBackground: '#F2F6F3',
  shadow: '#063F2A',

  ...brandColors,
} as const;

export const darkColors = {
  background: '#07110C',
  backgroundElevated: '#0B1A12',

  surface: '#102219',
  surfaceMuted: '#173126',
  surfaceStrong: '#1E3D30',

  glass: 'rgba(16, 34, 25, 0.88)',
  glassStrong: 'rgba(16, 34, 25, 0.97)',

  border: '#284A39',
  borderStrong: '#356047',

  text: '#F7FBF8',
  textSecondary: '#BED0C4',
  textMuted: '#8DA398',

  inverseText: '#07110C',
  overlay: 'rgba(0, 0, 0, 0.62)',

  success: '#48C786',
  warning: '#E4A64D',
  danger: '#EF8585',
  information: '#82B6F4',

  inputBackground: '#173126',
  shadow: '#000000',

  primary: '#4ACF86',
  primaryStrong: '#81E3AA',
  primarySoft: '#123825',

  secondary: '#22C55E',
  secondarySoft: '#11341F',

  mint: '#63DFA0',
  warmCream: '#F6F0E6',
  charcoal: '#F7FBF8',
  stone: '#A1B2AA',

  community: '#63DFA0',
  business: '#E8A95D',
  organisation: '#A8B4C7',
  event: '#C2A2EA',
  marketplace: '#8AB8FF',

  safety: '#EF8585',
  trust: '#69D8CA',
} as const;

export type ThemeColors = typeof lightColors | typeof darkColors;
