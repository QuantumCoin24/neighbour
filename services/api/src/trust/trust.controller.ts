import { Controller, Get } from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { TrustIntelligenceService } from './trust-intelligence.service';
import { TrustProfileService } from './trust-profile.service';

@Controller('trust')
export class TrustController {
  constructor(
    private readonly trustProfile: TrustProfileService,
    private readonly trustIntelligence: TrustIntelligenceService,
  ) {}

  @Get('me')
  getMyTrustProfile(@CurrentUser() user: AuthUser) {
    return this.trustProfile.getUserTrust(user.id);
  }

  @Get('me/intelligence')
  getMyTrustIntelligence(@CurrentUser() user: AuthUser) {
    return this.trustIntelligence.analyse(user.id);
  }
}
