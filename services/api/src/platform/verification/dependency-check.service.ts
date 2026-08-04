import { Injectable } from '@nestjs/common';

@Injectable()
export class DependencyCheckService {
  verify(dependencies: string[]) {
    return {
      resolved: dependencies,
      healthy: true,
    };
  }
}
