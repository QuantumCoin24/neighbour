export type PushProviderName = 'apns' | 'fcm';

export interface PushDeliveryRequest {
  id: string;
  deviceToken: string;
  payload: Readonly<Record<string, unknown>>;
  collapseId?: string;
}

export interface PushDeliveryResponse {
  provider: PushProviderName;
  success: boolean;
  status: number;
  providerRequestId?: string;
  reason?: string;
}

export interface PushProvider {
  readonly name: PushProviderName;

  send(request: PushDeliveryRequest): Promise<PushDeliveryResponse>;
}
