import { Injectable } from '@nestjs/common';

@Injectable()
export class DataRecoveryService {
  createRecoveryPoint(name: string) {
    return {
      name,

      created: true,

      createdAt: new Date(),
    };
  }

  restore(point: string) {
    return {
      point,

      restored: true,

      restoredAt: new Date(),
    };
  }
}
