import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from './src/auth/auth-provider';
import AppNavigator from './src/navigation/AppNavigator';
import { NeighbourThemeProvider, useNeighbourTheme } from './src/theme';

function NeighbourApplication() {
  const { isDark } = useNeighbourTheme();

  return (
    <>
      <AppNavigator />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <NeighbourThemeProvider>
      <AuthProvider>
        <NeighbourApplication />
      </AuthProvider>
    </NeighbourThemeProvider>
  );
}
