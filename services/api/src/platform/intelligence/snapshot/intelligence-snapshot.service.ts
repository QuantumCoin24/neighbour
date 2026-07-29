import { Injectable } from '@nestjs/common';

@Injectable()
export class IntelligenceSnapshotService {

  snapshot() {

    return {
      status: 'operational',
      generatedAt: new Date(),
    };

  }

}
