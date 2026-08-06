import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../../auth/interfaces/auth-user.interface';
import type {
  MarketplaceModerationPriority,
  MarketplaceModerationStatus,
} from '../../../generated/prisma/client';

import { AddMarketplaceFraudSignalDto } from '../dto/add-marketplace-fraud-signal.dto';
import { AssignMarketplaceModerationCaseDto } from '../dto/assign-marketplace-moderation-case.dto';
import { CreateMarketplaceModerationCaseDto } from '../dto/create-marketplace-moderation-case.dto';
import { UpdateMarketplaceModerationStatusDto } from '../dto/update-marketplace-moderation-status.dto';
import { MarketplaceModerationService } from '../services/marketplace-moderation.service';

@Controller('marketplace/moderation')
export class MarketplaceModerationController {
  constructor(private readonly moderation: MarketplaceModerationService) {}

  @Get('health')
  getHealth() {
    return this.moderation.getHealth();
  }

  @Get('rules')
  getRules() {
    return this.moderation.getRules();
  }

  @Get('transitions/:status')
  getTransitions(
    @Param('status')
    status: MarketplaceModerationStatus,
  ) {
    return this.moderation.getAllowedTransitions(status);
  }

  @Get('recommended-actions/:priority')
  getRecommendedActions(
    @Param('priority')
    priority: MarketplaceModerationPriority,
  ) {
    return this.moderation.getRecommendedActions(priority);
  }

  @Post('cases')
  createCase(
    @CurrentUser() user: AuthUser,
    @Body()
    dto: CreateMarketplaceModerationCaseDto,
  ) {
    return this.moderation.createCase(user.id, dto);
  }

  @Get('cases')
  listQueue() {
    return this.moderation.listQueue();
  }

  @Get('cases/:caseId')
  findOne(
    @Param('caseId')
    caseId: string,
  ) {
    return this.moderation.findOne(caseId);
  }

  @Post('cases/:caseId/assign')
  assign(
    @CurrentUser() user: AuthUser,
    @Param('caseId')
    caseId: string,
    @Body()
    dto: AssignMarketplaceModerationCaseDto,
  ) {
    return this.moderation.assign(user.id, caseId, dto);
  }

  @Post('cases/:caseId/fraud-signals')
  addFraudSignal(
    @CurrentUser() user: AuthUser,
    @Param('caseId')
    caseId: string,
    @Body()
    dto: AddMarketplaceFraudSignalDto,
  ) {
    return this.moderation.addFraudSignal(user.id, caseId, dto);
  }

  @Patch('cases/:caseId/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('caseId')
    caseId: string,
    @Body()
    dto: UpdateMarketplaceModerationStatusDto,
  ) {
    return this.moderation.updateStatus(user.id, caseId, dto);
  }

  @Post('cases/:caseId/recalculate-risk')
  recalculateRisk(
    @CurrentUser() user: AuthUser,
    @Param('caseId')
    caseId: string,
  ) {
    return this.moderation.recalculateRisk(user.id, caseId).then(() => ({
      recalculated: true,
    }));
  }
}
