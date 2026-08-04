import { createContext, type PropsWithChildren, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme, type NeighbourTheme } from './theme';

interface ThemeContextValue {
  theme: NeighbourTheme;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function NeighbourThemeProvider({ children }: PropsWithChildren) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: isDark ? darkTheme : lightTheme,
      isDark,
    }),
    [isDark],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useNeighbourTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useNeighbourTheme must be used inside NeighbourThemeProvider.');
  }

  return context;
}
