import { Module } from '@nestjs/common';

import { PlatformAdminIntelligenceService } from './platform-admin-intelligence.service';

import { UserManagementReadinessService } from './readiness/user-management-readiness.service';
import { ModerationReadinessService } from './readiness/moderation-readiness.service';
import { PlatformControlReadinessService } from './readiness/platform-control-readiness.service';

@Module({
  providers: [
    PlatformAdminIntelligenceService,

    UserManagementReadinessService,

    ModerationReadinessService,

    PlatformControlReadinessService,
  ],

  exports: [PlatformAdminIntelligenceService],
})
export class AdminModule {}
