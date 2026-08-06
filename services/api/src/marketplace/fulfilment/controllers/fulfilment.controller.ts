import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../../auth/interfaces/auth-user.interface';

import { CreateCollectionDto } from '../dto/create-collection.dto';
import { CreateDeliveryDto } from '../dto/create-delivery.dto';
import { CreateFulfilmentDto } from '../dto/create-fulfilment.dto';
import { UploadProofDto } from '../dto/upload-proof.dto';
import { VerifyPinDto } from '../dto/verify-pin.dto';
import { VerifyQrDto } from '../dto/verify-qr.dto';
import { FulfilmentService } from '../services/fulfilment.service';

@Controller('marketplace/fulfilments')
export class FulfilmentController {
  constructor(private readonly service: FulfilmentService) {}

  @Get('health')
  getHealth() {
    return this.service.getHealth();
  }

  @Post('transactions/:transactionId')
  create(
    @CurrentUser() user: AuthUser,
    @Param('transactionId')
    transactionId: string,
    @Body() dto: CreateFulfilmentDto,
  ) {
    return this.service.create(user.id, transactionId, dto);
  }

  @Get('transactions/:transactionId')
  findByTransaction(
    @CurrentUser() user: AuthUser,
    @Param('transactionId')
    transactionId: string,
  ) {
    return this.service.findByTransaction(user.id, transactionId);
  }

  @Get(':fulfilmentId')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('fulfilmentId')
    fulfilmentId: string,
  ) {
    return this.service.findOne(user.id, fulfilmentId);
  }

  @Post(':fulfilmentId/collection')
  createCollection(
    @CurrentUser() user: AuthUser,
    @Param('fulfilmentId')
    fulfilmentId: string,
    @Body() dto: CreateCollectionDto,
  ) {
    return this.service.createCollection(user.id, fulfilmentId, dto);
  }

  @Post(':fulfilmentId/delivery')
  createDelivery(
    @CurrentUser() user: AuthUser,
    @Param('fulfilmentId')
    fulfilmentId: string,
    @Body() dto: CreateDeliveryDto,
  ) {
    return this.service.createDelivery(user.id, fulfilmentId, dto);
  }

  @Post(':fulfilmentId/pin')
  generatePin(
    @CurrentUser() user: AuthUser,
    @Param('fulfilmentId')
    fulfilmentId: string,
  ) {
    return this.service.generatePin(user.id, fulfilmentId);
  }

  @Post(':fulfilmentId/qr')
  generateQr(
    @CurrentUser() user: AuthUser,
    @Param('fulfilmentId')
    fulfilmentId: string,
  ) {
    return this.service.generateQr(user.id, fulfilmentId);
  }

  @Post(':fulfilmentId/pin/verify')
  verifyPin(
    @CurrentUser() user: AuthUser,
    @Param('fulfilmentId')
    fulfilmentId: string,
    @Body() dto: VerifyPinDto,
  ) {
    return this.service.verifyPin(user.id, fulfilmentId, dto.pin);
  }

  @Post(':fulfilmentId/qr/verify')
  verifyQr(
    @CurrentUser() user: AuthUser,
    @Param('fulfilmentId')
    fulfilmentId: string,
    @Body() dto: VerifyQrDto,
  ) {
    return this.service.verifyQr(user.id, fulfilmentId, dto.token);
  }

  @Post(':fulfilmentId/proofs')
  addProof(
    @CurrentUser() user: AuthUser,
    @Param('fulfilmentId')
    fulfilmentId: string,
    @Body() dto: UploadProofDto,
  ) {
    return this.service.addProof(user.id, fulfilmentId, dto);
  }

  @Post(':fulfilmentId/confirm')
  confirm(
    @CurrentUser() user: AuthUser,
    @Param('fulfilmentId')
    fulfilmentId: string,
  ) {
    return this.service.confirm(user.id, fulfilmentId);
  }
}
