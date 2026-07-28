import { Injectable } from '@nestjs/common';

export type ApnsEnvironment = 'development' | 'production';

export interface ApnsConfiguration {
  teamId: string;
  keyId: string;
  bundleId: string;
  privateKey: string;
  environment: ApnsEnvironment;
  host: string;
  tokenLifetimeSeconds: number;
  requestTimeoutMilliseconds: number;
}

@Injectable()
export class ApnsConfigurationService {
  load(environment: NodeJS.ProcessEnv = process.env): ApnsConfiguration {
    const teamId = this.requireValue(environment, 'APNS_TEAM_ID');
    const keyId = this.requireValue(environment, 'APNS_KEY_ID');
    const bundleId = this.requireValue(environment, 'APNS_BUNDLE_ID');
    const privateKey = this.requireValue(environment, 'APNS_PRIVATE_KEY').replaceAll('\\n', '\n');

    const apnsEnvironment = this.readEnvironment(environment.APNS_ENVIRONMENT);

    return {
      teamId,
      keyId,
      bundleId,
      privateKey,
      environment: apnsEnvironment,
      host: apnsEnvironment === 'production' ? 'api.push.apple.com' : 'api.sandbox.push.apple.com',
      tokenLifetimeSeconds: this.readPositiveInteger(
        environment.APNS_TOKEN_LIFETIME_SECONDS,
        3_000,
        'APNS_TOKEN_LIFETIME_SECONDS',
      ),
      requestTimeoutMilliseconds: this.readPositiveInteger(
        environment.APNS_REQUEST_TIMEOUT_MS,
        10_000,
        'APNS_REQUEST_TIMEOUT_MS',
      ),
    };
  }

  private requireValue(environment: NodeJS.ProcessEnv, key: string): string {
    const value = environment[key]?.trim();

    if (!value) {
      throw new Error(`Missing required APNs configuration: ${key}`);
    }

    return value;
  }

  private readEnvironment(value: string | undefined): ApnsEnvironment {
    if (!value || value === 'development') {
      return 'development';
    }

    if (value === 'production') {
      return 'production';
    }

    throw new Error('APNS_ENVIRONMENT must be either development or production');
  }

  private readPositiveInteger(value: string | undefined, fallback: number, key: string): number {
    if (!value) {
      return fallback;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error(`${key} must be a positive integer`);
    }

    return parsed;
  }
}
