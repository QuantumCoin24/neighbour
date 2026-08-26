'use client';

import Link from 'next/link';

import {
  getMyProfile,
  getNearbyGeoItems,
  resolvePostalLocation,
  type GeoEntityType,
  type GeoPoint,
  type NearbyGeoItem,
} from '@neighbour/api-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const RADII = [2, 5, 10, 25, 50];

const FILTERS: Array<{
  type: GeoEntityType;
  label: string;
  symbol: string;
}> = [
  { type: 'NEIGHBOURHOOD', label: 'Areas', symbol: '⌖' },
  { type: 'COMMUNITY', label: 'Communities', symbol: '◎' },
  { type: 'EVENT', label: 'Events', symbol: '◇' },
  { type: 'BUSINESS', label: 'Businesses', symbol: '▣' },
];

const ALL_TYPES = FILTERS.map((item) => item.type);

type Mode = 'map' | 'list';

function addressFor(item: NearbyGeoItem) {
  return [item.address.addressLine1, item.address.city, item.address.postcode]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(', ');
}

function presentation(type: GeoEntityType) {
  return FILTERS.find((filter) => filter.type === type) ?? FILTERS[0];
}

const TILE_SIZE = 256;

function mapZoomForRadius(radiusKm: number) {
  if (radiusKm <= 2) return 14;
  if (radiusKm <= 5) return 13;
  if (radiusKm <= 10) return 12;
  if (radiusKm <= 25) return 11;
  return 10;
}

function worldPixel(latitude: number, longitude: number, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLatitude = Math.sin((latitude * Math.PI) / 180);
  const bounded = Math.min(Math.max(sinLatitude, -0.9999), 0.9999);

  return {
    x: ((longitude + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + bounded) / (1 - bounded)) / (4 * Math.PI)) * scale,
  };
}

function osmTiles(origin: GeoPoint, radiusKm: number) {
  const zoom = mapZoomForRadius(radiusKm);
  const centre = worldPixel(origin.latitude, origin.longitude, zoom);

  const centreTileX = Math.floor(centre.x / TILE_SIZE);
  const centreTileY = Math.floor(centre.y / TILE_SIZE);

  const tiles = [];

  // 7 × 7 tiles gives enough coverage at every supported radius
  // while remaining lightweight.
  for (let dy = -3; dy <= 3; dy += 1) {
    for (let dx = -3; dx <= 3; dx += 1) {
      const x = centreTileX + dx;
      const y = centreTileY + dy;

      tiles.push({
        key: `${zoom}-${x}-${y}`,
        x,
        y,
        zoom,
        left: x * TILE_SIZE - centre.x + 50 * TILE_SIZE,
        top: y * TILE_SIZE - centre.y + 50 * TILE_SIZE,
      });
    }
  }

  return {
    zoom,
    centre,
    tiles,
  };
}

