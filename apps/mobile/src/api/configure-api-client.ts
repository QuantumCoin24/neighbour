import { configureApiClient } from '@neighbour/api-client';
import Constants from 'expo-constants';

import { getSessionAccessToken } from '../auth/session';

function getDevelopmentApiUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_NEIGHBOUR_API_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    try {
      const developmentUrl = new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`);

      return `http://${developmentUrl.hostname}:4000/api/v1`;
    } catch {
      // Fall through to the simulator/local-machine default.
    }
  }

  return 'http://localhost:4000/api/v1';
}

export function initialiseMobileApiClient(): void {
  configureApiClient({
    baseUrl: getDevelopmentApiUrl(),
    getAccessToken: getSessionAccessToken,
  });
}
