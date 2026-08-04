import { AuthProviderContext } from './auth-context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProviderContext>{children}</AuthProviderContext>;
}
