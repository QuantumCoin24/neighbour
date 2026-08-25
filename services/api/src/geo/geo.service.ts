import { Injectable } from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import type { NearbyQueryDto } from './dto/nearby-query.dto';
import type {
  GeoEntityType,
  GeoPoint,
  NearbyGeoItem,
  NearbyGeoResponse,
} from './interfaces/geo.interface';
import { calculateDistanceKm, createGeoBounds } from './utils/geo-distance';
import type { PostalLocationResult } from './postal-geocoder.provider';
import { ZippopotamPostalGeocoderProvider } from './postal-geocoder.provider';

const DEFAULT_TYPES: GeoEntityType[] = ['NEIGHBOURHOOD', 'COMMUNITY', 'EVENT', 'BUSINESS'];

interface LocatedRecord {
  id: string;
  latitude: unknown;
  longitude: unknown;
  locationAccuracyM: number | null;
  locationVisibility: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postcode: string | null;
}

function decimalToNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    'toNumber' in value &&
    typeof value.toNumber === 'function'
  ) {
    return value.toNumber();
  }

  return Number(value);
}

@Injectable()
export class GeoService {
  private readonly postalGeocoder = new ZippopotamPostalGeocoderProvider();

  constructor(private readonly database: DatabaseService) {}

  resolvePostalLocation(countryCode: string, postalCode: string): Promise<PostalLocationResult> {
    return this.postalGeocoder.resolve(countryCode, postalCode);
  }

  async findNearby(query: NearbyQueryDto): Promise<NearbyGeoResponse> {
    const origin: GeoPoint = {
      latitude: query.latitude,
      longitude: query.longitude,
    };

    const bounds = createGeoBounds(origin, query.radiusKm);

    const selectedTypes = query.types?.length ? query.types : DEFAULT_TYPES;

    const tasks: Promise<NearbyGeoItem[]>[] = [];

    if (selectedTypes.includes('NEIGHBOURHOOD')) {
      tasks.push(this.findNeighbourhoods(origin, bounds, query.radiusKm));
    }

    if (selectedTypes.includes('COMMUNITY')) {
      tasks.push(this.findCommunities(origin, bounds, query.radiusKm));
    }

    if (selectedTypes.includes('EVENT')) {
      tasks.push(this.findEvents(origin, bounds, query.radiusKm));
    }

    if (selectedTypes.includes('BUSINESS')) {
      tasks.push(this.findBusinesses(origin, bounds, query.radiusKm));
    }

    const groups = await Promise.all(tasks);

    const items = groups
      .flat()
      .sort((left, right) => left.distanceKm - right.distanceKm)
      .slice(0, query.limit);

    return {
      origin,
      radiusKm: query.radiusKm,
      count: items.length,
      items,
    };
  }

  private locationWhere(bounds: { north: number; south: number; east: number; west: number }) {
    return {
      latitude: {
        not: null,
        gte: bounds.south,
        lte: bounds.north,
      },
      longitude: {
        not: null,
        gte: bounds.west,
        lte: bounds.east,
      },
      locationVisibility: 'PUBLIC' as const,
    };
  }

  private createItem(
    origin: GeoPoint,
    radiusKm: number,
    record: LocatedRecord,
    details: {
      type: GeoEntityType;
      title: string;
      description: string | null;
      metadata: Record<string, string | number | boolean | null>;
    },
  ): NearbyGeoItem | null {
    const latitude = decimalToNumber(record.latitude);
    const longitude = decimalToNumber(record.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    const distanceKm = calculateDistanceKm(origin, {
      latitude,
      longitude,
    });

    if (distanceKm > radiusKm) {
      return null;
    }

    return {
      id: record.id,
      type: details.type,
      title: details.title,
      description: details.description,
      latitude,
      longitude,
      distanceKm,
      locationAccuracyM: record.locationAccuracyM,
      visibility: record.locationVisibility as NearbyGeoItem['visibility'],
      address: {
        addressLine1: record.addressLine1,
        addressLine2: record.addressLine2,
        city: record.city,
        postcode: record.postcode,
      },
      metadata: details.metadata,
    };
  }

  private async findNeighbourhoods(
    origin: GeoPoint,
    bounds: ReturnType<typeof createGeoBounds>,
    radiusKm: number,
  ): Promise<NearbyGeoItem[]> {
    const records = await this.database.neighbourhood.findMany({
      where: this.locationWhere(bounds),
      select: {
        id: true,
        name: true,
        description: true,
        localArea: true,
        latitude: true,
        longitude: true,
        locationAccuracyM: true,
        locationVisibility: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        postcode: true,
      },
    });

    return records
      .map((record) =>
        this.createItem(origin, radiusKm, record, {
          type: 'NEIGHBOURHOOD',
          title: record.name,
          description: record.description,
          metadata: {
            localArea: record.localArea,
          },
        }),
      )
      .filter((item): item is NearbyGeoItem => item !== null);
  }

  private async findCommunities(
    origin: GeoPoint,
    bounds: ReturnType<typeof createGeoBounds>,
    radiusKm: number,
  ): Promise<NearbyGeoItem[]> {
    const records = await this.database.community.findMany({
      where: {
        ...this.locationWhere(bounds),
        visibility: 'PUBLIC',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        latitude: true,
        longitude: true,
        locationAccuracyM: true,
        locationVisibility: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        postcode: true,
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    });

    return records
      .map((record) =>
        this.createItem(origin, radiusKm, record, {
          type: 'COMMUNITY',
          title: record.name,
          description: record.description,
          metadata: {
            slug: record.slug,
            memberCount: record._count.memberships,
          },
        }),
      )
      .filter((item): item is NearbyGeoItem => item !== null);
  }

  private async findEvents(
    origin: GeoPoint,
    bounds: ReturnType<typeof createGeoBounds>,
    radiusKm: number,
  ): Promise<NearbyGeoItem[]> {
    const records = await this.database.event.findMany({
      where: {
        ...this.locationWhere(bounds),
        endsAt: {
          gte: new Date(),
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        startsAt: true,
        endsAt: true,
        communityId: true,
        latitude: true,
        longitude: true,
        locationAccuracyM: true,
        locationVisibility: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        postcode: true,
        community: {
          select: {
            name: true,
          },
        },
      },
    });

    return records
      .map((record) =>
        this.createItem(origin, radiusKm, record, {
          type: 'EVENT',
          title: record.title,
          description: record.description,
          metadata: {
            communityId: record.communityId,
            communityName: record.community.name,
            startsAt: record.startsAt.toISOString(),
            endsAt: record.endsAt.toISOString(),
          },
        }),
      )
      .filter((item): item is NearbyGeoItem => item !== null);
  }

  private async findBusinesses(
    origin: GeoPoint,
    bounds: ReturnType<typeof createGeoBounds>,
    radiusKm: number,
  ): Promise<NearbyGeoItem[]> {
    const records = await this.database.business.findMany({
      where: this.locationWhere(bounds),
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        verified: true,
        communityId: true,
        latitude: true,
        longitude: true,
        locationAccuracyM: true,
        locationVisibility: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        postcode: true,
      },
    });

    return records
      .map((record) =>
        this.createItem(origin, radiusKm, record, {
          type: 'BUSINESS',
          title: record.name,
          description: record.description,
          metadata: {
            category: record.category,
            verified: record.verified,
            communityId: record.communityId,
          },
        }),
      )
      .filter((item): item is NearbyGeoItem => item !== null);
  }
}
