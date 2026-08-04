import { Injectable } from '@nestjs/common';

@Injectable()
export class PlatformConfigService {
  private config: Record<string, unknown> = {};

  set(key: string, value: unknown) {
    this.config[key] = value;

    return value;
  }

  get(key: string) {
    return this.config[key];
  }
}
