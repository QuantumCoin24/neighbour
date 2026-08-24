import { apiRequest } from '../client';

import type {
  CreateVibeCommentInput,
  CreateVibeInput,
  RecordVibeViewInput,
  UpdateVibeInput,
  Vibe,
  VibeComment,
  VibeFeed,
  VibeFeedQuery,
  VibeReactionType,
} from './types';

export * from './types';

function buildVibeQuery(query: VibeFeedQuery = {}): string {
  const params = new URLSearchParams();

  if (query.cursor) {
    params.set('cursor', query.cursor);
  }

  if (query.limit !== undefined) {
    params.set('limit', String(query.limit));
  }

  if (query.mode) {
    params.set('mode', query.mode);
  }

  if (query.communityId) {
    params.set('communityId', query.communityId);
  }

  if (query.neighbourhoodId) {
    params.set('neighbourhoodId', query.neighbourhoodId);
  }

  const value = params.toString();

  return value ? `?${value}` : '';
}

export function createVibe(input: CreateVibeInput): Promise<Vibe> {
  return apiRequest('/vibes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateVibe(vibeId: string, input: UpdateVibeInput): Promise<Vibe> {
  return apiRequest(`/vibes/${encodeURIComponent(vibeId)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deleteVibe(vibeId: string): Promise<void> {
  return apiRequest(`/vibes/${encodeURIComponent(vibeId)}`, {
    method: 'DELETE',
  });
}

export function getVibe(vibeId: string): Promise<Vibe> {
  return apiRequest(`/vibes/${encodeURIComponent(vibeId)}`);
}

export function getVibesFeed(query: VibeFeedQuery = {}): Promise<VibeFeed> {
  return apiRequest(`/vibes/feed${buildVibeQuery(query)}`);
}

export function reactToVibe(vibeId: string, type: VibeReactionType): Promise<Vibe> {
  return apiRequest(`/vibes/${encodeURIComponent(vibeId)}/reaction`, {
    method: 'POST',
    body: JSON.stringify({ type }),
  });
}

export function removeVibeReaction(vibeId: string): Promise<void> {
  return apiRequest(`/vibes/${encodeURIComponent(vibeId)}/reaction`, {
    method: 'DELETE',
  });
}

export function getVibeComments(vibeId: string): Promise<VibeComment[]> {
  return apiRequest(`/vibes/${encodeURIComponent(vibeId)}/comments`);
}

export function createVibeComment(
  vibeId: string,
  input: CreateVibeCommentInput,
): Promise<VibeComment> {
  return apiRequest(`/vibes/${encodeURIComponent(vibeId)}/comments`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteVibeComment(commentId: string): Promise<void> {
  return apiRequest(`/vibes/comments/${encodeURIComponent(commentId)}`, {
    method: 'DELETE',
  });
}

export function saveVibe(vibeId: string): Promise<{ saved: true }> {
  return apiRequest(`/vibes/${encodeURIComponent(vibeId)}/save`, {
    method: 'POST',
  });
}

export function unsaveVibe(vibeId: string): Promise<{ saved: false }> {
  return apiRequest(`/vibes/${encodeURIComponent(vibeId)}/save`, {
    method: 'DELETE',
  });
}

export function recordVibeView(
  vibeId: string,
  input: RecordVibeViewInput,
): Promise<{ id: string; recorded: true }> {
  return apiRequest(`/vibes/${encodeURIComponent(vibeId)}/views`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