export default function NearbyPage() {
  const sequence = useRef(0);

  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [items, setItems] = useState<NearbyGeoItem[]>([]);
  const [types, setTypes] = useState<GeoEntityType[]>(ALL_TYPES);
  const [radiusKm, setRadiusKm] = useState(10);
  const [mode, setMode] = useState<Mode>('map');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locationSource, setLocationSource] = useState<'device' | 'profile' | 'none'>('none');
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (point: GeoPoint | null = origin, radius = radiusKm, selectedTypes = types) => {
      if (!point) {
        setItems([]);
        setLoading(false);
        return;
      }

      const requestId = ++sequence.current;

      setLoading(true);
      setError(null);

      try {
        const response = await getNearbyGeoItems({
          ...point,
          radiusKm: radius,
          types: selectedTypes,
          limit: 200,
        });

        if (requestId !== sequence.current) return;

        setItems(response.items);

        setSelectedId((current) =>
          current && response.items.some((item) => item.id === current) ? current : null,
        );
      } catch {
        if (requestId === sequence.current) {
          setError(
            'Nearby places could not be loaded. Check that the API and database are available.',
          );
        }
      } finally {
        if (requestId === sequence.current) {
          setLoading(false);
        }
      }
    },
    [origin, radiusKm, types],
  );

  useEffect(() => {
    async function resolveSavedLocation() {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setLocationSource('none');
        setLoading(false);
        return;
      }

      try {
        const profile = await getMyProfile(token);

        let point: GeoPoint | null =
          typeof profile.latitude === 'number' && typeof profile.longitude === 'number'
            ? {
                latitude: profile.latitude,
                longitude: profile.longitude,
              }
            : null;

        if (!point && profile.postalCode?.trim()) {
          const postal = await resolvePostalLocation({
            countryCode: profile.countryCode?.trim() || 'GB',
            postalCode: profile.postalCode.trim(),
          });

          if (
            postal.resolved &&
            typeof postal.latitude === 'number' &&
            typeof postal.longitude === 'number'
          ) {
            point = {
              latitude: postal.latitude,
              longitude: postal.longitude,
            };
          }
        }

        if (!point) {
          setLocationSource('none');
          setLoading(false);
          return;
        }

        setOrigin(point);
        setLocationSource('profile');
        await load(point, 10, ALL_TYPES);
      } catch {
        setLocationSource('none');
        setLoading(false);
      }
    }

    void resolveSavedLocation();
    // Initial Nearby resolution is scoped to the signed-in user's saved location.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(
        'Location is not available in this browser. Add a postcode to your profile or use a device with location access.',
      );
      return;
    }

    setLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setOrigin(point);
        setLocationSource('device');
        setLocating(false);
        setSelectedId(null);

        void load(point, radiusKm, types);
      },
      () => {
        setLocating(false);
        setError(
          locationSource === 'profile'
            ? 'Your current location could not be determined. Your saved profile location is still being used.'
            : 'Your current location could not be determined. Add a postcode to your profile or try again.',
        );
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    );
  }, [load, locationSource, radiusKm, types]);

  const counts = useMemo(() => {
    const result: Record<GeoEntityType, number> = {
      NEIGHBOURHOOD: 0,
      COMMUNITY: 0,
      EVENT: 0,
      BUSINESS: 0,
    };

    items.forEach((item) => {
      result[item.type] += 1;
    });

    return result;
  }, [items]);

  const filtered = useMemo(() => items.filter((item) => types.includes(item.type)), [items, types]);

  const selected = filtered.find((item) => item.id === selectedId) ?? null;

  const toggleType = (type: GeoEntityType) => {
    const next = types.includes(type) ? types.filter((item) => item !== type) : [...types, type];

    const safeNext = next.length ? next : [type];

    setTypes(safeNext);
    setSelectedId(null);

    void load(origin, radiusKm, safeNext);
  };

  const changeRadius = (radius: number) => {
    setRadiusKm(radius);
    setSelectedId(null);
    void load(origin, radius, types);
  };

  const mapData = useMemo(() => (origin ? osmTiles(origin, radiusKm) : null), [origin, radiusKm]);

  const markerPosition = (item: NearbyGeoItem) => {
    if (!mapData) {
      return {
        left: '50%',
        top: '50%',
      };
    }

    const point = worldPixel(item.latitude, item.longitude, mapData.zoom);

    const deltaX = point.x - mapData.centre.x;
    const deltaY = point.y - mapData.centre.y;

    return {
      left: `calc(50% + ${deltaX}px)`,
      top: `calc(50% + ${deltaY}px)`,
    };
  };

  return (
    <main className="nearby-page">
      <section className="nearby-hero">
        <div>
          <div className="eyebrow">NEIGHBOUR MAPS™</div>
          <h1>Explore nearby</h1>
          <p>Discover communities, events and local places around you.</p>
        </div>

        <div className="mode-control">
          {(['map', 'list'] as const).map((value) => (
            <button
              key={value}
              className={mode === value ? 'mode active' : 'mode'}
              onClick={() => setMode(value)}
              type="button"
            >
              {value === 'map' ? 'Map' : 'List'}
            </button>
          ))}
        </div>
      </section>

      <Link href="/search" className="nearby-search">
        <span className="nearby-search-icon">⌕</span>

        <span className="nearby-search-copy">
          <strong>Search Neighbour</strong>
          <small>Find people, communities, events and local activity.</small>
        </span>

        <span className="nearby-search-arrow">›</span>
      </Link>

      <section className="controls">
        <div className="filter-row">
          {FILTERS.map((filter) => {
            const active = types.includes(filter.type);

            return (
              <button
                key={filter.type}
                className={active ? 'filter active' : 'filter'}
                onClick={() => toggleType(filter.type)}
                type="button"
              >
                <span>{filter.symbol}</span>
                <strong>{filter.label}</strong>
                <span className="count">{counts[filter.type]}</span>
              </button>
            );
          })}
        </div>

        <div className="radius-row">
          {RADII.map((radius) => (
            <button
              key={radius}
              className={radiusKm === radius ? 'radius active' : 'radius'}
              onClick={() => changeRadius(radius)}
              type="button"
            >
              {radius} km
            </button>
          ))}
        </div>
      </section>

      {locationSource === 'profile' ? (
        <section className="location-card">
          <div>
            <strong>Using your saved location</strong>
            <p>
              Nearby is based on your profile location. Use your current location for live results.
            </p>
          </div>

          <button disabled={locating} onClick={requestLocation} type="button">
            {locating ? 'Locating…' : 'Use my location'}
          </button>
        </section>
      ) : locationSource === 'none' ? (
        <section className="location-card">
          <div>
            <strong>Location not set</strong>
            <p>Enable location or add a postcode to your profile to discover what is nearby.</p>
          </div>

          <button disabled={locating} onClick={requestLocation} type="button">
            {locating ? 'Locating…' : 'Use my location'}
          </button>
        </section>
      ) : null}

      {error ? (
        <section className="error-card">
          <div>
            <strong>Nearby is reconnecting</strong>
            <p>{error}</p>
          </div>

          <button onClick={() => void load()} type="button">
            Retry
          </button>
        </section>
      ) : null}

      {mode === 'map' && origin && mapData ? (
        <section className="map-shell">
          {loading ? (
            <div className="loading">
              <div className="spinner" />
              <strong>Finding nearby places…</strong>
            </div>
          ) : (
            <>
              <div className="osm-map" aria-label="OpenStreetMap">
                <div className="osm-tiles">
                  {mapData.tiles.map((tile) => (
                    <img
                      key={tile.key}
                      alt=""
                      draggable={false}
                      src={`https://tile.openstreetmap.org/${tile.zoom}/${tile.x}/${tile.y}.png`}
                      style={{
                        left: `calc(50% + ${tile.left - 50 * TILE_SIZE}px)`,
                        top: `calc(50% + ${tile.top - 50 * TILE_SIZE}px)`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <a
                className="osm-attribution"
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noreferrer"
              >
                © OpenStreetMap contributors
              </a>

              <div
                className="origin-marker"
                title={
                  locationSource === 'device' ? 'Your current location' : 'Your saved location'
                }
              >
                ⌖
              </div>

              {filtered.map((item) => {
                const meta = presentation(item.type);
                const position = markerPosition(item);

                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    className={
                      selectedId === item.id
                        ? `marker marker-${item.type.toLowerCase()} selected`
                        : `marker marker-${item.type.toLowerCase()}`
                    }
                    onClick={() => setSelectedId(item.id)}
                    style={position}
                    title={`${item.title} — ${item.distanceKm.toFixed(1)} km`}
                    type="button"
                  >
                    {meta.symbol}
                  </button>
                );
              })}

              <div className="map-caption">
                <strong>{filtered.length} nearby places</strong>
                <span>within {radiusKm} km</span>
              </div>

              <button
                className="recenter"
                disabled={locating}
                onClick={requestLocation}
                title="Recenter using my location"
                type="button"
              >
                ⌖
              </button>
            </>
          )}
        </section>
      ) : mode === 'list' && origin ? (
        <section className="list-shell">
          <div className="list-summary">
            <strong>{filtered.length} nearby places</strong>
            <span>Within {radiusKm} km</span>
          </div>

          {loading ? (
            <div className="loading list-loading">
              <div className="spinner" />
              <strong>Finding nearby places…</strong>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <strong>No nearby places yet</strong>
              <p>
                Location-enabled communities, events and businesses within this radius will appear
                here as records are added.
              </p>
            </div>
          ) : (
            <div className="cards">
              {filtered.map((item) => {
                const meta = presentation(item.type);
                const address = addressFor(item);

                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    className={selectedId === item.id ? 'place-card selected' : 'place-card'}
                    onClick={() => setSelectedId(item.id)}
                    type="button"
                  >
                    <span className="place-icon">{meta.symbol}</span>

                    <span className="place-copy">
                      <span className="place-heading">
                        <strong>{item.title}</strong>
                        <em>{item.distanceKm.toFixed(1)} km</em>
                      </span>

                      <span className="type-label">{meta.label}</span>

                      {item.description ? (
                        <span className="description">{item.description}</span>
                      ) : null}

                      {address ? <span className="address">{address}</span> : null}
                    </span>

                    <span className="chevron">›</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="empty">
          <strong>Set your location to explore Nearby</strong>
          <p>Neighbour will never assume a city for you.</p>
        </section>
      )}

      {selected ? (
        <aside className="selection">
          <button className="selection-main" onClick={() => setSelectedId(null)} type="button">
            <span className="place-icon">{presentation(selected.type).symbol}</span>

            <span className="place-copy">
              <span className="place-heading">
                <strong>{selected.title}</strong>
                <em>{selected.distanceKm.toFixed(1)} km</em>
              </span>

              <span className="type-label">{presentation(selected.type).label}</span>

              {addressFor(selected) ? (
                <span className="address">{addressFor(selected)}</span>
              ) : null}
            </span>
          </button>

          <div className="selection-actions">
            <button onClick={() => setSelectedId(null)} type="button">
              Close
            </button>

            {mode === 'list' ? (
              <button onClick={() => setMode('map')} type="button">
                Show on map
              </button>
            ) : null}
          </div>
        </aside>
      ) : null}

      <style jsx>{`
        .nearby-search {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 13px;
          margin: 18px 0 0;
          padding: 15px 17px;
          border: 1px solid #dce5e0;
          border-radius: 18px;
          background: #fff;
          color: inherit;
          text-decoration: none;
          box-shadow: 0 10px 30px rgba(18, 49, 36, 0.05);
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease;
        }

        .nearby-search:hover {
          transform: translateY(-1px);
          border-color: #a9cabb;
          box-shadow: 0 14px 34px rgba(18, 49, 36, 0.08);
        }

        .nearby-search-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: #eaf5ef;
          color: #08704a;
          font-size: 22px;
          font-weight: 800;
        }

        .nearby-search-copy {
          display: grid;
          gap: 3px;
        }

        .nearby-search-copy strong {
          color: #1c3329;
          font-size: 13px;
        }

        .nearby-search-copy small {
          color: #76847d;
          font-size: 10px;
          line-height: 1.4;
        }

        .nearby-search-arrow {
          color: #08704a;
          font-size: 26px;
          line-height: 1;
        }

        .nearby-page {
          max-width: 1180px;
          margin: 0 auto;
          padding: 30px;
          color: #10231a;
        }

        .nearby-hero {
          display: flex;
          justify-content: space-between;
          gap: 28px;
          align-items: flex-end;
          padding: 34px;
          border-radius: 28px;
          color: white;
          background:
            radial-gradient(circle at 85% 20%, rgba(255, 255, 255, 0.12), transparent 30%),
            linear-gradient(135deg, #063f2a, #08714a);
          box-shadow: 0 22px 50px rgba(6, 63, 42, 0.18);
        }

        .eyebrow {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.16em;
          opacity: 0.72;
        }

        h1 {
          margin: 7px 0 6px;
          font-size: clamp(32px, 5vw, 52px);
          letter-spacing: -0.045em;
        }

        .nearby-hero p {
          margin: 0;
          max-width: 620px;
          color: rgba(255, 255, 255, 0.78);
          font-size: 16px;
        }

        .mode-control {
          display: flex;
          flex: 0 0 auto;
          padding: 4px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
        }

        button {
          font: inherit;
        }

        .mode {
          border: 0;
          padding: 9px 18px;
          border-radius: 999px;
          background: transparent;
          color: white;
          cursor: pointer;
          font-weight: 800;
        }

        .mode.active {
          background: white;
          color: #063f2a;
        }

        .controls {
          padding: 20px 2px 15px;
        }

        .filter-row,
        .radius-row {
          display: flex;
          gap: 9px;
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .filter,
        .radius {
          white-space: nowrap;
          border: 1px solid #dce8e1;
          background: white;
          color: #31463b;
          border-radius: 999px;
          padding: 10px 13px;
          cursor: pointer;
        }

        .filter {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .filter.active {
          background: #08714a;
          border-color: #08714a;
          color: white;
        }

        .count {
          min-width: 22px;
          padding: 2px 6px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.06);
          font-size: 11px;
        }

        .filter.active .count {
          background: rgba(255, 255, 255, 0.18);
        }

        .radius {
          padding: 8px 13px;
          font-size: 13px;
        }

        .radius.active {
          border-color: #08714a;
          background: #e8f5ed;
          color: #086240;
          font-weight: 800;
        }

        .location-card,
        .error-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 16px;
          padding: 17px 19px;
          border: 1px solid #dce8e1;
          border-radius: 20px;
          background: #f7faf8;
        }

        .location-card p,
        .error-card p {
          margin: 4px 0 0;
          color: #64756c;
          font-size: 13px;
        }

        .location-card button,
        .error-card button {
          flex: 0 0 auto;
          border: 0;
          border-radius: 999px;
          padding: 10px 16px;
          background: #08714a;
          color: white;
          cursor: pointer;
          font-weight: 800;
        }

        .error-card {
          border-color: #ead8aa;
          background: #fffaf0;
        }

        .map-shell {
          position: relative;
          min-height: 570px;
          overflow: hidden;
          border: 1px solid #dce8e1;
          border-radius: 28px;
          background:
            radial-gradient(circle at 25% 25%, rgba(8, 113, 74, 0.1), transparent 22%),
            radial-gradient(circle at 72% 65%, rgba(30, 120, 180, 0.08), transparent 25%), #edf4ef;
          box-shadow: 0 18px 50px rgba(20, 55, 37, 0.09);
        }

        .osm-map {
          position: absolute;
          inset: 0;
          z-index: 1;
          overflow: hidden;
          background: #dce7df;
        }

        .osm-tiles {
          position: absolute;
          inset: 0;
        }

        .osm-tiles img {
          position: absolute;
          width: 256px;
          height: 256px;
          max-width: none;
          user-select: none;
          pointer-events: none;
        }

        .osm-attribution {
          position: absolute;
          right: 0;
          bottom: 0;
          z-index: 7;
          padding: 3px 7px;
          border-radius: 7px 0 0 0;
          background: rgba(255, 255, 255, 0.88);
          color: #526159;
          font-size: 10px;
          text-decoration: none;
        }

        .origin-marker {
          position: absolute;
          z-index: 5;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          display: grid;
          place-items: center;
          width: 24px;
          height: 24px;
          border: 4px solid white;
          border-radius: 50%;
          background: #1676d2;
          color: white;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
          font-size: 12px;
        }

        .marker {
          position: absolute;
          z-index: 3;
          transform: translate(-50%, -50%);
          width: 38px;
          height: 38px;
          border: 3px solid white;
          border-radius: 50% 50% 50% 8px;
          background: #08714a;
          color: white;
          box-shadow: 0 7px 18px rgba(0, 0, 0, 0.2);
          cursor: pointer;
          font-weight: 900;
        }

        .marker-event {
          background: #8055a7;
        }

        .marker-business {
          background: #c06d26;
        }

        .marker-neighbourhood {
          background: #397ca7;
        }

        .marker.selected {
          z-index: 8;
          transform: translate(-50%, -50%) scale(1.25);
          box-shadow: 0 8px 24px rgba(6, 63, 42, 0.35);
        }

        .map-caption {
          position: absolute;
          left: 18px;
          bottom: 18px;
          z-index: 5;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 12px 15px;
          border: 1px solid rgba(255, 255, 255, 0.8);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .map-caption span {
          color: #718078;
          font-size: 12px;
        }

        .recenter {
          position: absolute;
          right: 18px;
          bottom: 18px;
          z-index: 5;
          width: 48px;
          height: 48px;
          border: 1px solid #dce8e1;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.94);
          color: #08714a;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
          cursor: pointer;
          font-size: 20px;
          font-weight: 900;
        }

        .loading {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 13px;
          color: #627168;
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #dbe9e1;
          border-top-color: #08714a;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .list-shell {
          min-height: 400px;
        }

        .list-summary {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 3px 2px 14px;
        }

        .list-summary span {
          color: #718078;
          font-size: 13px;
        }

        .list-loading {
          position: relative;
          min-height: 260px;
        }

        .cards {
          display: grid;
          gap: 11px;
        }

        .place-card,
        .selection-main {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          text-align: left;
          border: 1px solid #e1eae5;
          border-radius: 20px;
          background: #f8faf9;
          padding: 15px;
          color: inherit;
          cursor: pointer;
        }

        .place-card:hover,
        .place-card.selected {
          border-color: #8bbda4;
          background: white;
          box-shadow: 0 9px 24px rgba(6, 63, 42, 0.07);
        }

        .place-icon {
          display: grid;
          place-items: center;
          flex: 0 0 48px;
          height: 48px;
          border-radius: 15px;
          background: #e8f5ed;
          color: #08714a;
          font-size: 21px;
          font-weight: 900;
        }

        .place-copy {
          min-width: 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .place-heading {
          display: flex;
          justify-content: space-between;
          gap: 14px;
        }

        .place-heading strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .place-heading em {
          flex: 0 0 auto;
          color: #08714a;
          font-size: 12px;
          font-style: normal;
          font-weight: 800;
        }

        .type-label,
        .description,
        .address {
          color: #718078;
          font-size: 12px;
        }

        .description {
          color: #4f6257;
        }

        .address {
          color: #89968f;
        }

        .chevron {
          color: #8c9992;
          font-size: 24px;
        }

        .empty {
          padding: 40px;
          border: 1px solid #e1eae5;
          border-radius: 22px;
          background: #f8faf9;
        }

        .empty p {
          color: #718078;
        }

        .selection {
          position: fixed;
          z-index: 50;
          right: 28px;
          bottom: 28px;
          width: min(430px, calc(100vw - 56px));
          padding: 10px;
          border: 1px solid #dce8e1;
          border-radius: 23px;
          background: rgba(255, 255, 255, 0.97);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
          backdrop-filter: blur(18px);
        }

        .selection-main {
          border: 0;
          background: transparent;
        }

        .selection-actions {
          display: flex;
          justify-content: space-between;
          padding: 3px 13px 7px;
        }

        .selection-actions button {
          border: 0;
          background: transparent;
          color: #08714a;
          cursor: pointer;
          font-weight: 800;
        }

        @media (max-width: 720px) {
          .nearby-page {
            padding: 16px;
          }

          .nearby-hero {
            align-items: flex-start;
            flex-direction: column;
            padding: 25px;
          }

          .map-shell {
            min-height: 520px;
          }

          .location-card,
          .error-card {
            align-items: flex-start;
            flex-direction: column;
          }

          .selection {
            left: 16px;
            right: 16px;
            bottom: 16px;
            width: auto;
          }
        }
      `}</style>
    </main>
  );
}
