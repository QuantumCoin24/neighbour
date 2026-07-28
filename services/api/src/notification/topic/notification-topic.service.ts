import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationTopicService {
  constructor(
    private readonly bundleId: string = process.env.APPLE_BUNDLE_ID ?? 'com.neighbour.app',
  ) {}

  get(): string {
    return this.bundleId;
  }
}
