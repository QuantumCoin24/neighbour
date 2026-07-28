import path from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';
import { CommunityModule } from './community/community.module';
import { environment } from './config/environment';
import { environmentValidationSchema } from './config/environment.validation';
import { DatabaseHealthModule } from './database/database-health.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { NotificationModule } from './notification/notification.module';
import { InteractionModule } from './interaction/interaction.module';
import { MessageModule } from './message/message.module';
import { ProfileModule } from './profile/profile.module';
import { PostModule } from './post/post.module';
import { SocialGraphModule } from './social-graph/social-graph.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    CommunityModule,
    DatabaseModule,
    DatabaseHealthModule,
    HealthModule,
    InteractionModule,
    MessageModule,
    NotificationModule,
    PostModule,
    ProfileModule,
    SocialGraphModule,
    RealtimeModule,
  ],
})
export class AppModule {}
