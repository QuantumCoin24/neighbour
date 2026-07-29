export interface AuditEventEntity {
  id: string;
  action: string;
  actorId: string;
  createdAt: Date;
}
