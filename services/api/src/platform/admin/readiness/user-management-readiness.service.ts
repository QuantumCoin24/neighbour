import { Injectable } from '@nestjs/common';


@Injectable()
export class UserManagementReadinessService {


  check(
    users: string,
  ) {

    return {

      users,

      ready:
        users === 'READY',

      checkedAt: new Date(),

    };

  }


}
