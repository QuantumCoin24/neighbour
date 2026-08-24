export type LiveSessionStatus =
  'SCHEDULED' | 'STARTING' | 'LIVE' | 'ENDED' | 'CANCELLED' | 'FAILED';

export type LiveParticipantRole = 'HOST' | 'MODERATOR' | 'VIEWER';

export interface LiveSession {
  id: string;
  creatorId: string;
  communityId: string | null;
  neighbourhoodId: string | null;
  title: string | null;
  description: string | null;
  status: LiveSessionStatus;
  provider: string | null;
  providerRoomName: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  viewerCount: number;
}

export interface CreateLiveSessionInput {
  title?: string;
  description?: string;
  communityId?: string;
  neighbourhoodId?: string;
}

export interface LiveAccess {
  session: LiveSession;
  provider: 'livekit';
  roomName: string;
  serverUrl: string;
  token: string;
  role: LiveParticipantRole;
}
