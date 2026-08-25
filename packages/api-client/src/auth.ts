import { apiRequest } from './client';

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function loginUser(data: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getCurrentUser(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me');
}

export function refreshAuthTokens(refreshToken: string): Promise<AuthTokens> {
  return apiRequest<AuthTokens>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({
      refreshToken,
    }),
  });
}

export function logoutUser(refreshToken: string): Promise<{ success: true }> {
  return apiRequest<{ success: true }>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({
      refreshToken,
    }),
  });
}

export function deleteCurrentAccount(): Promise<{ success: true }> {
  return apiRequest<{ success: true }>('/auth/account', {
    method: 'DELETE',
  });
}

export interface ChangeEmailRequest {
  email: string;
  currentPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export function changeCurrentEmail(data: ChangeEmailRequest): Promise<{ success: true }> {
  return apiRequest<{ success: true }>('/auth/email', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function changeCurrentPassword(data: ChangePasswordRequest): Promise<{ success: true }> {
  return apiRequest<{ success: true }>('/auth/password', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
