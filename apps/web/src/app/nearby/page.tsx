'use client';

import {
  getNearbyGeoItems,
  type GeoEntityType,
  type GeoPoint,
  type NearbyGeoItem,
} from '@neighbour/api-client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const MANCHESTER: GeoPoint = {
  latitude: 53.4808,
  longitude: -2.2426,
};

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
  return [
    item.address.addressLine1,
    item.address.city,
    item.address.postcode,
  ]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(', ');
}

function presentation(type: GeoEntityType) {
  return FILTERS.find((filter) => filter.type === type) ?? FILTERS[0];
}

export default function NearbyPage() {
  const sequence = useRef(0);

  const [origin, setOrigin] = useState<GeoPoint>(MANCHESTER);
  const [items, setItems] = useState<NearbyGeoItem[]>([]);
  const [types, setTypes] = useState<GeoEntityType[]>(ALL_TYPES);
  const [radiusKm, setRadiusKm] = useState(10);
  const [mode, setMode] = useState<Mode>('map');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fallback, setFallback] = useState(true);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (
      point: GeoPoint = origin,
      radius = radiusKm,
      selectedTypes = types,
    ) => {
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
          current && response.items.some((item) => item.id === current)
            ? current
            : null,
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
    void load(MANCHESTER, 10, ALL_TYPES);
    // Initial parity load intentionally uses the Manchester launch area.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(
        'Location is not available in this browser. Neighbour Maps will continue using the Manchester launch area.',
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
        setFallback(false);
        setLocating(false);
        setSelectedId(null);

        void load(point, radiusKm, types);
      },
      () => {
        setFallback(true);
        setLocating(false);
        setError(
          'Your current location could not be determined. Neighbour Maps will continue using the Manchester launch area.',
        );
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    );
  }, [load, radiusKm, types]);

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

  const filtered = useMemo(
    () => items.filter((item) => types.includes(item.type)),
    [items, types],
  );

  const selected =
    filtered.find((item) => item.id === selectedId) ?? null;

  const toggleType = (type: GeoEntityType) => {
    const next = types.includes(type)
      ? types.filter((item) => item !== type)
      : [...types, type];

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

  const markerPosition = (item: NearbyGeoItem) => {
    const radius = Math.max(radiusKm, 2);

    const latitudeScale = radius / 111;
    const longitudeScale =
      radius /
      (111 * Math.max(Math.cos((origin.latitude * Math.PI) / 180), 0.25));

    const x =
      50 + ((item.longitude - origin.longitude) / longitudeScale) * 43;
    const y =
      50 - ((item.latitude - origin.latitude) / latitudeScale) * 43;

    return {
      left: `${Math.max(4, Math.min(96, x))}%`,
      top: `${Math.max(5, Math.min(95, y))}%`,
    };
  };

  return (
    <main className="nearby-page">
      <section className="nearby-hero">
        <div>
          <div className="eyebrow">NEIGHBOUR MAPS™</div>
          <h1>Explore nearby</h1>
          <p>
            Discover communities, events and local places around you.
          </p>
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

      {fallback ? (
        <section className="location-card">
          <div>
            <strong>Manchester launch area</strong>
            <p>
              Nearby results are using the Manchester launch area until
              you choose to share your location.
            </p>
          </div>

          <button
            disabled={locating}
            onClick={requestLocation}
            type="button"
          >
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

          <button
            onClick={() => void load()}
            type="button"
          >
            Retry
          </button>
        </section>
      ) : null}

      {mode === 'map' ? (
        <section className="map-shell">
          {loading ? (
            <div className="loading">
              <div className="spinner" />
              <strong>Finding nearby places…</strong>
            </div>
          ) : (
            <>
              <div className="map-grid" />

              <div
                className="origin-marker"
                title={fallback ? 'Manchester launch area' : 'Your location'}
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
      ) : (
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
                Location-enabled communities, events and businesses
                within this radius will appear here as records are added.
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
                    className={
                      selectedId === item.id
                        ? 'place-card selected'
                        : 'place-card'
                    }
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
                        <span className="description">
                          {item.description}
                        </span>
                      ) : null}

                      {address ? (
                        <span className="address">{address}</span>
                      ) : null}
                    </span>

                    <span className="chevron">›</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {selected ? (
        <aside className="selection">
          <button
            className="selection-main"
            onClick={() => setSelectedId(null)}
            type="button"
          >
            <span className="place-icon">
              {presentation(selected.type).symbol}
            </span>

            <span className="place-copy">
              <span className="place-heading">
                <strong>{selected.title}</strong>
                <em>{selected.distanceKm.toFixed(1)} km</em>
              </span>

              <span className="type-label">
                {presentation(selected.type).label}
              </span>

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
            radial-gradient(circle at 85% 20%, rgba(255,255,255,.12), transparent 30%),
            linear-gradient(135deg, #063f2a, #08714a);
          box-shadow: 0 22px 50px rgba(6,63,42,.18);
        }

        .eyebrow {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .16em;
          opacity: .72;
        }

        h1 {
          margin: 7px 0 6px;
          font-size: clamp(32px, 5vw, 52px);
          letter-spacing: -.045em;
        }

        .nearby-hero p {
          margin: 0;
          max-width: 620px;
          color: rgba(255,255,255,.78);
          font-size: 16px;
        }

        .mode-control {
          display: flex;
          flex: 0 0 auto;
          padding: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,.12);
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
          background: rgba(0,0,0,.06);
          font-size: 11px;
        }

        .filter.active .count {
          background: rgba(255,255,255,.18);
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
            radial-gradient(circle at 25% 25%, rgba(8,113,74,.10), transparent 22%),
            radial-gradient(circle at 72% 65%, rgba(30,120,180,.08), transparent 25%),
            #edf4ef;
          box-shadow: 0 18px 50px rgba(20,55,37,.09);
        }

        .map-grid {
          position: absolute;
          inset: 0;
          opacity: .48;
          background-image:
            linear-gradient(rgba(255,255,255,.95) 2px, transparent 2px),
            linear-gradient(90deg, rgba(255,255,255,.95) 2px, transparent 2px),
            linear-gradient(rgba(6,63,42,.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,63,42,.08) 1px, transparent 1px);
          background-size:
            160px 160px,
            160px 160px,
            40px 40px,
            40px 40px;
          transform: rotate(-7deg) scale(1.15);
        }

        .origin-marker {
          position: absolute;
          z-index: 4;
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
          box-shadow: 0 4px 14px rgba(0,0,0,.25);
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
          box-shadow: 0 7px 18px rgba(0,0,0,.20);
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
          box-shadow: 0 8px 24px rgba(6,63,42,.35);
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
          border: 1px solid rgba(255,255,255,.8);
          border-radius: 16px;
          background: rgba(255,255,255,.92);
          box-shadow: 0 8px 25px rgba(0,0,0,.10);
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
          background: rgba(255,255,255,.94);
          color: #08714a;
          box-shadow: 0 8px 25px rgba(0,0,0,.12);
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
          animation: spin .75s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
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
          box-shadow: 0 9px 24px rgba(6,63,42,.07);
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
          background: rgba(255,255,255,.97);
          box-shadow: 0 20px 60px rgba(0,0,0,.18);
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
