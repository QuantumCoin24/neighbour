import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationCollapseService {
  private static readonly MAX_LENGTH = 64;

  build(namespace: string, identifier: string): string {
    const collapseId = `${namespace}:${identifier}`;

    return collapseId.length <= NotificationCollapseService.MAX_LENGTH
      ? collapseId
      : collapseId.slice(0, NotificationCollapseService.MAX_LENGTH);
  }
}
