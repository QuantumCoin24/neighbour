import path from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { environment } from './config/environment';
import { environmentValidationSchema } from './config/environment.validation';

import { AuthModule } from './auth/auth.module';
import { CommunityModule } from './community/community.module';
import { DatabaseHealthModule } from './database/database-health.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { InteractionModule } from './interaction/interaction.module';
import { MessageModule } from './message/message.module';
import { NotificationModule } from './notification/notification.module';
import { PostModule } from './post/post.module';
import { ProfileModule } from './profile/profile.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SocialGraphModule } from './social-graph/social-graph.module';
import { NeighbourhoodModule } from './neighbourhood/neighbourhood.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(process.cwd(), '.env'),
      load: [environment],
      validationSchema: environmentValidationSchema,
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
    RealtimeModule,
    SocialGraphModule,
    NeighbourhoodModule,
    SearchModule,
  ],
})
export class AppModule {}
