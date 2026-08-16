import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';

import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { Public } from '../../../auth/decorators/public.decorator';
import type { AuthUser } from '../../../auth/interfaces/auth-user.interface';

import { CancelMarketplacePaymentDto } from '../dto/cancel-marketplace-payment.dto';
import { ConfirmMarketplacePaymentDto } from '../dto/confirm-marketplace-payment.dto';
import { CreateMarketplacePaymentDto } from '../dto/create-marketplace-payment.dto';
import { CreateMarketplaceRefundDto } from '../dto/create-marketplace-refund.dto';
import { StripePaymentProvider } from '../providers/stripe-payment.provider';
import { MarketplacePaymentService } from '../services/marketplace-payment.service';

@Controller('marketplace/payments')
export class MarketplacePaymentController {
  constructor(
    private readonly payments: MarketplacePaymentService,
    private readonly stripe: StripePaymentProvider,
  ) {}

  @Public()
  @Post('stripe/webhook')
  async stripeWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    if (!request.rawBody) {
      throw new BadRequestException('Stripe webhook raw body is unavailable.');
    }

    if (!signature) {
      throw new BadRequestException('Stripe-Signature header is required.');
    }

    let event;

    try {
      event = this.stripe.constructWebhookEvent(
        request.rawBody,
        signature,
      );
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature.');
    }

    await this.payments.handleStripeWebhook(event);

    return {
      received: true,
    };
  }

  @Get('health')
  getHealth() {
    return this.payments.getHealth();
  }

  @Get('methods')
  getSupportedMethods() {
    return this.payments.getSupportedMethods();
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMarketplacePaymentDto) {
    return this.payments.create(user.id, dto);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthUser) {
    return this.payments.listMine(user.id);
  }

  @Get(':paymentId')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('paymentId')
    paymentId: string,
  ) {
    return this.payments.findOne(user.id, paymentId);
  }

  @Post(':paymentId/confirm')
  confirm(
    @CurrentUser() user: AuthUser,
    @Param('paymentId')
    paymentId: string,
    @Body() dto: ConfirmMarketplacePaymentDto,
  ) {
    return this.payments.confirm(user.id, paymentId, dto);
  }

  @Post(':paymentId/cancel')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('paymentId')
    paymentId: string,
    @Body() dto: CancelMarketplacePaymentDto,
  ) {
    return this.payments.cancel(user.id, paymentId, dto);
  }

  @Post(':paymentId/refunds')
  refund(
    @CurrentUser() user: AuthUser,
    @Param('paymentId')
    paymentId: string,
    @Body() dto: CreateMarketplaceRefundDto,
  ) {
    return this.payments.refund(user.id, paymentId, dto);
  }
}
