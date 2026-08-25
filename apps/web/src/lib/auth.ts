import {
  changeCurrentEmail,
  changeCurrentPassword,
  configureApiClient,
  deleteCurrentAccount,
  logoutUser,
  refreshAuthTokens,
} from '@neighbour/api-client';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const WEB_API_BASE_URL = process.env.NEXT_PUBLIC_NEIGHBOUR_API_URL?.trim();

function browserAvailable(): boolean {
  return typeof window !== 'undefined';
}

export function getAccessToken(): string | null {
  if (!browserAvailable()) {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!browserAvailable()) {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function hasSession(): boolean {
  return Boolean(getAccessToken() && getRefreshToken());
}

export function saveTokens(accessToken: string, refreshToken: string): void {
  if (!browserAvailable()) {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  if (!browserAvailable()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function refreshBrowserAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearTokens();
    return null;
  }

  try {
    const tokens = await refreshAuthTokens(refreshToken);

    saveTokens(tokens.accessToken, tokens.refreshToken);

    return tokens.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

export function configureWebApiClient(): void {
  if (!browserAvailable()) {
    return;
  }

  configureApiClient({
    baseUrl: WEB_API_BASE_URL || undefined,
    getAccessToken,
    refreshAccessToken: refreshBrowserAccessToken,
  });
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  try {
    if (refreshToken) {
      await logoutUser(refreshToken);
    }
  } finally {
    clearTokens();

    if (browserAvailable()) {
      window.location.assign('/auth');
    }
  }
}

export async function changeEmail(email: string, currentPassword: string): Promise<void> {
  await changeCurrentEmail({
    email,
    currentPassword,
  });

  clearTokens();

  if (browserAvailable()) {
    window.location.assign('/auth');
  }
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await changeCurrentPassword({
    currentPassword,
    newPassword,
  });

  clearTokens();

  if (browserAvailable()) {
    window.location.assign('/auth');
  }
}

export async function deleteAccount(): Promise<void> {
  try {
    await deleteCurrentAccount();
  } finally {
    clearTokens();

    if (browserAvailable()) {
      window.location.assign('/auth');
    }
  }
}
