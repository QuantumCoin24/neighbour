import {
  ApiClientError,
  changeCurrentEmail,
  changeCurrentPassword,
  deleteCurrentAccount,
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

import {
  clearSession,
  createSession,
  getSession,
  loadSession,
  refreshSessionAccessToken,
  saveSession,
} from './session';

export type AuthStatus = 'restoring' | 'anonymous' | 'authenticating' | 'authenticated';

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (details: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  changeEmail: (email: string, currentPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
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
        setUser(null);
        setStatus('anonymous');

        return;
      }

      let currentUser: AuthUser;

      try {
        currentUser = await getCurrentUser();
      } catch (caughtError) {
        if (!(caughtError instanceof ApiClientError) || caughtError.status !== 401) {
          throw caughtError;
        }

        const refreshedAccessToken = await refreshSessionAccessToken();

        if (!refreshedAccessToken) {
          await clearSession();
          setUser(null);
          setStatus('anonymous');

          return;
        }

        currentUser = await getCurrentUser();
      }

      const activeSession = getSession();

      if (!activeSession) {
        await clearSession();
        setUser(null);
        setStatus('anonymous');

        return;
      }

      await saveSession({
        ...activeSession,
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

  const changeEmail = useCallback(async (email: string, currentPassword: string) => {
    setError(null);

    try {
      await changeCurrentEmail({
        email: email.trim().toLowerCase(),
        currentPassword,
      });

      await clearSession();
      setUser(null);
      setStatus('anonymous');
    } catch (caughtError) {
      setError(getAuthenticationError(caughtError));
      throw caughtError;
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    setError(null);

    try {
      await changeCurrentPassword({
        currentPassword,
        newPassword,
      });

      await clearSession();
      setUser(null);
      setStatus('anonymous');
    } catch (caughtError) {
      setError(getAuthenticationError(caughtError));
      throw caughtError;
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    setError(null);

    try {
      await deleteCurrentAccount();
      await clearSession();

      setUser(null);
      setStatus('anonymous');
    } catch (caughtError) {
      setError(getAuthenticationError(caughtError));

      throw caughtError;
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
      changeEmail,
      changePassword,
      deleteAccount,
      clearError,
    }),
    [
      user,
      status,
      error,
      login,
      register,
      logout,
      changeEmail,
      changePassword,
      deleteAccount,
      clearError,
    ],
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
