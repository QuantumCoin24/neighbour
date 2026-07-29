import { Injectable } from '@nestjs/common';

import type { VerificationEntity } from './verification.entity';

@Injectable()
export class VerificationService {
  private requests: VerificationEntity[] = [];

  create(request: VerificationEntity): VerificationEntity {
    this.requests.push(request);

    return request;
  }

  approve(id: string): VerificationEntity | undefined {
    const request = this.requests.find((item) => item.id === id);

    if (!request) {
      return undefined;
    }

    request.status = 'approved';
    request.updatedAt = new Date();

    return request;
  }

  findBySubject(subjectId: string) {
    return this.requests.filter((item) => item.subjectId === subjectId);
  }
}
