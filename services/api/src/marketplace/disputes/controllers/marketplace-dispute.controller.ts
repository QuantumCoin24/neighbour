import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../../auth/interfaces/auth-user.interface';
import type { MarketplaceDisputeStatus } from '../../../generated/prisma/client';

import { AddMarketplaceDisputeEvidenceDto } from '../dto/add-marketplace-dispute-evidence.dto';
import { AddMarketplaceDisputeMessageDto } from '../dto/add-marketplace-dispute-message.dto';
import { CloseMarketplaceDisputeDto } from '../dto/close-marketplace-dispute.dto';
import { CreateMarketplaceDisputeDto } from '../dto/create-marketplace-dispute.dto';
import { EscalateMarketplaceDisputeDto } from '../dto/escalate-marketplace-dispute.dto';
import { RespondMarketplaceDisputeDto } from '../dto/respond-marketplace-dispute.dto';
import { MarketplaceDisputeService } from '../services/marketplace-dispute.service';

@Controller('marketplace/disputes')
export class MarketplaceDisputeController {
  constructor(private readonly disputes: MarketplaceDisputeService) {}

  @Get('health')
  getHealth() {
    return this.disputes.getHealth();
  }

  @Get('rules')
  getRules() {
    return this.disputes.getRules();
  }

  @Get('transitions/:status')
  getTransitions(
    @Param('status')
    status: MarketplaceDisputeStatus,
  ) {
    return this.disputes.getAllowedTransitions(status);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMarketplaceDisputeDto) {
    return this.disputes.create(user.id, dto);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthUser) {
    return this.disputes.listMine(user.id);
  }

  @Post('process-overdue')
  processOverdue() {
    return this.disputes.processOverdueResponses();
  }

  @Get(':disputeId')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('disputeId')
    disputeId: string,
  ) {
    return this.disputes.findOne(user.id, disputeId);
  }

  @Post(':disputeId/messages')
  addMessage(
    @CurrentUser() user: AuthUser,
    @Param('disputeId')
    disputeId: string,
    @Body() dto: AddMarketplaceDisputeMessageDto,
  ) {
    return this.disputes.addMessage(user.id, disputeId, dto);
  }

  @Post(':disputeId/respond')
  respond(
    @CurrentUser() user: AuthUser,
    @Param('disputeId')
    disputeId: string,
    @Body() dto: RespondMarketplaceDisputeDto,
  ) {
    return this.disputes.respond(user.id, disputeId, dto);
  }

  @Post(':disputeId/evidence')
  addEvidence(
    @CurrentUser() user: AuthUser,
    @Param('disputeId')
    disputeId: string,
    @Body() dto: AddMarketplaceDisputeEvidenceDto,
  ) {
    return this.disputes.addEvidence(user.id, disputeId, dto);
  }

  @Post(':disputeId/escalate')
  escalate(
    @CurrentUser() user: AuthUser,
    @Param('disputeId')
    disputeId: string,
    @Body() dto: EscalateMarketplaceDisputeDto,
  ) {
    return this.disputes.escalate(user.id, disputeId, dto);
  }

  @Post(':disputeId/cancel')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('disputeId')
    disputeId: string,
    @Body() dto: CloseMarketplaceDisputeDto,
  ) {
    return this.disputes.cancel(user.id, disputeId, dto);
  }
}
