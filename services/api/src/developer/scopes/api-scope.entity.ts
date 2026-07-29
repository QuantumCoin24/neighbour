export interface ApiScopeEntity {
  id: string;
  appId: string;
  scope:
    | 'profile.read'
    | 'community.read'
    | 'events.read'
    | 'events.write'
    | 'business.read';
  enabled: boolean;
  createdAt: Date;
}
