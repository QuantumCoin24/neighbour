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

interface PostcodesIoResult {
  postcode?: string;
  country?: string;
  region?: string | null;
  admin_district?: string | null;
  parish?: string | null;
  latitude?: number;
  longitude?: number;
}

interface PostcodesIoResponse {
  status?: number;
  result?: PostcodesIoResult | null;
}

function unresolved(countryCode: string, postalCode: string): PostalLocationResult {
  const normalized = normalizePostalInput(countryCode, postalCode);

  return {
    resolved: false,
    countryCode: normalized.countryCode === 'UK' ? 'GB' : normalized.countryCode,
    postalCode: normalized.postalCode,
    country: null,
    city: null,
    region: null,
    latitude: null,
    longitude: null,
  };
}

async function resolveUkPostcode(
  countryCode: string,
  postalCode: string,
): Promise<PostalLocationResult> {
  const normalized = normalizePostalInput(countryCode, postalCode);

  const endpoint =
    'https://api.postcodes.io/postcodes/' + encodeURIComponent(normalized.postalCode);

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Neighbour/1.0 postal-location-resolver',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return unresolved('GB', normalized.postalCode);
    }

    const data = (await response.json()) as PostcodesIoResponse;
    const result = data.result;

    if (
      !result ||
      typeof result.latitude !== 'number' ||
      typeof result.longitude !== 'number' ||
      !Number.isFinite(result.latitude) ||
      !Number.isFinite(result.longitude)
    ) {
      return unresolved('GB', normalized.postalCode);
    }

    /*
     * Prefer the administrative district as the human-readable local
     * area. Region remains the broader region/state-equivalent.
     */
    const city = result.admin_district?.trim() || result.parish?.trim() || null;

    return {
      resolved: true,
      countryCode: 'GB',
      postalCode: result.postcode
        ? normalizePostalInput('GB', result.postcode).postalCode
        : normalized.postalCode,
      country: result.country ?? 'United Kingdom',
      city,
      region: result.region ?? null,
      latitude: result.latitude,
      longitude: result.longitude,
    };
  } catch {
    return unresolved('GB', normalized.postalCode);
  }
}

async function resolveZippopotam(
  countryCode: string,
  postalCode: string,
): Promise<PostalLocationResult> {
  const normalized = normalizePostalInput(countryCode, postalCode);

  const endpoint =
    'https://api.zippopotam.us/' +
    `${encodeURIComponent(normalized.countryCode)}/` +
    encodeURIComponent(normalized.postalCode);

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Neighbour/1.0 postal-location-resolver',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return unresolved(normalized.countryCode, normalized.postalCode);
    }

    const data = (await response.json()) as ZippopotamResponse;
    const place = data.places?.[0];

    if (!place) {
      return unresolved(normalized.countryCode, normalized.postalCode);
    }

    const latitude = Number(place.latitude);
    const longitude = Number(place.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return unresolved(normalized.countryCode, normalized.postalCode);
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
    return unresolved(normalized.countryCode, normalized.postalCode);
  }
}

/*
 * Neighbour routes UK postcodes through Postcodes.io because it
 * resolves complete UK postcodes and supplies authoritative
 * coordinates/admin geography.
 *
 * Other countries retain the existing Zippopotam resolver.
 *
 * The public /geo/postal/resolve contract remains unchanged.
 */
export class ZippopotamPostalGeocoderProvider implements PostalGeocoderProvider {
  async resolve(countryCode: string, postalCode: string): Promise<PostalLocationResult> {
    const normalized = normalizePostalInput(countryCode, postalCode);

    if (normalized.countryCode === 'GB' || normalized.countryCode === 'UK') {
      return resolveUkPostcode(normalized.countryCode, normalized.postalCode);
    }

    return resolveZippopotam(normalized.countryCode, normalized.postalCode);
  }
}
