import { Injectable } from '@nestjs/common';

@Injectable()
export class ObservabilitySnapshotService {
  snapshot() {
    return {
      status: 'OPERATIONAL',

      generatedAt: new Date(),
    };
  }
}
