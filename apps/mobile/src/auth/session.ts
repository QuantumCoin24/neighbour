import { refreshAuthTokens, type AuthResponse, type AuthUser } from '@neighbour/api-client';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'neighbour_session';

export interface MobileSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

let currentSession: MobileSession | null = null;

export function getSession(): MobileSession | null {
  return currentSession;
}

export function getSessionAccessToken(): string | null {
  return currentSession?.accessToken ?? null;
}

export async function refreshSessionAccessToken(): Promise<string | null> {
  const session = currentSession;

  if (!session) {
    return null;
  }

  try {
    const tokens = await refreshAuthTokens(session.refreshToken);

    const refreshedSession: MobileSession = {
      ...session,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: Date.now() + tokens.expiresIn * 1000,
    };

    await saveSession(refreshedSession);

    return refreshedSession.accessToken;
  } catch {
    await clearSession();

    return null;
  }
}

export function createSession(response: AuthResponse): MobileSession {
  return {
    user: response.user,
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    expiresAt: Date.now() + response.expiresIn * 1000,
  };
}

export async function saveSession(session: MobileSession): Promise<void> {
  currentSession = session;

  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<MobileSession | null> {
  const storedValue = await SecureStore.getItemAsync(SESSION_KEY);

  if (!storedValue) {
    currentSession = null;

    return null;
  }

  try {
    const parsed = JSON.parse(storedValue) as MobileSession;

    currentSession = parsed;

    return parsed;
  } catch {
    await clearSession();

    return null;
  }
}

export async function clearSession(): Promise<void> {
  currentSession = null;

  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export function hasSession(): boolean {
  return currentSession !== null;
}
