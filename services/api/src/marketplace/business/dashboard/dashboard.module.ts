import { Module } from '@nestjs/common';

import { BusinessModule } from '../business.module';
import { VerificationModule } from '../verification/verification.module';
import { OfferModule } from '../offers/offer.module';
import { BusinessEventModule } from '../events/event.module';

import { BusinessDashboardController } from './dashboard.controller';
import { BusinessDashboardService } from './dashboard.service';


@Module({

imports:[

  BusinessModule,

  VerificationModule,

  OfferModule,

  BusinessEventModule,

],

controllers:[

  BusinessDashboardController,

],

providers:[

  BusinessDashboardService,

],

})

export class BusinessDashboardModule {}
