import { Module } from '@nestjs/common';

import { SecurityEventBusService } from './events/security-event-bus.service';
import { TrustService } from './trust/trust.service';
import { PrivacyService } from './privacy/privacy.service';
import { ReportModule } from './reports/report.module';
import { ModerationModule } from './moderation/moderation.module';

@Module({
  imports:[ReportModule, ModerationModule],
  providers: [
    SecurityEventBusService,
    TrustService,
    PrivacyService,
  ],
  exports: [
    SecurityEventBusService,
    TrustService,
    PrivacyService,
  ],
})
export class SecurityModule {}
