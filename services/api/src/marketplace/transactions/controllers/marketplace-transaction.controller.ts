import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../../auth/interfaces/auth-user.interface';

import { CounterMarketplaceOfferDto } from '../dto/counter-marketplace-offer.dto';
import { CreateMarketplaceOfferDto } from '../dto/create-marketplace-offer.dto';
import { MarketplaceOfferQueryDto } from '../dto/marketplace-offer-query.dto';
import { UpdateMarketplaceTransactionStatusDto } from '../dto/update-marketplace-transaction-status.dto';
import { MarketplaceTransactionService } from '../services/marketplace-transaction.service';

@Controller('marketplace')
export class MarketplaceTransactionController {
  constructor(private readonly service: MarketplaceTransactionService) {}

  @Post('listings/:listingId/purchase')
  purchaseListing(
    @CurrentUser() user: AuthUser,
    @Param('listingId') listingId: string,
  ) {
    return this.service.purchaseListing(user.id, listingId);
  }

  @Post('listings/:listingId/offers')
  createOffer(
    @CurrentUser() user: AuthUser,
    @Param('listingId') listingId: string,
    @Body() dto: CreateMarketplaceOfferDto,
  ) {
    return this.service.createOffer(user.id, listingId, dto);
  }

  @Get('listings/:listingId/offers')
  listListingOffers(@CurrentUser() user: AuthUser, @Param('listingId') listingId: string) {
    return this.service.listListingOffers(user.id, listingId);
  }

  @Get('offers/mine')
  listMine(@CurrentUser() user: AuthUser, @Query() query: MarketplaceOfferQueryDto) {
    return this.service.listMine(user.id, query);
  }

  @Get('offers/received')
  listReceived(@CurrentUser() user: AuthUser, @Query() query: MarketplaceOfferQueryDto) {
    return this.service.listReceived(user.id, query);
  }

  @Get('offers/:offerId')
  getOffer(@CurrentUser() user: AuthUser, @Param('offerId') offerId: string) {
    return this.service.getOffer(user.id, offerId);
  }

  @Post('offers/:offerId/counter')
  counterOffer(
    @CurrentUser() user: AuthUser,
    @Param('offerId') offerId: string,
    @Body() dto: CounterMarketplaceOfferDto,
  ) {
    return this.service.counterOffer(user.id, offerId, dto);
  }

  @Post('offers/:offerId/accept')
  acceptOffer(@CurrentUser() user: AuthUser, @Param('offerId') offerId: string) {
    return this.service.acceptOffer(user.id, offerId);
  }

  @Post('offers/:offerId/decline')
  declineOffer(@CurrentUser() user: AuthUser, @Param('offerId') offerId: string) {
    return this.service.declineOffer(user.id, offerId);
  }

  @Post('offers/:offerId/withdraw')
  withdrawOffer(@CurrentUser() user: AuthUser, @Param('offerId') offerId: string) {
    return this.service.withdrawOffer(user.id, offerId);
  }

  @Post('transactions/process-expired')
  processExpiredState() {
    return this.service.processExpiredState();
  }

  @Get('transactions')
  listTransactions(@CurrentUser() user: AuthUser) {
    return this.service.listTransactions(user.id);
  }

  @Get('transactions/:transactionId')
  getTransaction(
    @CurrentUser() user: AuthUser,
    @Param('transactionId')
    transactionId: string,
  ) {
    return this.service.getTransaction(user.id, transactionId);
  }

  @Patch('transactions/:transactionId/status')
  updateTransactionStatus(
    @CurrentUser() user: AuthUser,
    @Param('transactionId')
    transactionId: string,
    @Body()
    dto: UpdateMarketplaceTransactionStatusDto,
  ) {
    return this.service.updateTransactionStatus(user.id, transactionId, dto.status);
  }

  @Patch('transactions/:transactionId/complete')
  completeTransaction(
    @CurrentUser() user: AuthUser,
    @Param('transactionId')
    transactionId: string,
  ) {
    return this.service.completeTransaction(user.id, transactionId);
  }

  @Patch('transactions/:transactionId/cancel')
  cancelTransaction(
    @CurrentUser() user: AuthUser,
    @Param('transactionId')
    transactionId: string,
  ) {
    return this.service.cancelTransaction(user.id, transactionId);
  }
}
