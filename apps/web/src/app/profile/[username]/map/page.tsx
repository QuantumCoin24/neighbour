'use client';

import {
  createMapDiscovery,
  deleteMapDiscovery,
  getMyMapDiscoveries,
  getMyProfile,
  getPublicProfile,
  getPublicProfileMapDiscoveries,
  updateMapDiscovery,
  createSecurityReport,
  type MapDiscovery,
  type MapDiscoveryCategory,
  type MapDiscoveryType,
  type MapDiscoveryVisibility,
  type PublicProfile,
} from '@neighbour/api-client';
import 'leaflet/dist/leaflet.css';
import type { LayerGroup, Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import Link from 'next/link';
import { use, useCallback, useEffect, useRef, useState } from 'react';

type DraftPoint = {
  latitude: number;
  longitude: number;
};

const CATEGORIES: Array<{ value: MapDiscoveryCategory; label: string }> = [
  { value: 'NATURE', label: 'Nature' },
  { value: 'WALK', label: 'Walk' },
  { value: 'ACTIVITY', label: 'Activity' },
  { value: 'VIEWPOINT', label: 'Viewpoint' },
  { value: 'LOCAL_HISTORY', label: 'Local history' },
  { value: 'ART_CULTURE', label: 'Art & culture' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'OTHER', label: 'Other' },
];

function discoverySymbol(category: MapDiscoveryCategory): string {
  switch (category) {
    case 'NATURE':
      return '✦';
    case 'WALK':
      return '↗';
    case 'ACTIVITY':
      return '◆';
    case 'VIEWPOINT':
      return '◉';
    case 'LOCAL_HISTORY':
      return '⌂';
    case 'ART_CULTURE':
      return '✺';
    case 'COMMUNITY':
      return '◎';
    default:
      return '•';
  }
}

function initialCentre(discoveries: MapDiscovery[]): [number, number] {
  const first = discoveries[0];
  if (first) return [first.latitude, first.longitude];
  return [53.4808, -2.2426];
}

export default function PersonalMapPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = use(params);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const draftMarkerRef = useRef<LeafletMarker | null>(null);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [discoveries, setDiscoveries] = useState<MapDiscovery[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [owner, setOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Loading personal map…');
  const [dropping, setDropping] = useState(false);
  const [draftPoint, setDraftPoint] = useState<DraftPoint | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MapDiscoveryCategory>('NATURE');
  const [type, setType] = useState<MapDiscoveryType>('LANDMARK');
  const [visibility, setVisibility] = useState<MapDiscoveryVisibility>('PRIVATE');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('Loading personal map…');

    try {
      const publicProfile = await getPublicProfile(username);
      setProfile(publicProfile);

      const token = localStorage.getItem('accessToken');
      let isOwner = false;

      if (token) {
        try {
          const mine = await getMyProfile(token);
          isOwner = mine.userId === publicProfile.userId;
        } catch {
          isOwner = false;
        }
      }

      setOwner(isOwner);

      const items =
        isOwner && token
          ? await getMyMapDiscoveries(token)
          : await getPublicProfileMapDiscoveries(username);

      const personal = items.filter((item) => item.scope === 'PERSONAL');
      setDiscoveries(personal);
      setSelectedId((current) =>
        current && personal.some((item) => item.id === current) ? current : null,
      );
    } catch {
      setMessage('This personal map could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading || !mapContainerRef.current || mapRef.current) return;

    let cancelled = false;

    void import('leaflet').then((L) => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: true,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        keyboard: true,
      }).setView(initialCentre(discoveries), discoveries.length ? 14 : 11);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      markerLayerRef.current = L.layerGroup().addTo(map);

      map.on('click', (event) => {
        setDropping((active) => {
          if (active) {
            setDraftPoint({
              latitude: event.latlng.lat,
              longitude: event.latlng.lng,
            });
          }
          return active;
        });
      });

      mapRef.current = map;

      window.setTimeout(() => {
        map.invalidateSize({ pan: false });
      }, 0);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerLayerRef.current = null;
      draftMarkerRef.current = null;
    };
  }, [loading]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markerLayerRef.current;
    if (!map || !layer) return;

    let cancelled = false;

    void import('leaflet').then((L) => {
      if (cancelled || mapRef.current !== map || markerLayerRef.current !== layer) return;

      layer.clearLayers();

      discoveries.forEach((item) => {
        const icon = L.divIcon({
          className: 'personal-map-marker-shell',
          html: `<span class="personal-map-marker" style="display:grid;place-items:center;width:38px;height:38px;border:3px solid #fff;border-radius:50%;background:#0e754d;color:#fff;box-shadow:0 6px 18px rgba(16,55,39,.28);font-size:16px;font-weight:900;">${discoverySymbol(item.category)}</span>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const marker = L.marker([item.latitude, item.longitude], { icon });

        marker.on('click', () => {
          setSelectedId(item.id);
        });

        marker.addTo(layer);
      });

      if (discoveries.length > 0) {
        const bounds = L.latLngBounds(
          discoveries.map((item) => [item.latitude, item.longitude] as [number, number]),
        );

        if (bounds.isValid()) {
          map.fitBounds(bounds.pad(0.2), { maxZoom: 15 });
        }
      }
    });

    return () => {
      cancelled = true;
    };
  }, [discoveries]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    let cancelled = false;

    void import('leaflet').then((L) => {
      if (cancelled || mapRef.current !== map) return;

      if (draftMarkerRef.current) {
        draftMarkerRef.current.remove();
        draftMarkerRef.current = null;
      }

      if (!draftPoint) return;

      const icon = L.divIcon({
        className: 'personal-map-draft-shell',
        html: '<span class="personal-map-draft" style="display:grid;place-items:center;width:42px;height:42px;border:3px solid #fff;border-radius:50%;background:#10251b;color:#fff;box-shadow:0 6px 18px rgba(16,55,39,.28);font-size:22px;font-weight:900;">+</span>',
        iconSize: [42, 42],
        iconAnchor: [21, 21],
      });

      draftMarkerRef.current = L.marker([draftPoint.latitude, draftPoint.longitude], {
        icon,
      }).addTo(map);
    });

    return () => {
      cancelled = true;
    };
  }, [draftPoint]);

  const selected = discoveries.find((item) => item.id === selectedId) ?? null;

  function beginDrop(): void {
    setDropping(true);
    setDraftPoint(null);
    setTitle('');
    setDescription('');
    setCategory('NATURE');
    setType('LANDMARK');
    setVisibility('PRIVATE');
    setExpiresAt('');
  }

  function cancelDrop(): void {
    setDropping(false);
    setDraftPoint(null);
  }

  async function saveDiscovery(): Promise<void> {
    const token = localStorage.getItem('accessToken');
    if (!token || !owner || !draftPoint || saving || !title.trim()) return;

    if ((type === 'MOMENT' || type === 'SEASONAL') && !expiresAt) {
      setMessage('Choose when this discovery should expire.');
      return;
    }

    try {
      setSaving(true);

      await createMapDiscovery(token, {
        scope: 'PERSONAL',
        type,
        category,
        title: title.trim(),
        description: description.trim(),
        latitude: draftPoint.latitude,
        longitude: draftPoint.longitude,
        visibility,
        ...(type === 'MOMENT' || type === 'SEASONAL'
          ? { expiresAt: new Date(expiresAt).toISOString() }
          : {}),
        ...(type === 'SEASONAL' ? { startsAt: new Date().toISOString() } : {}),
      });

      setDropping(false);
      setDraftPoint(null);
      setMessage('');
      await load();
    } catch {
      setMessage('The discovery could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(item: MapDiscovery): void {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setCategory(item.category);
    setType(item.type);
    setVisibility(item.visibility);
    setExpiresAt(item.expiresAt ? new Date(item.expiresAt).toISOString().slice(0, 16) : '');
    setMessage('');
  }

  function cancelEdit(): void {
    setEditingId(null);
  }

  async function saveEdit(item: MapDiscovery): Promise<void> {
    const token = localStorage.getItem('accessToken');
    if (!token || !owner || saving || !title.trim()) return;

    if ((type === 'MOMENT' || type === 'SEASONAL') && !expiresAt) {
      setMessage('Choose when this discovery should expire.');
      return;
    }

    try {
      setSaving(true);
      await updateMapDiscovery(token, item.id, {
        title: title.trim(),
        description: description.trim(),
        category,
        type,
        visibility,
        startsAt: type === 'SEASONAL' ? new Date().toISOString() : null,
        expiresAt:
          type === 'MOMENT' || type === 'SEASONAL' ? new Date(expiresAt).toISOString() : null,
      });
      setEditingId(null);
      setMessage('Discovery updated.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The discovery could not be updated.');
    } finally {
      setSaving(false);
    }
  }

  async function reportDiscovery(id: string): Promise<void> {
    const token = localStorage.getItem('accessToken');
    if (!token || owner || reportingId) return;

    const reason = window.prompt('Tell us briefly why this discovery should be reviewed.');
    if (!reason?.trim()) return;

    try {
      setReportingId(id);
      await createSecurityReport(token, {
        targetType: 'MAP_DISCOVERY',
        targetId: id,
        reason: reason.trim(),
      });
      setMessage('Report submitted for review.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The report could not be submitted.');
    } finally {
      setReportingId(null);
    }
  }

  async function removeDiscovery(id: string): Promise<void> {
    const token = localStorage.getItem('accessToken');
    if (!token || !owner || deletingId) return;

    try {
      setDeletingId(id);
      await deleteMapDiscovery(token, id);
      setSelectedId(null);
      await load();
    } catch {
      setMessage('The discovery could not be removed.');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading && !profile) {
    return <main className="personal-map-loading">{message}</main>;
  }

  if (!profile) {
    return <main className="personal-map-loading">{message}</main>;
  }

  return (
    <main className="personal-map-page">
      <header className="personal-map-header">
        <div>
          <Link href={`/profile/${encodeURIComponent(username)}`} className="map-back">
            ← {profile.displayName}
          </Link>
          <span className="map-eyebrow">PERSONAL MAP</span>
          <h1>{owner ? 'My discoveries' : `${profile.displayName}'s discoveries`}</h1>
          <p>Places, moments and local discoveries deliberately saved to this personal map.</p>
        </div>

        <div className="map-header-actions">
          <Link
            href={`/profile/${encodeURIComponent(username)}/map/trails`}
            className="trails-link"
          >
            Trails ↝
          </Link>
          {owner ? (
            <button
              type="button"
              className={dropping ? 'drop-pin active' : 'drop-pin'}
              onClick={dropping ? cancelDrop : beginDrop}
            >
              {dropping ? 'Cancel pin' : 'Drop a pin'}
            </button>
          ) : null}
        </div>
      </header>

      {message && !loading ? <div className="map-message">{message}</div> : null}

      {dropping ? (
        <section className="drop-panel">
          <div className="drop-panel-copy">
            <span>NEW DISCOVERY</span>
            <strong>
              {draftPoint ? 'Exact position selected' : 'Click the exact position on the map'}
            </strong>
            <p>
              This discovery belongs to your Personal Map. It will never be added to Nearby
              automatically.
            </p>
          </div>

          {draftPoint ? (
            <div className="drop-form">
              <label>
                Name
                <input
                  value={title}
                  maxLength={120}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="The Sunflowers"
                />
              </label>

              <label>
                What is here?
                <textarea
                  value={description}
                  maxLength={2000}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Add your local knowledge or why this place matters."
                />
              </label>

              <div className="drop-grid">
                <label>
                  Category
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as MapDiscoveryCategory)}
                  >
                    {CATEGORIES.map((item) => (
                      <option value={item.value} key={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Lifecycle
                  <select
                    value={type}
                    onChange={(event) => setType(event.target.value as MapDiscoveryType)}
                  >
                    <option value="LANDMARK">Landmark</option>
                    <option value="MOMENT">Moment</option>
                    <option value="SEASONAL">Seasonal</option>
                  </select>
                </label>

                <label>
                  Visibility
                  <select
                    value={visibility}
                    onChange={(event) =>
                      setVisibility(event.target.value as MapDiscoveryVisibility)
                    }
                  >
                    <option value="PRIVATE">Only me</option>
                    <option value="PUBLIC">Public profile</option>
                  </select>
                </label>

                {type === 'MOMENT' || type === 'SEASONAL' ? (
                  <label>
                    Visible until
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(event) => setExpiresAt(event.target.value)}
                    />
                  </label>
                ) : null}
              </div>

              <div className="coordinate-row">
                <span>{draftPoint.latitude.toFixed(6)}</span>
                <span>{draftPoint.longitude.toFixed(6)}</span>
              </div>

              <button
                type="button"
                className="save-discovery"
                disabled={saving || !title.trim()}
                onClick={() => void saveDiscovery()}
              >
                {saving ? 'Saving…' : 'Save discovery'}
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="map-layout">
        <div className={dropping ? 'map-shell dropping' : 'map-shell'}>
          <div ref={mapContainerRef} className="leaflet-map" />
          {dropping && !draftPoint ? (
            <div className="drop-hint">Click anywhere to place your pin</div>
          ) : null}
        </div>

        <aside className="discovery-panel">
          <header>
            <span>DISCOVERIES</span>
            <strong>{discoveries.length}</strong>
          </header>

          {selected ? (
            <article className="selected-discovery">
              <button type="button" className="close-selected" onClick={() => setSelectedId(null)}>
                ×
              </button>
              <span>{selected.category.replaceAll('_', ' ')}</span>
              <h2>{selected.title}</h2>
              <p>{selected.description || 'No description added.'}</p>
              <div className="discovery-meta">
                <span>{selected.type.toLowerCase()}</span>
                {owner ? <span>{selected.visibility.toLowerCase()}</span> : null}
              </div>
              {owner ? (
                editingId === selected.id ? (
                  <div className="drop-form edit-discovery-form">
                    <label>
                      Name
                      <input
                        value={title}
                        maxLength={120}
                        onChange={(event) => setTitle(event.target.value)}
                      />
                    </label>
                    <label>
                      What is here?
                      <textarea
                        value={description}
                        maxLength={2000}
                        onChange={(event) => setDescription(event.target.value)}
                      />
                    </label>
                    <div className="drop-grid">
                      <label>
                        Category
                        <select
                          value={category}
                          onChange={(event) =>
                            setCategory(event.target.value as MapDiscoveryCategory)
                          }
                        >
                          {CATEGORIES.map((item) => (
                            <option value={item.value} key={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Lifecycle
                        <select
                          value={type}
                          onChange={(event) => setType(event.target.value as MapDiscoveryType)}
                        >
                          <option value="LANDMARK">Landmark</option>
                          <option value="MOMENT">Moment</option>
                          <option value="SEASONAL">Seasonal</option>
                        </select>
                      </label>
                      <label>
                        Visibility
                        <select
                          value={visibility}
                          onChange={(event) =>
                            setVisibility(event.target.value as MapDiscoveryVisibility)
                          }
                        >
                          <option value="PRIVATE">Only me</option>
                          <option value="PUBLIC">Public profile</option>
                        </select>
                      </label>
                      {type === 'MOMENT' || type === 'SEASONAL' ? (
                        <label>
                          Visible until
                          <input
                            type="datetime-local"
                            value={expiresAt}
                            onChange={(event) => setExpiresAt(event.target.value)}
                          />
                        </label>
                      ) : null}
                    </div>
                    {visibility === 'PUBLIC' ? (
                      <p className="location-safety-note">
                        Public discoveries share the location you selected. Avoid publishing
                        sensitive private locations.
                      </p>
                    ) : null}
                    <div className="edit-actions">
                      <button
                        type="button"
                        className="save-discovery"
                        disabled={saving || !title.trim()}
                        onClick={() => void saveEdit(selected)}
                      >
                        {saving ? 'Saving…' : 'Save changes'}
                      </button>
                      <button type="button" className="secondary-map-action" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="edit-actions">
                    <button
                      type="button"
                      className="save-discovery"
                      onClick={() => beginEdit(selected)}
                    >
                      Edit discovery
                    </button>
                    <button
                      type="button"
                      className="delete-discovery"
                      disabled={deletingId === selected.id}
                      onClick={() => void removeDiscovery(selected.id)}
                    >
                      {deletingId === selected.id ? 'Removing…' : 'Remove from my map'}
                    </button>
                  </div>
                )
              ) : (
                <button
                  type="button"
                  className="secondary-map-action"
                  disabled={reportingId === selected.id}
                  onClick={() => void reportDiscovery(selected.id)}
                >
                  {reportingId === selected.id ? 'Reporting…' : 'Report discovery'}
                </button>
              )}
            </article>
          ) : discoveries.length === 0 ? (
            <div className="discovery-empty">
              <div>⌖</div>
              <strong>{owner ? 'Your map is ready.' : 'No public discoveries yet.'}</strong>
              <p>
                {owner
                  ? 'Drop your first pin to remember a place that means something to you.'
                  : `Places ${profile.displayName} chooses to share will appear here.`}
              </p>
            </div>
          ) : (
            <div className="discovery-list">
              {discoveries.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setSelectedId(item.id);
                    mapRef.current?.setView([item.latitude, item.longitude], 16);
                  }}
                >
                  <span className="list-symbol">{discoverySymbol(item.category)}</span>
                  <span>
                    <strong>{item.title}</strong>
                    <small>{item.category.replaceAll('_', ' ')}</small>
                  </span>
                </button>
              ))}
            </div>
          )}
        </aside>
      </section>

      <style>{`
        .personal-map-page {
          width: min(100% - 48px, 1380px);
          margin: 0 auto;
          padding: 38px 0 80px;
          color: #14261d;
        }

        .personal-map-loading {
          padding: 60px;
        }

        .personal-map-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 24px;
        }

        .map-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .trails-link {
          display: inline-flex;
          align-items: center;
          min-height: 42px;
          border: 1px solid #cbdad1;
          border-radius: 999px;
          padding: 0 17px;
          background: #f4f8f5;
          color: #174c35;
          text-decoration: none;
          font-weight: 800;
        }
        .map-back {
          display: block;
          width: fit-content;
          margin-bottom: 24px;
          color: #527064;
          text-decoration: none;
          font-weight: 700;
        }

        .map-eyebrow,
        .drop-panel-copy span,
        .discovery-panel > header span {
          display: block;
          margin-bottom: 7px;
          color: #0e754d;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .14em;
        }

        .personal-map-header h1 {
          margin: 0;
          font-size: clamp(32px, 4vw, 52px);
          line-height: 1;
        }

        .personal-map-header p {
          max-width: 700px;
          margin: 12px 0 0;
          color: #61736a;
          font-size: 16px;
        }

        .drop-pin,
        .save-discovery {
          border: 0;
          border-radius: 999px;
          background: #0e754d;
          color: #fff;
          padding: 14px 22px;
          font-weight: 800;
          cursor: pointer;
        }

        .drop-pin.active {
          background: #173c2e;
        }

        .map-message {
          margin-bottom: 18px;
          border: 1px solid #dfe9e4;
          border-radius: 14px;
          background: #fff;
          padding: 12px 16px;
          color: #52675d;
        }

        .drop-panel {
          display: grid;
          grid-template-columns: minmax(220px, .75fr) minmax(0, 1.8fr);
          gap: 28px;
          margin-bottom: 20px;
          border: 1px solid #d9e8df;
          border-radius: 24px;
          background: #f5fbf7;
          padding: 24px;
        }

        .drop-panel-copy strong {
          display: block;
          font-size: 21px;
        }

        .drop-panel-copy p {
          color: #62746b;
          line-height: 1.55;
        }

        .drop-form {
          display: grid;
          gap: 14px;
        }

        .drop-form label {
          display: grid;
          gap: 7px;
          color: #344d41;
          font-size: 13px;
          font-weight: 800;
        }

        .drop-form input,
        .drop-form textarea,
        .drop-form select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #ccdcd3;
          border-radius: 13px;
          background: #fff;
          padding: 12px 13px;
          color: #14261d;
          font: inherit;
        }

        .drop-form textarea {
          min-height: 90px;
          resize: vertical;
        }

        .drop-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .coordinate-row {
          display: flex;
          gap: 10px;
          color: #6a7d73;
          font-size: 12px;
          font-family: monospace;
        }

        .save-discovery {
          width: fit-content;
        }

        .save-discovery:disabled {
          opacity: .5;
          cursor: default;
        }

        .map-layout {
          display: grid;
          grid-template-columns: minmax(0, 2.2fr) minmax(300px, .8fr);
          gap: 20px;
        }

        .map-shell {
          position: relative;
          overflow: hidden;
          min-height: 660px;
          border: 1px solid #dce8e2;
          border-radius: 26px;
          background: #eaf3ee;
          box-shadow: 0 18px 50px rgba(19,58,41,.08);
        }

        .map-shell.dropping {
          cursor: crosshair;
          box-shadow: 0 0 0 3px rgba(14,117,77,.12), 0 18px 50px rgba(19,58,41,.08);
        }

        .leaflet-map {
          width: 100%;
          height: 660px;
        }

        .drop-hint {
          position: absolute;
          z-index: 500;
          top: 18px;
          left: 50%;
          transform: translateX(-50%);
          pointer-events: none;
          border-radius: 999px;
          background: rgba(20,38,29,.9);
          color: #fff;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 800;
        }

        .map-shell :global(.leaflet-container) {
          width: 100%;
          height: 100%;
          font-family: inherit;
        }

        .map-shell :global(.personal-map-marker-shell),
        .map-shell :global(.personal-map-draft-shell) {
          border: 0;
          background: transparent;
        }

        .map-shell :global(.personal-map-marker),
        .map-shell :global(.personal-map-draft) {
          display: grid;
          width: 38px;
          height: 38px;
          place-items: center;
          border: 3px solid #fff;
          border-radius: 50%;
          background: #0e754d;
          color: #fff;
          box-shadow: 0 6px 18px rgba(16,55,39,.28);
          font-size: 16px;
          font-weight: 900;
        }

        .map-shell :global(.personal-map-draft) {
          width: 42px;
          height: 42px;
          background: #14261d;
          font-size: 24px;
        }

        .discovery-panel {
          overflow: hidden;
          min-height: 660px;
          border: 1px solid #dce8e2;
          border-radius: 26px;
          background: #fff;
          box-shadow: 0 18px 50px rgba(19,58,41,.06);
        }

        .discovery-panel > header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px;
          border-bottom: 1px solid #edf2ef;
        }

        .discovery-panel > header span {
          margin: 0;
        }

        .discovery-panel > header strong {
          display: grid;
          min-width: 34px;
          height: 34px;
          place-items: center;
          border-radius: 999px;
          background: #e9f5ee;
          color: #0e754d;
        }

        .discovery-list {
          display: grid;
        }

        .discovery-list button {
          display: flex;
          align-items: center;
          gap: 13px;
          border: 0;
          border-bottom: 1px solid #edf2ef;
          background: #fff;
          padding: 16px 20px;
          text-align: left;
          cursor: pointer;
        }

        .discovery-list button:hover {
          background: #f7fbf9;
        }

        .list-symbol {
          display: grid;
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          place-items: center;
          border-radius: 12px;
          background: #e9f5ee;
          color: #0e754d;
          font-weight: 900;
        }

        .discovery-list strong,
        .discovery-list small {
          display: block;
        }

        .discovery-list small {
          margin-top: 3px;
          color: #75867d;
          text-transform: capitalize;
        }

        .selected-discovery {
          position: relative;
          padding: 26px 22px;
        }

        .selected-discovery > span {
          color: #0e754d;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .1em;
        }

        .selected-discovery h2 {
          margin: 7px 35px 10px 0;
          font-size: 25px;
        }

        .selected-discovery p {
          color: #5c7065;
          line-height: 1.6;
        }

        .close-selected {
          position: absolute;
          top: 18px;
          right: 18px;
          border: 0;
          background: transparent;
          color: #61736a;
          font-size: 25px;
          cursor: pointer;
        }

        .discovery-meta {
          display: flex;
          gap: 7px;
          margin-top: 16px;
        }

        .discovery-meta span {
          border-radius: 999px;
          background: #eef5f1;
          padding: 6px 9px;
          color: #52675d;
          font-size: 11px;
          text-transform: capitalize;
        }

        .edit-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
        }

        .edit-discovery-form {
          margin-top: 20px;
        }

        .location-safety-note {
          margin: 0;
          border-radius: 12px;
          background: #fff7e8;
          padding: 11px 13px;
          color: #6c5425;
          font-size: 12px;
          line-height: 1.5;
        }

        .secondary-map-action {
          border: 1px solid #ccdcd3;
          border-radius: 999px;
          background: #fff;
          color: #344d41;
          padding: 10px 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .delete-discovery {
          margin-top: 0;
          border: 1px solid #ecd4d4;
          border-radius: 999px;
          background: #fff;
          color: #9d3333;
          padding: 10px 14px;
          font-weight: 800;
          cursor: pointer;
        }

        .discovery-empty {
          display: grid;
          min-height: 470px;
          place-items: center;
          align-content: center;
          padding: 30px;
          text-align: center;
        }

        .discovery-empty div {
          display: grid;
          width: 58px;
          height: 58px;
          place-items: center;
          margin-bottom: 14px;
          border-radius: 18px;
          background: #e9f5ee;
          color: #0e754d;
          font-size: 27px;
        }

        .discovery-empty p {
          max-width: 270px;
          color: #74857c;
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .personal-map-page {
            width: min(100% - 28px, 1380px);
          }

          .personal-map-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .drop-panel,
          .map-layout {
            grid-template-columns: 1fr;
          }

          .map-shell,
          .discovery-panel {
            min-height: 520px;
          }

          .leaflet-map {
            height: 520px;
          }

          .drop-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
