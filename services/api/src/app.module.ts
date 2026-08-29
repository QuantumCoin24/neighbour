import path from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { environment } from './config/environment';
import { environmentValidationSchema } from './config/environment.validation';

import { AuthModule } from './auth/auth.module';
import { ActivityModule } from './activity/activity.module';
import { GeoModule } from './geo/geo.module';
import { CommunityModule } from './community/community.module';
import { DatabaseHealthModule } from './database/database-health.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { InteractionModule } from './interaction/interaction.module';
import { MessageModule } from './message/message.module';
import { MediaModule } from './media/media.module';
import { NotificationModule } from './notification/notification.module';
import { PostModule } from './post/post.module';
import { ProfileModule } from './profile/profile.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SocialGraphModule } from './social-graph/social-graph.module';
import { NeighbourhoodModule } from './neighbourhood/neighbourhood.module';
import { SearchModule } from './search/search.module';
import { PlatformModule } from './platform/platform.module';
import { TrustModule } from './trust/trust.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { DeveloperModule } from './developer/developer.module';
import { SecurityModule } from './security/security.module';
import { BusinessModule } from './marketplace/business/business.module';
import { BusinessDashboardModule } from './marketplace/business/dashboard/dashboard.module';
import { OrganisationModule } from './organisation/organisation.module';

import { AppleCommerceModule } from './payments/apple/apple-commerce.module';
import { SubscriptionModule } from './payments/subscription/subscription.module';
import { ReadinessModule } from './operations/readiness/readiness.module';
import { MarketplaceListingModule } from './marketplace/listings/marketplace-listing.module';
import { MarketplaceModerationModule } from './marketplace/moderation/marketplace-moderation.module';
import { MarketplaceDisputeModule } from './marketplace/disputes/marketplace-dispute.module';
import { MarketplaceReputationModule } from './marketplace/reputation/marketplace-reputation.module';
import { MarketplacePaymentModule } from './marketplace/payments/marketplace-payment.module';
import { FulfilmentModule } from './marketplace/fulfilment/fulfilment.module';
import { MarketplaceTransactionModule } from './marketplace/transactions/marketplace-transaction.module';
import { NearbyModule } from './nearby/nearby.module';
import { MapDiscoveryModule } from './map-discovery/map-discovery.module';
import { TrailModule } from './trail/trail.module';
import { VibesModule } from './vibes/vibes.module';
import { LiveModule } from './live/live.module';
@Module({
  imports: [
    VibesModule,
    LiveModule,
    NearbyModule,
    MapDiscoveryModule,
    TrailModule,
    ReadinessModule,
    SubscriptionModule,
    AppleCommerceModule,
    GeoModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(__dirname, '../../../.env'),
      load: [environment],
      validationSchema: environmentValidationSchema,
    }),

    AuthModule,
    ActivityModule,
    CommunityModule,
    DatabaseModule,
    DatabaseHealthModule,
    HealthModule,
    InteractionModule,
    MessageModule,
    MediaModule,
    NotificationModule,
    PostModule,
    ProfileModule,
    RealtimeModule,
    SocialGraphModule,
    NeighbourhoodModule,
    SearchModule,
    PlatformModule,
    TrustModule,
    IntegrationsModule,
    DeveloperModule,
    SecurityModule,
    BusinessModule,
    BusinessDashboardModule,
    OrganisationModule,
    MarketplaceListingModule,
    MarketplaceTransactionModule,
    FulfilmentModule,
    MarketplacePaymentModule,
    MarketplaceReputationModule,
    MarketplaceDisputeModule,
    MarketplaceModerationModule,
  ],
})
export class AppModule {}
