import { Injectable } from '@nestjs/common';


@Injectable()
export class AutomationHistoryService {

  record(
    workflowId: string,
    result: string,
  ) {

    return {
      workflowId,
      result,
      createdAt: new Date(),
    };

  }

}
