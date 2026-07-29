export interface IntegrationEntity {
  id: string;
  name: string;
  provider: string;
  status:
    | 'connected'
    | 'disconnected'
    | 'failed';
  createdAt: Date;
}
