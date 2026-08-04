import Constants from 'expo-constants';

function removeApiPath(value: string): string {
  return value
    .replace(/\/+$/, '')
    .replace(/\/api\/v1$/i, '')
    .replace(/\/api$/i, '');
}

export function getRealtimeBaseUrl(): string {
  const configuredRealtimeUrl = process.env.EXPO_PUBLIC_NEIGHBOUR_REALTIME_URL;

  if (configuredRealtimeUrl) {
    return removeApiPath(configuredRealtimeUrl);
  }

  const configuredApiUrl = process.env.EXPO_PUBLIC_NEIGHBOUR_API_URL;

  if (configuredApiUrl) {
    return removeApiPath(configuredApiUrl);
  }

  const hostUri = Constants.expoConfig?.hostUri;

  if (hostUri) {
    try {
      const developmentUrl = new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`);

      return `http://${developmentUrl.hostname}:4000`;
    } catch {
      // Fall through to the simulator/local-machine default.
    }
  }

  return 'http://localhost:4000';
}

export function getRealtimeNamespaceUrl(): string {
  return `${getRealtimeBaseUrl()}/realtime`;
}
