export interface ConnectorEntity {
  id: string;
  integrationId: string;
  endpoint: string;
  active: boolean;
  createdAt: Date;
}
