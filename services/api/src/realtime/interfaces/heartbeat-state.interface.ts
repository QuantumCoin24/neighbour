export interface HeartbeatState {
  socketId: string;
  userId: string;
  clientTimestamp?: string;
  acknowledgedAt: string;
}
