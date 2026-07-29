export interface MobileResponse<T> {
  success: boolean;
  data: T;
  appVersion?: string;
  timestamp: Date;
}
