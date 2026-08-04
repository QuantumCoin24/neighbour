import { apiRequest } from './index';

export interface ConnectionResponse {
  id: string;
  status: string;
  direction: string;
  user: {
    id: string;
    displayName: string;
    username: string | null;
    avatarUrl: string | null;
    localArea: string | null;
  };
  createdAt: string;
  updatedAt: string;
  connectedAt: string | null;
}

export interface RelationshipStatusResponse {
  userId: string;
  status:
    'NONE' | 'OUTGOING_REQUEST' | 'INCOMING_REQUEST' | 'CONNECTED' | 'BLOCKED_BY_ME' | 'BLOCKED_ME';
  connectionId: string | null;
}

export function sendConnectionRequest(token: string, userId: string) {
  return apiRequest<ConnectionResponse>(`/connections/requests/${userId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function acceptConnection(token: string, connectionId: string) {
  return apiRequest<ConnectionResponse>(`/connections/${connectionId}/accept`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getConnections(token: string) {
  return apiRequest<ConnectionResponse[]>('/connections', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getIncomingRequests(token: string) {
  return apiRequest<ConnectionResponse[]>('/connections/requests/incoming', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getRelationshipStatus(token: string, userId: string) {
  return apiRequest<RelationshipStatusResponse>(`/connections/relationship/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
