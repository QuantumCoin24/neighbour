import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiVersionService {
  currentVersion(): string {
    return 'v1';
  }
}
