import { StatusBar } from 'expo-status-bar';

import { initialiseMobileApiClient } from './src/api/configure-api-client';
import { AuthProvider } from './src/auth/auth-provider';
import AppNavigator from './src/navigation/AppNavigator';
import { NeighbourThemeProvider, useNeighbourTheme } from './src/theme';

initialiseMobileApiClient();

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
