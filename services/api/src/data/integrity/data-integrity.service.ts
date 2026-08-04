import { Injectable } from '@nestjs/common';

@Injectable()
export class DataIntegrityService {
  check(records: number) {
    return {
      records,

      valid: records >= 0,

      checkedAt: new Date(),
    };
  }
}
