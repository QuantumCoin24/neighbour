import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../../database/database.service';
import { LocationVisibility, MarketplaceListingStatus } from '../../generated/prisma/client';

import type { NearbyQueryDto, NearbyResultType } from '../dto/nearby-query.dto';
import type {
  NearbyCoordinates,
  NearbyHealthResponse,
  NearbyResponse,
  NearbyResult,
} from '../interfaces/nearby-response.interface';
import { NearbyDistanceService } from './distance.service';
import { NearbyRadiusService } from './radius.service';
import { NearbyRankingService } from './ranking.service';

@Injectable()
export class NearbyService {
  constructor(
    private readonly database: DatabaseService,
    private readonly distance: NearbyDistanceService,
    private readonly radius: NearbyRadiusService,
    private readonly ranking: NearbyRankingService,
  ) {}

  health(): NearbyHealthResponse {
    return {
      module: 'NearbyOS',
      status: 'operational',
      version: '1.0.0',
      capabilities: [
        'RADIUS_SEARCH',
        'DISTANCE_CALCULATION',
        'MULTI_DOMAIN_RESULTS',
        'RELEVANCE_RANKING',
      ],
    };
  }

  radiusPresets() {
    return this.radius.getPresets();
  }

  async discover(query: NearbyQueryDto): Promise<NearbyResponse> {
    const origin: NearbyCoordinates = {
      latitude: query.latitude,
      longitude: query.longitude,
    };

    const radiusKm = this.radius.normalize(query.radiusKm);

    const requestedTypes = new Set<NearbyResultType>(
      query.types ?? ['COMMUNITY', 'BUSINESS', 'EVENT', 'MARKETPLACE_LISTING'],
    );

    const bounds = this.distance.boundingBox(origin, radiusKm);

    const [communities, businesses, events, listings] = await Promise.all([
      requestedTypes.has('COMMUNITY')
        ? this.findCommunities(origin, radiusKm, bounds)
        : Promise.resolve([]),

      requestedTypes.has('BUSINESS')
        ? this.findBusinesses(origin, radiusKm, bounds, query.verifiedOnly === true)
        : Promise.resolve([]),

      requestedTypes.has('EVENT')
        ? this.findEvents(origin, radiusKm, bounds, query.eventsOnlyUpcoming !== false)
        : Promise.resolve([]),

      requestedTypes.has('MARKETPLACE_LISTING')
        ? this.findMarketplaceListings(origin, radiusKm, bounds)
        : Promise.resolve([]),
    ]);

    const results = this.ranking
      .sort([...communities, ...businesses, ...events, ...listings], query.sort)
      .slice(0, query.limit);

    return {
      origin,
      radiusKm,
      sort: query.sort,
      generatedAt: new Date().toISOString(),
      summary: {
        total: results.length,
        communities: results.filter((result) => result.type === 'COMMUNITY').length,
        businesses: results.filter((result) => result.type === 'BUSINESS').length,
        events: results.filter((result) => result.type === 'EVENT').length,
        marketplaceListings: results.filter((result) => result.type === 'MARKETPLACE_LISTING')
          .length,
      },
      results,
    };
  }

  private async findCommunities(
    origin: NearbyCoordinates,
    radiusKm: number,
    bounds: ReturnType<NearbyDistanceService['boundingBox']>,
  ): Promise<NearbyResult[]> {
    const communities = await this.database.community.findMany({
      where: {
        discoverable: true,
        latitude: {
          gte: bounds.minimumLatitude,
          lte: bounds.maximumLatitude,
        },
        longitude: {
          gte: bounds.minimumLongitude,
          lte: bounds.maximumLongitude,
        },
        locationVisibility: LocationVisibility.PUBLIC,
      },
      include: {
        _count: {
          select: {
            memberships: true,
            posts: true,
            events: true,
          },
        },
      },
      take: 150,
    });

    return communities
      .map((community) => {
        const coordinates = this.coordinates(community.latitude, community.longitude);

        if (!coordinates) {
          return null;
        }

        const distanceKm = this.distance.calculateKilometres(origin, coordinates);

        if (distanceKm > radiusKm) {
          return null;
        }

        const popularity = Math.min(
          100,
          community._count.memberships * 2 + community._count.posts + community._count.events * 3,
        );

        return this.result({
          id: community.id,
          type: 'COMMUNITY',
          title: community.name,
          description: community.shortDescription ?? community.description,
          coordinates,
          distanceKm,
          radiusKm,
          verified: false,
          communityId: community.id,
          ownerId: null,
          category: community.category,
          postcode: community.postcode,
          imageUrl: community.logoUrl,
          pricePence: null,
          isFree: true,
          startsAt: null,
          endsAt: null,
          createdAt: community.createdAt,
          popularity,
          freshness: this.freshness(community.updatedAt),
          metadata: {
            slug: community.slug,
            handle: community.handle,
            memberCount: community._count.memberships,
            postCount: community._count.posts,
            eventCount: community._count.events,
          },
        });
      })
      .filter((result): result is NearbyResult => result !== null);
  }

