import { Injectable } from '@nestjs/common';

@Injectable()
export class AlertService {
  create(message: string) {
    return {
      message,
      createdAt: new Date(),
    };
  }
}
