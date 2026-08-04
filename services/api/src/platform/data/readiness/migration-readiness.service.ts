import { Injectable } from '@nestjs/common';

@Injectable()
export class MigrationReadinessService {
  check(migrations: string) {
    return {
      migrations,

      available: migrations === 'READY',

      checkedAt: new Date(),
    };
  }
}