  private async findBusinesses(
    origin: NearbyCoordinates,
    radiusKm: number,
    bounds: ReturnType<NearbyDistanceService['boundingBox']>,
    verifiedOnly: boolean,
  ): Promise<NearbyResult[]> {
    const businesses = await this.database.business.findMany({
      where: {
        ...(verifiedOnly
          ? {
              verified: true,
            }
          : {}),
        latitude: {
          gte: bounds.minimumLatitude,
          lte: bounds.maximumLatitude,
        },
        longitude: {
          gte: bounds.minimumLongitude,
          lte: bounds.maximumLongitude,
        },
        locationVisibility: LocationVisibility.PUBLIC,
      },
      include: {
        _count: {
          select: {
            offers: true,
            businessEvents: true,
          },
        },
      },
      take: 150,
    });

    return businesses
      .map((business) => {
        const coordinates = this.coordinates(business.latitude, business.longitude);

        if (!coordinates) {
          return null;
        }

        const distanceKm = this.distance.calculateKilometres(origin, coordinates);

        if (distanceKm > radiusKm) {
          return null;
        }

        const popularity = Math.min(
          100,
          business._count.offers * 5 + business._count.businessEvents * 4,
        );

        return this.result({
          id: business.id,
          type: 'BUSINESS',
          title: business.name,
          description: business.description,
          coordinates,
          distanceKm,
          radiusKm,
          verified: business.verified,
          communityId: business.communityId,
          ownerId: business.ownerId,
          category: business.category,
          postcode: business.postcode,
          imageUrl: null,
          pricePence: null,
          isFree: false,
          startsAt: null,
          endsAt: null,
          createdAt: business.createdAt,
          popularity,
          freshness: this.freshness(business.updatedAt),
          metadata: {
            offerCount: business._count.offers,
            eventCount: business._count.businessEvents,
            city: business.city,
          },
        });
      })
      .filter((result): result is NearbyResult => result !== null);
  }

  private async findEvents(
    origin: NearbyCoordinates,
    radiusKm: number,
    bounds: ReturnType<NearbyDistanceService['boundingBox']>,
    upcomingOnly: boolean,
  ): Promise<NearbyResult[]> {
    const events = await this.database.event.findMany({
      where: {
        ...(upcomingOnly
          ? {
              endsAt: {
                gte: new Date(),
              },
            }
          : {}),
        latitude: {
          gte: bounds.minimumLatitude,
          lte: bounds.maximumLatitude,
        },
        longitude: {
          gte: bounds.minimumLongitude,
          lte: bounds.maximumLongitude,
        },
        locationVisibility: LocationVisibility.PUBLIC,
      },
      include: {
        _count: {
          select: {
            attendances: true,
          },
        },
      },
      orderBy: {
        startsAt: 'asc',
      },
      take: 150,
    });

    return events
      .map((event) => {
        const coordinates = this.coordinates(event.latitude, event.longitude);

        if (!coordinates) {
          return null;
        }

        const distanceKm = this.distance.calculateKilometres(origin, coordinates);

        if (distanceKm > radiusKm) {
          return null;
        }

        return this.result({
          id: event.id,
          type: 'EVENT',
          title: event.title,
          description: event.description,
          coordinates,
          distanceKm,
          radiusKm,
          verified: false,
          communityId: event.communityId,
          ownerId: event.creatorId,
          category: null,
          postcode: event.postcode,
          imageUrl: null,
          pricePence: null,
          isFree: true,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          createdAt: event.createdAt,
          popularity: Math.min(100, event._count.attendances * 5),
          freshness: this.freshness(event.createdAt),
          metadata: {
            attendanceCount: event._count.attendances,
            city: event.city,
          },
        });
      })
      .filter((result): result is NearbyResult => result !== null);
  }

