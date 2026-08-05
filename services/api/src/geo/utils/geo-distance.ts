import type { GeoBounds, GeoPoint } from '../interfaces/geo.interface';

const EARTH_RADIUS_KM = 6_371;
const KM_PER_LATITUDE_DEGREE = 111.32;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function round(value: number, precision = 3): number {
  const multiplier = 10 ** precision;

  return Math.round(value * multiplier) / multiplier;
}

export function calculateDistanceKm(from: GeoPoint, to: GeoPoint): number {
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);

  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  const angularDistance = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return round(EARTH_RADIUS_KM * angularDistance);
}

export function createGeoBounds(origin: GeoPoint, radiusKm: number): GeoBounds {
  const latitudeDelta = radiusKm / KM_PER_LATITUDE_DEGREE;

  const longitudeScale = Math.max(Math.cos(toRadians(origin.latitude)), 0.01);

  const longitudeDelta = radiusKm / (KM_PER_LATITUDE_DEGREE * longitudeScale);

  return {
    north: origin.latitude + latitudeDelta,
    south: origin.latitude - latitudeDelta,
    east: origin.longitude + longitudeDelta,
    west: origin.longitude - longitudeDelta,
  };
}
