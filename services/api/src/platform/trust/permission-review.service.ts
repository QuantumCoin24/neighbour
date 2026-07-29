import { Injectable } from '@nestjs/common';


@Injectable()
export class PermissionReviewService {


  review(
    permission: string,
  ) {

    return {

      permission,

      valid:
        permission === 'VALID',

      reviewedAt: new Date(),

    };

  }


}
