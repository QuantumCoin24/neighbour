import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { PostModule } from '../post/post.module';
import { InteractionController } from './interaction.controller';
import { InteractionService } from './interaction.service';

@Module({
  imports: [DatabaseModule, PostModule],
  controllers: [InteractionController],
  providers: [InteractionService],
  exports: [InteractionService],
})
export class InteractionModule {}
