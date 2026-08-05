import { apiRequest } from './client';

export interface CreateProfileInput {
  username: string;
  localArea?: string;
  bio?: string;
}

export interface UpdateProfileInput {
  username?: string;
  bio?: string;
  avatarUrl?: string;
  localArea?: string;
  showLocalArea?: boolean;
}

export interface PublicProfile {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  localArea: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PrivateProfile extends PublicProfile {
  showLocalArea: boolean;
}

export type Profile = PrivateProfile;

function tokenHeaders(token?: string): HeadersInit | undefined {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined;
}

export function createProfile(data: CreateProfileInput): Promise<PrivateProfile>;

export function createProfile(data: CreateProfileInput, token: string): Promise<PrivateProfile>;

export function createProfile(data: CreateProfileInput, token?: string): Promise<PrivateProfile> {
  return apiRequest<PrivateProfile>('/profiles', {
    method: 'POST',
    headers: tokenHeaders(token),
    body: JSON.stringify(data),
  });
}

export function updateMyProfile(data: UpdateProfileInput): Promise<PrivateProfile>;

export function updateMyProfile(data: UpdateProfileInput, token: string): Promise<PrivateProfile>;

export function updateMyProfile(data: UpdateProfileInput, token?: string): Promise<PrivateProfile> {
  return apiRequest<PrivateProfile>('/profiles/me', {
    method: 'PATCH',
    headers: tokenHeaders(token),
    body: JSON.stringify(data),
  });
}

export function getMyProfile(): Promise<PrivateProfile>;

export function getMyProfile(token: string): Promise<PrivateProfile>;

export function getMyProfile(token?: string): Promise<PrivateProfile> {
  return apiRequest<PrivateProfile>('/profiles/me', {
    headers: tokenHeaders(token),
  });
}

export function getPublicProfile(username: string): Promise<PublicProfile> {
  return apiRequest<PublicProfile>(`/profiles/${encodeURIComponent(username)}`);
}
