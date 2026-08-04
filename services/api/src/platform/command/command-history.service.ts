import { Injectable } from '@nestjs/common';

@Injectable()
export class CommandHistoryService {
  record(commandId: string, result: string) {
    return {
      commandId,

      result,

      createdAt: new Date(),
    };
  }
}
