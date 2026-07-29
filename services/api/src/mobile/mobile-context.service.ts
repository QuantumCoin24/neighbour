import { Injectable } from '@nestjs/common';

@Injectable()
export class MobileContextService {
  createContext(userId: string, deviceId: string) {
    return {
      userId,
      deviceId,
      createdAt: new Date(),
    };
  }
}
