export interface WebhookEntity {
  id: string;
  integrationId: string;
  event: string;
  receivedAt: Date;
}
