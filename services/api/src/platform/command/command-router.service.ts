import { Injectable } from '@nestjs/common';

@Injectable()
export class CommandRouterService {
  route(type: string) {
    return {
      commandType: type,

      routed: true,
    };
  }
}