  private async findMarketplaceListings(
    origin: NearbyCoordinates,
    radiusKm: number,
    bounds: ReturnType<NearbyDistanceService['boundingBox']>,
  ): Promise<NearbyResult[]> {
    const listings = await this.database.marketplaceListing.findMany({
      where: {
        status: MarketplaceListingStatus.PUBLISHED,
        deletedAt: null,
        latitude: {
          gte: bounds.minimumLatitude,
          lte: bounds.maximumLatitude,
        },
        longitude: {
          gte: bounds.minimumLongitude,
          lte: bounds.maximumLongitude,
        },
      },
      include: {
        media: {
          include: {
            media: true,
          },
          orderBy: {
            position: 'asc',
          },
          take: 1,
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 150,
    });

    return listings
      .map((listing) => {
        const coordinates = this.coordinates(listing.latitude, listing.longitude);

        if (!coordinates) {
          return null;
        }

        const distanceKm = this.distance.calculateKilometres(origin, coordinates);

        if (distanceKm > radiusKm) {
          return null;
        }

        return this.result({
          id: listing.id,
          type: 'MARKETPLACE_LISTING',
          title: listing.title,
          description: listing.description,
          coordinates,
          distanceKm,
          radiusKm,
          verified: false,
          communityId: listing.communityId,
          ownerId: listing.sellerId,
          category: listing.category,
          postcode: listing.postcodeDistrict,
          imageUrl: listing.media[0]?.media.publicUrl ?? null,
          pricePence: listing.pricePence,
          isFree: listing.isFree,
          startsAt: null,
          endsAt: null,
          createdAt: listing.createdAt,
          popularity: Math.min(100, listing.viewCount),
          freshness: this.freshness(listing.updatedAt),
          metadata: {
            condition: listing.condition,
            acceptsOffers: listing.acceptsOffers,
            collectionAvailable: listing.collectionAvailable,
            deliveryAvailable: listing.deliveryAvailable,
            postageAvailable: listing.postageAvailable,
            localArea: listing.localArea,
          },
        });
      })
      .filter((result): result is NearbyResult => result !== null);
  }

  private result(input: {
    id: string;
    type: NearbyResultType;
    title: string;
    description: string | null;
    coordinates: NearbyCoordinates;
    distanceKm: number;
    radiusKm: number;
    verified: boolean;
    communityId: string | null;
    ownerId: string | null;
    category: string | null;
    postcode: string | null;
    imageUrl: string | null;
    pricePence: number | null;
    isFree: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
    createdAt: Date;
    popularity: number;
    freshness: number;
    metadata: Record<string, unknown>;
  }): NearbyResult {
    return {
      id: input.id,
      type: input.type,
      title: input.title,
      description: input.description,
      latitude: input.coordinates.latitude,
      longitude: input.coordinates.longitude,
      distanceKm: Number(input.distanceKm.toFixed(3)),
      distanceMetres: Math.round(input.distanceKm * 1_000),
      relevanceScore: this.ranking.calculate({
        distanceKm: input.distanceKm,
        radiusKm: input.radiusKm,
        verified: input.verified,
        popularity: input.popularity,
        freshness: input.freshness,
        startsAt: input.startsAt,
      }),
      verified: input.verified,
      communityId: input.communityId,
      ownerId: input.ownerId,
      category: input.category,
      postcode: input.postcode,
      imageUrl: input.imageUrl,
      pricePence: input.pricePence,
      isFree: input.isFree,
      startsAt: input.startsAt?.toISOString() ?? null,
      endsAt: input.endsAt?.toISOString() ?? null,
      createdAt: input.createdAt.toISOString(),
      metadata: input.metadata,
    };
  }

  private coordinates(
    latitude: { toString(): string } | number | null,
    longitude: { toString(): string } | number | null,
  ): NearbyCoordinates | null {
    if (latitude === null || longitude === null) {
      return null;
    }

    const parsedLatitude = Number(latitude);

    const parsedLongitude = Number(longitude);

    if (!Number.isFinite(parsedLatitude) || !Number.isFinite(parsedLongitude)) {
      return null;
    }

    return {
      latitude: parsedLatitude,
      longitude: parsedLongitude,
    };
  }

  private freshness(date: Date): number {
    const ageHours = (Date.now() - date.getTime()) / 3_600_000;

    if (ageHours <= 24) {
      return 100;
    }

    if (ageHours <= 72) {
      return 80;
    }

    if (ageHours <= 168) {
      return 60;
    }

    if (ageHours <= 720) {
      return 35;
    }

    return 10;
  }
}
