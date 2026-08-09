import {
  ApiClientError,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  type AuthUser,
  type LoginRequest,
  type RegisterRequest,
} from '@neighbour/api-client';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { clearSession, createSession, getSession, loadSession, saveSession } from './session';

export type AuthStatus = 'restoring' | 'anonymous' | 'authenticating' | 'authenticated';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (details: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getAuthenticationError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 401) {
      return 'The email address or password was not recognised.';
    }

    if (error.status === 409) {
      return 'An account already exists for this email address.';
    }

    if (error.status >= 500) {
      return 'Neighbour is temporarily unavailable. Please try again shortly.';
    }

    return `Neighbour could not complete the request (HTTP ${error.status}).`;
  }

  if (error instanceof TypeError) {
    return 'The Neighbour service could not be reached. Please check your internet connection and try again.';
  }

  return 'Something went wrong. Please try again.';
}

export function AuthProviderContext({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const restoreSession = useCallback(async () => {
    try {
      const restoredSession = await loadSession();

      if (!restoredSession) {
        setStatus('anonymous');

        return;
      }

      const currentUser = await getCurrentUser();

      await saveSession({
        ...restoredSession,
        user: currentUser,
      });

      setUser(currentUser);
      setStatus('authenticated');
    } catch {
      await clearSession();

      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (credentials: LoginRequest) => {
    setStatus('authenticating');
    setError(null);

    try {
      const response = await loginUser(credentials);
      const session = createSession(response);

      await saveSession(session);

      setUser(response.user);
      setStatus('authenticated');
    } catch (caughtError) {
      setUser(null);
      setError(getAuthenticationError(caughtError));
      setStatus('anonymous');

      throw caughtError;
    }
  }, []);

  const register = useCallback(async (details: RegisterRequest) => {
    setStatus('authenticating');
    setError(null);

    try {
      const response = await registerUser(details);
      const session = createSession(response);

      await saveSession(session);

      setUser(response.user);
      setStatus('authenticated');
    } catch (caughtError) {
      setUser(null);
      setError(getAuthenticationError(caughtError));
      setStatus('anonymous');

      throw caughtError;
    }
  }, []);

  const logout = useCallback(async () => {
    const session = getSession();

    setError(null);

    try {
      if (session) {
        await logoutUser(session.refreshToken);
      }
    } catch {
      // Local logout must still complete if the network is unavailable.
    } finally {
      await clearSession();

      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      error,
      login,
      register,
      logout,
      clearError,
    }),
    [user, status, error, login, register, logout, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
