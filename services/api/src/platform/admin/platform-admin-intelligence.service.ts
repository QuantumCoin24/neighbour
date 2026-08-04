import { Injectable } from '@nestjs/common';

import { UserManagementReadinessService } from './readiness/user-management-readiness.service';
import { ModerationReadinessService } from './readiness/moderation-readiness.service';
import { PlatformControlReadinessService } from './readiness/platform-control-readiness.service';

@Injectable()
export class PlatformAdminIntelligenceService {
  constructor(
    private readonly users: UserManagementReadinessService,

    private readonly moderation: ModerationReadinessService,

    private readonly control: PlatformControlReadinessService,
  ) {}

  analyse(input: { users: string; moderation: string; control: string }) {
    const userStatus = this.users.check(input.users);

    const moderationStatus = this.moderation.check(input.moderation);

    const controlStatus = this.control.check(input.control);

    const ready = userStatus.ready && moderationStatus.ready && controlStatus.ready;

    return {
      ready,

      status: ready ? 'OPERATIONAL' : 'REVIEW_REQUIRED',

      signals: {
        userStatus,
        moderationStatus,
        controlStatus,
      },
    };
  }
}
