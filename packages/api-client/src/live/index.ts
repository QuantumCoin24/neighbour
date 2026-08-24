import { apiRequest } from '../client';
import type { CreateLiveSessionInput, LiveAccess, LiveSession } from './types';

export * from './types';

export function createLiveSession(input: CreateLiveSessionInput): Promise<LiveSession> {
  return apiRequest('/live/sessions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getActiveLiveSessions(): Promise<LiveSession[]> {
  return apiRequest('/live/sessions/active');
}

export function getLiveSession(liveSessionId: string): Promise<LiveSession> {
  return apiRequest(`/live/sessions/${encodeURIComponent(liveSessionId)}`);
}

export function getLiveAccess(liveSessionId: string): Promise<LiveAccess> {
  return apiRequest(`/live/sessions/${encodeURIComponent(liveSessionId)}/access`, {
    method: 'POST',
  });
}

export function startLiveSession(liveSessionId: string): Promise<LiveSession> {
  return apiRequest(`/live/sessions/${encodeURIComponent(liveSessionId)}/start`, {
    method: 'POST',
  });
}

export function leaveLiveSession(liveSessionId: string): Promise<void> {
  return apiRequest(`/live/sessions/${encodeURIComponent(liveSessionId)}/leave`, {
    method: 'POST',
  });
}

export function endLiveSession(liveSessionId: string): Promise<LiveSession> {
  return apiRequest(`/live/sessions/${encodeURIComponent(liveSessionId)}/end`, {
    method: 'POST',
  });
}
