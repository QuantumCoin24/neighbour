import { StatusBar } from 'expo-status-bar';

import { initialiseMobileApiClient } from './src/api/configure-api-client';
import { AuthProvider } from './src/auth/auth-provider';
import { MessageProvider } from './src/features/messages';
import { NotificationProvider } from './src/features/notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { RealtimeProvider } from './src/realtime';
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
        <RealtimeProvider>
          <NotificationProvider>
            <MessageProvider>
              <NeighbourApplication />
            </MessageProvider>
          </NotificationProvider>
        </RealtimeProvider>
      </AuthProvider>
    </NeighbourThemeProvider>
  );
}
