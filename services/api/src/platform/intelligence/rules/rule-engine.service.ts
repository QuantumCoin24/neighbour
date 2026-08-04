import { Injectable } from '@nestjs/common';

@Injectable()
export class RuleEngineService {
  evaluate(value: number) {
    return value < 50 ? 'warning' : 'healthy';
  }
}
