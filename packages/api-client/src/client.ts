export interface ApiClientConfiguration {
  baseUrl?: string;
  getAccessToken?: () => Promise<string | null> | string | null;
  refreshAccessToken?: () => Promise<string | null>;
}

const DEFAULT_API_BASE_URL = process.env.NEIGHBOUR_API_URL ?? 'http://localhost:4000/api/v1';

let apiBaseUrl = DEFAULT_API_BASE_URL;

let accessTokenProvider: (() => Promise<string | null> | string | null) | undefined;

let accessTokenRefresher: (() => Promise<string | null>) | undefined;

let refreshPromise: Promise<string | null> | null = null;

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

  if (configuration.refreshAccessToken) {
    accessTokenRefresher = configuration.refreshAccessToken;
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

async function refreshAccessTokenOnce(): Promise<string | null> {
  if (!accessTokenRefresher) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = accessTokenRefresher().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function performRequest(
  path: string,
  options: RequestInit,
  token: string | null,
): Promise<Response> {
  return fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
  });
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();

    throw new ApiClientError(
      `Neighbour API request failed with status ${response.status}.`,
      response.status,
      body,
    );
  }

  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }

  const body = await response.text();

  if (!body.trim()) {
    return undefined as T;
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new ApiClientError(
      `Neighbour API returned an invalid JSON response with status ${response.status}.`,
      response.status,
      body,
    );
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await resolveAccessToken();

  let response = await performRequest(path, options, token);

  const canRefresh =
    response.status === 401 &&
    Boolean(token) &&
    Boolean(accessTokenRefresher) &&
    path !== '/auth/login' &&
    path !== '/auth/register' &&
    path !== '/auth/refresh';

  if (canRefresh) {
    const refreshedToken = await refreshAccessTokenOnce();

    if (refreshedToken) {
      response = await performRequest(path, options, refreshedToken);
    }
  }

  return parseResponse<T>(response);
}
