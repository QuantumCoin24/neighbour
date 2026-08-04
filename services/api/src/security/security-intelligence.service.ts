import { Injectable } from '@nestjs/common';

import { AccessService } from './access/access.service';
import { ConsentService } from './consent/consent.service';
import { TrustService } from './trust/trust.service';

@Injectable()
export class SecurityIntelligenceService {
  constructor(
    private readonly access: AccessService,

    private readonly consent: ConsentService,

    private readonly trust: TrustService,
  ) {}

  evaluate(input: {
    subjectId: string;
    resource: string;
    action: string;
    consentType: any;
    trustScore: number;
  }) {
    const permission = this.access.canAccess(input.subjectId, input.resource, input.action);

    const consent = this.consent.hasConsent(input.subjectId, input.consentType);

    const trust = this.trust.calculate(input.subjectId, input.trustScore);

    return {
      allowed: permission && consent && trust.score > 0,

      signals: {
        permission,

        consent,

        trust,
      },

      evaluatedAt: new Date(),
    };
  }
}
