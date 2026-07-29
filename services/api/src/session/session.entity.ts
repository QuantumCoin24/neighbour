export interface SessionEntity {
  id: string;
  userId: string;
  deviceId: string;
  active: boolean;
  lastActivity: Date;
  createdAt: Date;
}
