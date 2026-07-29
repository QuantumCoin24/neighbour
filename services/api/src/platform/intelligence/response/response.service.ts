import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponseService {

  execute(
    action: string,
  ) {

    return {
      action,
      executed: true,
      executedAt: new Date(),
    };

  }

}
