export interface ApiClientConfiguration {
  baseUrl?: string;
  getAccessToken?: () => Promise<string | null> | string | null;
}

const DEFAULT_API_BASE_URL = process.env.NEIGHBOUR_API_URL ?? 'http://localhost:4000/api/v1';

let apiBaseUrl = DEFAULT_API_BASE_URL;

let accessTokenProvider: (() => Promise<string | null> | string | null) | undefined;

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);

    this.name = 'ApiClientError';
  }
}

export function configureApiClient(configuration: ApiClientConfiguration): void {
  if (configuration.baseUrl) {
    apiBaseUrl = configuration.baseUrl.replace(/\/+$/, '');
  }

  if (configuration.getAccessToken) {
    accessTokenProvider = configuration.getAccessToken;
  }
}

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

async function getDefaultBrowserAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem('accessToken');
}

async function resolveAccessToken(): Promise<string | null> {
  if (accessTokenProvider) {
    return accessTokenProvider();
  }

  return getDefaultBrowserAccessToken();
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await resolveAccessToken();

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();

    throw new ApiClientError(
      `Neighbour API request failed with status ${response.status}.`,
      response.status,
      body,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export * from './auth';
export * from './community';
export * from './feed';
export * from './posts';
export * from './profile';
export * from './membership';
export * from './interaction';
export * from './neighbourhood';
export * from './social';
export * from './messages';
export * from './notifications';
export * from './media';
export * from './events';
export * from './search';
export * from './security';
export * from './moderation';
export * from './business';
export * from './business-verification';
export * from './business-offers';
export * from './business-dashboard';
export * from './business-me';
export * from './business-events';
export * from './business-analytics';
