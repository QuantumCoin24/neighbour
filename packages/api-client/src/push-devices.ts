import { apiRequest } from './client';

export interface RegisterPushDeviceRequest {
  platform: 'ios' | 'web';
  token: string;
  deviceName?: string;
}

export function registerPushDevice(input: RegisterPushDeviceRequest): Promise<void> {
  return apiRequest<unknown>('/notifications/devices', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then(() => undefined);
}

export function unregisterPushDevice(token: string): Promise<void> {
  return apiRequest<void>(`/notifications/devices/${encodeURIComponent(token)}`, {
    method: 'DELETE',
  });
}
