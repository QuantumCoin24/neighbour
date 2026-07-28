export type RelationshipStatus =
  'NONE' | 'OUTGOING_REQUEST' | 'INCOMING_REQUEST' | 'CONNECTED' | 'BLOCKED_BY_ME' | 'BLOCKED_ME';

export interface ConnectionProfileSummary {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  localArea: string | null;
}

export interface ConnectionResponse {
  id: string;
  status: 'PENDING' | 'CONNECTED' | 'DECLINED';
  direction: 'INCOMING' | 'OUTGOING' | 'CONNECTED';
  user: ConnectionProfileSummary;
  createdAt: Date;
  updatedAt: Date;
  connectedAt: Date | null;
}

export interface RelationshipStatusResponse {
  userId: string;
  status: RelationshipStatus;
  connectionId: string | null;
}

export interface BlockResponse {
  blocked: boolean;
  userId: string;
}
