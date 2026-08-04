import { Injectable } from '@nestjs/common';

import { IntelligenceSnapshotService } from './snapshot/intelligence-snapshot.service';
import { RuleEngineService } from './rules/rule-engine.service';
import { DecisionService } from './decision/decision.service';
import { ResponseService } from './response/response.service';

@Injectable()
export class PlatformIntelligenceService {
  constructor(
    private readonly snapshotService: IntelligenceSnapshotService,
    private readonly rules: RuleEngineService,
    private readonly decisions: DecisionService,
    private readonly responses: ResponseService,
  ) {}

  evaluate(signal: string, value: number, action: string) {
    const snapshot = this.snapshotService.snapshot();

    const health = this.rules.evaluate(value);

    const decision = this.decisions.create(signal);

    const response = this.responses.execute(action);

    return {
      snapshot,

      health,

      decision,

      response,
    };
  }
}
