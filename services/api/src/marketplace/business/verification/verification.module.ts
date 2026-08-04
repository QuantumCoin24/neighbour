import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../../database/database.module';

import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

import { VerificationRepository } from './verification.repository';
import { PrismaVerificationRepository } from './prisma-verification.repository';

@Module({
  imports: [DatabaseModule],

  controllers: [VerificationController],

  providers: [
    VerificationService,

    {
      provide: VerificationRepository,
      useClass: PrismaVerificationRepository,
    },
  ],

  exports: [VerificationService],
})
export class VerificationModule {}
