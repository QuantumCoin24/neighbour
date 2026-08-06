import { Injectable } from '@nestjs/common';

import type { NearbyCoordinates } from '../interfaces/nearby-response.interface';

const EARTH_RADIUS_KM = 6_371;

@Injectable()
export class NearbyDistanceService {
  calculateKilometres(origin: NearbyCoordinates, target: NearbyCoordinates): number {
    const latitudeDelta = this.toRadians(target.latitude - origin.latitude);

    const longitudeDelta = this.toRadians(target.longitude - origin.longitude);

    const originLatitude = this.toRadians(origin.latitude);

    const targetLatitude = this.toRadians(target.latitude);

    const haversine =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(originLatitude) * Math.cos(targetLatitude) * Math.sin(longitudeDelta / 2) ** 2;

    const angularDistance = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

    return EARTH_RADIUS_KM * angularDistance;
  }

  calculateMetres(origin: NearbyCoordinates, target: NearbyCoordinates): number {
    return Math.round(this.calculateKilometres(origin, target) * 1_000);
  }

  isWithinRadius(origin: NearbyCoordinates, target: NearbyCoordinates, radiusKm: number): boolean {
    return this.calculateKilometres(origin, target) <= radiusKm;
  }

  boundingBox(
    origin: NearbyCoordinates,
    radiusKm: number,
  ): {
    minimumLatitude: number;
    maximumLatitude: number;
    minimumLongitude: number;
    maximumLongitude: number;
  } {
    const latitudeDelta = radiusKm / 111.32;

    const longitudeScale = Math.max(Math.cos(this.toRadians(origin.latitude)), 0.01);

    const longitudeDelta = radiusKm / (111.32 * longitudeScale);

    return {
      minimumLatitude: origin.latitude - latitudeDelta,
      maximumLatitude: origin.latitude + latitudeDelta,
      minimumLongitude: origin.longitude - longitudeDelta,
      maximumLongitude: origin.longitude + longitudeDelta,
    };
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
