export interface RealtimePayload<TData = unknown> {
  eventId: string;
  occurredAt: string;
  data: TData;
}
