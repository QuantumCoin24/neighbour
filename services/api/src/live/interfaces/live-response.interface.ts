export type LiveSessionStatusResponse =
  'SCHEDULED' | 'STARTING' | 'LIVE' | 'ENDED' | 'CANCELLED' | 'FAILED';

export type LiveParticipantRoleResponse = 'HOST' | 'MODERATOR' | 'VIEWER';

export interface LiveCreatorResponse {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface LiveSessionResponse {
  id: string;
  creatorId: string;
  communityId: string | null;
  neighbourhoodId: string | null;
  title: string | null;
  description: string | null;
  status: LiveSessionStatusResponse;
  provider: string | null;
  providerRoomName: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  creator: LiveCreatorResponse;
  viewerCount: number;
}

export interface LiveAccessResponse {
  session: LiveSessionResponse;
  provider: 'livekit';
  roomName: string;
  serverUrl: string;
  token: string;
  role: LiveParticipantRoleResponse;
}
