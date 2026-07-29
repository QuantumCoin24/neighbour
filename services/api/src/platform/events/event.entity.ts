export interface EventEntity {
  id: string;
  type: string;
  payload: unknown;
  createdAt: Date;
}
