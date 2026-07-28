import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { FeedController } from './feed.controller';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PostController, FeedController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
