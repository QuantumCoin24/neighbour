import { normalizePostalInput } from './utils/postal-location';

export interface PostalLocationResult {
  resolved: boolean;
  countryCode: string;
  postalCode: string;
  country: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface PostalGeocoderProvider {
  resolve(countryCode: string, postalCode: string): Promise<PostalLocationResult>;
}

interface ZippopotamPlace {
  'place name'?: string;
  state?: string;
  latitude?: string;
  longitude?: string;
}

interface ZippopotamResponse {
  country?: string;
  'country abbreviation'?: string;
  'post code'?: string;
  places?: ZippopotamPlace[];
}

/*
 * Provider implementation is isolated behind PostalGeocoderProvider.
 * It can therefore be replaced later without changing controllers,
 * mobile or web clients.
 *
 * Zippopotam.us is used only for postal resolution. Failure or an
 * unsupported postal system returns resolved:false; Neighbour never
 * invents coordinates.
 */
export class ZippopotamPostalGeocoderProvider implements PostalGeocoderProvider {
  async resolve(countryCode: string, postalCode: string): Promise<PostalLocationResult> {
    const normalized = normalizePostalInput(countryCode, postalCode);

    const unresolved = (): PostalLocationResult => ({
      resolved: false,
      countryCode: normalized.countryCode,
      postalCode: normalized.postalCode,
      country: null,
      city: null,
      region: null,
      latitude: null,
      longitude: null,
    });

    const endpoint =
      `https://api.zippopotam.us/` +
      `${encodeURIComponent(normalized.countryCode)}/` +
      `${encodeURIComponent(normalized.postalCode)}`;

    try {
      const response = await fetch(endpoint, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Neighbour/1.0 postal-location-resolver',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (!response.ok) {
        return unresolved();
      }

      const data = (await response.json()) as ZippopotamResponse;
      const place = data.places?.[0];

      if (!place) {
        return unresolved();
      }

      const latitude = Number(place.latitude);
      const longitude = Number(place.longitude);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        return unresolved();
      }

      return {
        resolved: true,
        countryCode: (data['country abbreviation'] || normalized.countryCode).toUpperCase(),
        postalCode: data['post code']
          ? normalizePostalInput(
              data['country abbreviation'] || normalized.countryCode,
              data['post code'],
            ).postalCode
          : normalized.postalCode,
        country: data.country ?? null,
        city: place['place name'] ?? null,
        region: place.state ?? null,
        latitude,
        longitude,
      };
    } catch {
      return unresolved();
    }
  }
}
