import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { CreateMarketplaceListingDto } from './dto/create-marketplace-listing.dto';
import { SearchMarketplaceListingsDto } from './dto/search-marketplace-listings.dto';
import { UpdateMarketplaceListingDto } from './dto/update-marketplace-listing.dto';
import { MarketplaceListingService } from './marketplace-listing.service';

@Controller('marketplace/listings')
export class MarketplaceListingController {
  constructor(private readonly service: MarketplaceListingService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMarketplaceListingDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  search(@CurrentUser() user: AuthUser, @Query() query: SearchMarketplaceListingsDto) {
    return this.service.search(user.id, query);
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.service.findMine(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMarketplaceListingDto,
  ) {
    return this.service.update(user.id, id, dto);
  }

  @Post(':id/saved')
  toggleSaved(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.toggleSaved(user.id, id);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  delete(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<void> {
    return this.service.delete(user.id, id);
  }
}
