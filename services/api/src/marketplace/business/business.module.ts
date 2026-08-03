import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';

import { BusinessRepository } from './business.repository';
import { PrismaBusinessRepository } from './prisma-business.repository';
import { VerificationModule } from './verification/verification.module';
import { OfferModule } from './offers/offer.module';
import { BusinessEventModule } from './events/event.module';


@Module({

  imports:[
    DatabaseModule,
    VerificationModule,
    OfferModule,
    BusinessEventModule,
  ],


  controllers:[
    BusinessController,
  ],


  providers:[

    BusinessService,

    {
      provide:BusinessRepository,
      useClass:PrismaBusinessRepository,
    },

  ],


  exports:[
    BusinessService,
  ],

})
export class BusinessModule {}
