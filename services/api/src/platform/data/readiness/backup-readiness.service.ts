import { Injectable } from '@nestjs/common';


@Injectable()
export class BackupReadinessService {


  check(
    backups: string,
  ) {

    return {

      backups,

      available:
        backups === 'READY',

      checkedAt: new Date(),

    };

  }


}
