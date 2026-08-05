import { Body, Controller, Get, Patch } from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { ActivateSubscriptionDto } from './dto/activate-subscription.dto';
import { SubscriptionService } from './subscription.service';

@Controller('premium')
export class SubscriptionController {
  constructor(private readonly subscriptions: SubscriptionService) {}

  @Get('plans')
  getPlans() {
    return this.subscriptions.getPlans();
  }

  @Get('me')
  getMine(@CurrentUser() user: AuthUser) {
    return this.subscriptions.getOverview(user.id);
  }

  @Patch('me/internal-plan')
  activateInternalPlan(@CurrentUser() user: AuthUser, @Body() dto: ActivateSubscriptionDto) {
    return this.subscriptions.activateInternalPlan(user.id, dto.plan);
  }
}
