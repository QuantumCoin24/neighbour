import { configureApiClient } from '@neighbour/api-client';
import Constants from 'expo-constants';

import { getSessionAccessToken } from '../auth/session';

function getMobileApiUrl(): string {
  const configuredUrl = process.env.EXPO_PUBLIC_NEIGHBOUR_API_URL?.trim();

  if (configuredUrl) {
    return configuredUrl;
  }

  if (!__DEV__) {
    throw new Error('EXPO_PUBLIC_NEIGHBOUR_API_URL is required for production Neighbour builds.');
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
    baseUrl: getMobileApiUrl(),
    getAccessToken: getSessionAccessToken,
  });
}
