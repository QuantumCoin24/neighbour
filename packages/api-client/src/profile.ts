import { apiRequest } from "./index";

export interface CreateProfileInput {
  username: string;
  localArea: string;
  bio?: string;
}

export interface Profile {
  id: string;
  userId: string;
  username: string;
  localArea: string | null;
  bio?: string | null;
}

export function createProfile(
  data: CreateProfileInput,
  token: string,
) {
  return apiRequest<Profile>("/profile", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export function getMyProfile(token: string) {
  return apiRequest<Profile>("/profiles/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
