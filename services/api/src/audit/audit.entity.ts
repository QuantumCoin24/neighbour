export interface AuditEntity {
  id: string;
  action: string;
  actorId: string;
  targetId: string;
  createdAt: Date;
}
