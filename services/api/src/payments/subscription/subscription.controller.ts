import { Body, Controller, Get, Patch, Post } from '@nestjs/common';

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

  @Post('stripe/checkout')
  createStripeCheckout(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      plan: 'PLUS' | 'BUSINESS';
      interval: 'MONTHLY' | 'ANNUAL';
    },
  ) {
    return this.subscriptions.createStripeCheckout(user.id, body);
  }

  @Post('stripe/confirm')
  confirmStripeCheckout(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      sessionId: string;
    },
  ) {
    return this.subscriptions.confirmStripeCheckout(user.id, body.sessionId);
  }

  @Post('stripe/portal')
  createStripePortal(@CurrentUser() user: AuthUser) {
    return this.subscriptions.createStripePortal(user.id);
  }

  @Post('support')
  submitPrioritySupport(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      subject: string;
      message: string;
    },
  ) {
    return this.subscriptions.submitPrioritySupport(user.id, body);
  }
}
