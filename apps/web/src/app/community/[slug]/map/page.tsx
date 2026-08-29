'use client';

import {
  createMapDiscovery,
  deleteMapDiscovery,
  getCommunity,
  getCommunityMapDiscoveries,
  getMyCommunities,
  getMyProfile,
  updateMapDiscovery,
  createSecurityReport,
  type Community,
  type CommunityMembership,
  type MapDiscovery,
  type MapDiscoveryCategory,
  type MapDiscoveryType,
} from '@neighbour/api-client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type { LayerGroup, Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import CommunityHeader from '../../../../components/community/CommunityHeader';
import CommunityTabs from '../../../../components/community/CommunityTabs';

const categories: Array<{
  value: MapDiscoveryCategory;
  label: string;
}> = [
  { value: 'NATURE', label: 'Nature' },
  { value: 'WALK', label: 'Walk' },
  { value: 'ACTIVITY', label: 'Activity' },
  { value: 'VIEWPOINT', label: 'Viewpoint' },
  { value: 'LOCAL_HISTORY', label: 'Local history' },
  { value: 'ART_CULTURE', label: 'Art & culture' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'OTHER', label: 'Other' },
];

function discoverySymbol(category: MapDiscoveryCategory) {
  switch (category) {
    case 'NATURE':
      return '✦';
    case 'WALK':
      return '↝';
    case 'ACTIVITY':
      return '●';
    case 'VIEWPOINT':
      return '◇';
    case 'LOCAL_HISTORY':
      return '⌂';
    case 'ART_CULTURE':
      return '◆';
    case 'COMMUNITY':
      return '◎';
    default:
      return '•';
  }
}

function categoryLabel(category: MapDiscoveryCategory) {
  return categories.find((item) => item.value === category)?.label ?? 'Discovery';
}

function initialCentre(community: Community | null, discoveries: MapDiscovery[]): [number, number] {
  if (discoveries.length > 0) {
    return [discoveries[0].latitude, discoveries[0].longitude];
  }

  if (
    community?.latitude !== null &&
    community?.latitude !== undefined &&
    community?.longitude !== null &&
    community?.longitude !== undefined
  ) {
    return [community.latitude, community.longitude];
  }

  return [53.4808, -2.2426];
}

export default function CommunityMapPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [membership, setMembership] = useState<CommunityMembership | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [discoveries, setDiscoveries] = useState<MapDiscovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Loading community map…');
  const [dropping, setDropping] = useState(false);
  const [draftPoint, setDraftPoint] = useState<[number, number] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MapDiscoveryCategory>('OTHER');
  const [type, setType] = useState<MapDiscoveryType>('LANDMARK');
  const [expiresAt, setExpiresAt] = useState('');

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const draftMarkerRef = useRef<LeafletMarker | null>(null);

  const activeMember = membership?.status === 'ACTIVE';

  async function load() {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setMessage('Sign in to view this community map.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage('Loading community map…');

    try {
      const communityResult = await getCommunity(token, slug);
      const [memberships, profile] = await Promise.all([
        getMyCommunities(token),
        getMyProfile(token),
      ]);

      setCurrentUserId(profile.userId);

      const ownMembership =
        memberships.find(
          (item) =>
            item.community.id === communityResult.id ||
            item.community.slug === communityResult.slug,
        ) ?? null;

      const normalizedMembership =
        ownMembership?.role === 'OWNER'
          ? {
              ...ownMembership,
              status: 'ACTIVE' as const,
            }
          : ownMembership;

      setCommunity(communityResult);
      setMembership(normalizedMembership);

      if (!normalizedMembership || normalizedMembership.status !== 'ACTIVE') {
        setDiscoveries([]);
        setMessage('Join this community to view and contribute to its map.');
        return;
      }

      const mapItems = await getCommunityMapDiscoveries(token, communityResult.id);

      setDiscoveries(mapItems);
      setMessage('');
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : 'This community map could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [slug]);

  useEffect(() => {
    if (loading || !community || !activeMember || !mapContainerRef.current || mapRef.current) {
      return;
    }

    let cancelled = false;

    void import('leaflet').then((L) => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
        touchZoom: true,
        keyboard: true,
      }).setView(initialCentre(community, discoveries), discoveries.length ? 14 : 12);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      markerLayerRef.current = L.layerGroup().addTo(map);

      map.on('click', (event) => {
        setDropping((active) => {
          if (active) {
            setDraftPoint([event.latlng.lat, event.latlng.lng]);
          }
          return active;
        });
      });

      mapRef.current = map;
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
  }, [loading, community, activeMember]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markerLayerRef.current;

    if (!map || !layer) return;

    let cancelled = false;

    void import('leaflet').then((L) => {
      if (cancelled || mapRef.current !== map || markerLayerRef.current !== layer) {
        return;
      }

      layer.clearLayers();

      for (const item of discoveries) {
        const icon = L.divIcon({
          className: 'community-map-marker-shell',
          html: `<span class="community-map-marker">${discoverySymbol(item.category)}</span>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const marker = L.marker([item.latitude, item.longitude], { icon });

        marker.on('click', () => {
          setSelectedId(item.id);
        });

        marker.addTo(layer);
      }

      if (discoveries.length > 0) {
        const bounds = L.latLngBounds(
          discoveries.map((item) => [item.latitude, item.longitude] as [number, number]),
        );

        map.fitBounds(bounds.pad(0.2), { maxZoom: 15 });
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
        className: 'community-map-draft-shell',
        html: '<span class="community-map-draft">+</span>',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      draftMarkerRef.current = L.marker(draftPoint, { icon }).addTo(map);
    });

    return () => {
      cancelled = true;
    };
  }, [draftPoint]);

  function beginDrop() {
    setDropping(true);
    setDraftPoint(null);
    setSelectedId(null);
    setMessage('Choose the exact place on the map.');
  }

  function cancelDrop() {
    setDropping(false);
    setDraftPoint(null);
    setTitle('');
    setDescription('');
    setCategory('OTHER');
    setType('LANDMARK');
    setExpiresAt('');
    setMessage('');
  }

  async function saveDiscovery() {
    const token = localStorage.getItem('accessToken');

    if (!token || !community || !activeMember || !draftPoint || !title.trim() || saving) {
      return;
    }

    if ((type === 'MOMENT' || type === 'SEASONAL') && !expiresAt) {
      setMessage('Choose when this discovery should expire.');
      return;
    }

    setSaving(true);
    setMessage('Saving community discovery…');

    try {
      await createMapDiscovery(token, {
        scope: 'COMMUNITY',
        communityId: community.id,
        type,
        category,
        title: title.trim(),
        description: description.trim(),
        latitude: draftPoint[0],
        longitude: draftPoint[1],
        visibility: 'COMMUNITY',
        ...(type === 'SEASONAL' ? { startsAt: new Date().toISOString() } : {}),
        ...(type === 'MOMENT' || type === 'SEASONAL'
          ? { expiresAt: new Date(expiresAt).toISOString() }
          : {}),
      });

      setDropping(false);
      setDraftPoint(null);
      setTitle('');
      setDescription('');
      setCategory('OTHER');
      setType('LANDMARK');
      setExpiresAt('');

      const refreshed = await getCommunityMapDiscoveries(token, community.id);
      setDiscoveries(refreshed);
      setMessage('Discovery added to the community map.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The discovery could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  function beginEdit(item: MapDiscovery) {
    setEditingId(item.id);
    setTitle(item.title);
    setDescription(item.description);
    setCategory(item.category);
    setType(item.type);
    setExpiresAt(item.expiresAt ? new Date(item.expiresAt).toISOString().slice(0, 16) : '');
    setMessage('');
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(item: MapDiscovery) {
    const token = localStorage.getItem('accessToken');
    if (!token || item.creatorId !== currentUserId || saving || !title.trim()) return;

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
        visibility: 'COMMUNITY',
        startsAt: type === 'SEASONAL' ? new Date().toISOString() : null,
        expiresAt:
          type === 'MOMENT' || type === 'SEASONAL' ? new Date(expiresAt).toISOString() : null,
      });
      setEditingId(null);
      setMessage('Community discovery updated.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The discovery could not be updated.');
    } finally {
      setSaving(false);
    }
  }

  async function reportDiscovery(id: string) {
    const token = localStorage.getItem('accessToken');
    if (!token || reportingId) return;

    const reason = window.prompt(
      'Tell us briefly why this community discovery should be reviewed.',
    );
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

  async function removeDiscovery(item: MapDiscovery) {
    const token = localStorage.getItem('accessToken');

    if (!token || !community || deletingId) return;

    const creator = item.creatorId === currentUserId;
    const moderator =
      membership?.role === 'OWNER' ||
      membership?.role === 'ADMIN' ||
      membership?.role === 'MODERATOR';

    if (!creator && !moderator) return;

    const confirmed = window.confirm(`Remove "${item.title}" from this community map?`);

    if (!confirmed) return;

    setDeletingId(item.id);
    setMessage('Removing discovery…');

    try {
      await deleteMapDiscovery(token, item.id);

      const refreshed = await getCommunityMapDiscoveries(token, community.id);
      setDiscoveries(refreshed);
      setSelectedId(null);
      setMessage('Discovery removed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The discovery could not be removed.');
    } finally {
      setDeletingId(null);
    }
  }

  const selected = discoveries.find((item) => item.id === selectedId) ?? null;

  const moderator =
    membership?.role === 'OWNER' ||
    membership?.role === 'ADMIN' ||
    membership?.role === 'MODERATOR';

  return (
    <main className="community-map-page">
      {community ? <CommunityHeader community={community} /> : null}
      <CommunityTabs slug={slug} />

      <section className="community-map-heading">
        <div>
          <div className="eyebrow">COMMUNITY MAP</div>
          <h1>{community ? `${community.name} discoveries` : 'Community discoveries'}</h1>
          <p>Places, landmarks and local knowledge deliberately shared by this community.</p>
        </div>

        {activeMember ? (
          <div className="community-map-actions">
            <Link
              href={`/community/${encodeURIComponent(slug)}/map/trails`}
              className="trails-link"
            >
              Trails ↝
            </Link>
            <button
              className="drop-button"
              type="button"
              onClick={dropping ? cancelDrop : beginDrop}
            >
              {dropping ? 'Cancel pin' : 'Drop a pin'}
            </button>
          </div>
        ) : null}
      </section>

      {message ? <div className="map-message">{message}</div> : null}

      {!loading && !activeMember ? (
        <section className="locked-card">
          <div className="locked-icon">⌖</div>
          <h2>Community members only</h2>
          <p>
            Join this community to see its shared local discoveries and contribute places of your
            own.
          </p>
          <Link href={`/community/${encodeURIComponent(slug)}`}>Back to community</Link>
        </section>
      ) : null}

      {!loading && activeMember ? (
        <>
          <section className="map-layout">
            <div className="map-shell">
              <div ref={mapContainerRef} className="leaflet-map" />

              {dropping ? (
                <div className="drop-hint">
                  {draftPoint
                    ? 'Pin placed. Add the details below.'
                    : 'Click the exact location you want to remember.'}
                </div>
              ) : null}
            </div>

            <aside className="discovery-panel">
              <div className="panel-heading">
                <span>DISCOVERIES</span>
                <strong>{discoveries.length}</strong>
              </div>

              {discoveries.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⌖</div>
                  <strong>This community map is ready.</strong>
                  <p>Add the first place, landmark or local discovery worth sharing.</p>
                </div>
              ) : (
                <div className="discovery-list">
                  {discoveries.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`discovery-row ${selectedId === item.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedId(item.id);
                        mapRef.current?.setView([item.latitude, item.longitude], 16);
                      }}
                    >
                      <span className="row-symbol">{discoverySymbol(item.category)}</span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{categoryLabel(item.category)}</small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </aside>
          </section>

          {dropping && draftPoint ? (
            <section className="editor-card">
              <div className="eyebrow">NEW COMMUNITY DISCOVERY</div>
              <h2>What is here?</h2>
              <p className="coordinates">
                {draftPoint[0].toFixed(6)}, {draftPoint[1].toFixed(6)}
              </p>

              <div className="editor-grid">
                <label className="wide">
                  <span>Title</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. The Sunflowers"
                    maxLength={120}
                  />
                </label>

                <label>
                  <span>Category</span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as MapDiscoveryCategory)}
                  >
                    {categories.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Lifecycle</span>
                  <select
                    value={type}
                    onChange={(event) => {
                      const next = event.target.value as MapDiscoveryType;
                      setType(next);

                      if (next === 'LANDMARK') {
                        setExpiresAt('');
                      }
                    }}
                  >
                    <option value="LANDMARK">Landmark</option>
                    <option value="MOMENT">Moment</option>
                    <option value="SEASONAL">Seasonal</option>
                  </select>
                </label>

                {type === 'MOMENT' || type === 'SEASONAL' ? (
                  <label>
                    <span>Expires</span>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(event) => setExpiresAt(event.target.value)}
                    />
                  </label>
                ) : null}

                <label className="wide">
                  <span>Description</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="What should neighbours know about this place?"
                    rows={4}
                    maxLength={1000}
                  />
                </label>
              </div>

              <div className="editor-actions">
                <button type="button" className="secondary-button" onClick={cancelDrop}>
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-button"
                  disabled={saving || !title.trim()}
                  onClick={() => void saveDiscovery()}
                >
                  {saving ? 'Saving…' : 'Add to community map'}
                </button>
              </div>
            </section>
          ) : null}

          {selected ? (
            <section className="selected-card">
              {editingId === selected.id && selected.creatorId === currentUserId ? (
                <>
                  <div>
                    <div className="eyebrow">EDIT DISCOVERY</div>
                    <h2>Edit {selected.title}</h2>
                  </div>

                  <div className="editor-grid">
                    <label className="wide">
                      <span>Title</span>
                      <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        maxLength={120}
                      />
                    </label>

                    <label>
                      <span>Category</span>
                      <select
                        value={category}
                        onChange={(event) =>
                          setCategory(event.target.value as MapDiscoveryCategory)
                        }
                      >
                        {categories.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>Lifecycle</span>
                      <select
                        value={type}
                        onChange={(event) => {
                          const next = event.target.value as MapDiscoveryType;
                          setType(next);

                          if (next === 'LANDMARK') {
                            setExpiresAt('');
                          }
                        }}
                      >
                        <option value="LANDMARK">Landmark</option>
                        <option value="MOMENT">Moment</option>
                        <option value="SEASONAL">Seasonal</option>
                      </select>
                    </label>

                    {type === 'MOMENT' || type === 'SEASONAL' ? (
                      <label>
                        <span>Expires</span>
                        <input
                          type="datetime-local"
                          value={expiresAt}
                          onChange={(event) => setExpiresAt(event.target.value)}
                        />
                      </label>
                    ) : null}

                    <label className="wide">
                      <span>Description</span>
                      <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        rows={4}
                        maxLength={1000}
                      />
                    </label>
                  </div>

                  <div className="editor-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={saving}
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="primary-button"
                      disabled={saving || !title.trim()}
                      onClick={() => void saveEdit(selected)}
                    >
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="eyebrow">{categoryLabel(selected.category).toUpperCase()}</div>
                    <h2>{selected.title}</h2>
                    {selected.description ? <p>{selected.description}</p> : null}
                    <div className="selected-meta">
                      {selected.type.toLowerCase()} · shared by{' '}
                      {selected.creator?.displayName ?? 'a neighbour'}
                    </div>
                  </div>

                  <div className="editor-actions">
                    {selected.creatorId === currentUserId ? (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => beginEdit(selected)}
                      >
                        Edit discovery
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={reportingId === selected.id}
                        onClick={() => void reportDiscovery(selected.id)}
                      >
                        {reportingId === selected.id ? 'Reporting…' : 'Report discovery'}
                      </button>
                    )}

                    {selected.creatorId === currentUserId || moderator ? (
                      <button
                        type="button"
                        className="remove-button"
                        disabled={deletingId === selected.id}
                        onClick={() => void removeDiscovery(selected)}
                      >
                        {deletingId === selected.id ? 'Removing…' : 'Remove'}
                      </button>
                    ) : null}
                  </div>
                </>
              )}
            </section>
          ) : null}

          <div className="community-map-footer">
            <Link href={`/community/${encodeURIComponent(slug)}`}>← Back to community</Link>
            <span>
              Community discoveries stay on this community map and do not automatically enter
              Nearby.
            </span>
          </div>
        </>
      ) : null}

      <style>{`
        .community-map-actions {
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
        .community-map-page {
          max-width: 1180px;
          margin: 0 auto;
          padding: 40px;
          color: #10251b;
        }

        .community-map-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin: 18px 0 20px;
        }

        .eyebrow {
          color: #08754b;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .16em;
        }

        .community-map-heading h1 {
          margin: 6px 0 5px;
          font-size: clamp(32px, 4vw, 48px);
          line-height: 1;
          letter-spacing: -.04em;
        }

        .community-map-heading p,
        .selected-card p {
          margin: 0;
          color: #617168;
        }

        .drop-button,
        .primary-button {
          min-height: 46px;
          border: 0;
          border-radius: 999px;
          padding: 0 20px;
          background: #08754b;
          color: white;
          font-weight: 850;
          cursor: pointer;
        }

        .map-message {
          margin-bottom: 16px;
          padding: 12px 16px;
          border: 1px solid #dfe7e2;
          border-radius: 14px;
          background: white;
          color: #526159;
        }

        .map-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 300px;
          gap: 18px;
        }

        .map-shell,
        .discovery-panel,
        .editor-card,
        .selected-card,
        .locked-card {
          border: 1px solid #dfe7e2;
          border-radius: 22px;
          background: white;
          overflow: hidden;
        }

        .map-shell {
          position: relative;
          min-height: 540px;
        }

        .leaflet-map {
          width: 100%;
          height: 540px;
        }

        .drop-hint {
          position: absolute;
          z-index: 500;
          left: 50%;
          top: 18px;
          transform: translateX(-50%);
          padding: 10px 16px;
          border-radius: 999px;
          background: rgba(16, 37, 27, .92);
          color: white;
          font-size: 13px;
          font-weight: 750;
          pointer-events: none;
        }

        .discovery-panel {
          min-height: 540px;
        }

        .panel-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 22px;
          border-bottom: 1px solid #edf1ee;
          color: #08754b;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .13em;
        }

        .panel-heading strong {
          display: grid;
          place-items: center;
          min-width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #edf8f2;
          font-size: 14px;
          letter-spacing: 0;
        }

        .empty-state,
        .locked-card {
          display: flex;
          min-height: 390px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 34px;
          text-align: center;
        }

        .empty-state p,
        .locked-card p {
          max-width: 390px;
          color: #6a7971;
        }

        .empty-icon,
        .locked-icon {
          display: grid;
          place-items: center;
          width: 48px;
          height: 48px;
          margin-bottom: 14px;
          border-radius: 16px;
          background: #edf8f2;
          color: #08754b;
          font-size: 22px;
        }

        .discovery-list {
          display: flex;
          flex-direction: column;
        }

        .discovery-row {
          display: flex;
          width: 100%;
          gap: 12px;
          align-items: center;
          padding: 15px 16px;
          border: 0;
          border-bottom: 1px solid #edf1ee;
          background: white;
          text-align: left;
          cursor: pointer;
        }

        .discovery-row.selected {
          background: #f0f8f4;
        }

        .row-symbol {
          display: grid;
          place-items: center;
          flex: 0 0 34px;
          height: 34px;
          border-radius: 11px;
          background: #eaf7f0;
          color: #08754b;
          font-weight: 900;
        }

        .discovery-row strong,
        .discovery-row small {
          display: block;
        }

        .discovery-row small {
          margin-top: 3px;
          color: #78847e;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: .08em;
        }

        .editor-card,
        .selected-card {
          margin-top: 18px;
          padding: 24px;
        }

        .editor-card h2,
        .selected-card h2 {
          margin: 6px 0 8px;
        }

        .coordinates,
        .selected-meta {
          color: #7b8981;
          font-size: 13px;
        }

        .editor-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 20px;
        }

        .editor-grid label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          font-size: 13px;
          font-weight: 800;
        }

        .editor-grid .wide {
          grid-column: 1 / -1;
        }

        .editor-grid input,
        .editor-grid select,
        .editor-grid textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d7e0da;
          border-radius: 12px;
          padding: 12px 13px;
          background: #fbfcfb;
          color: #10251b;
          font: inherit;
        }

        .editor-actions,
        .selected-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .editor-actions {
          margin-top: 20px;
          justify-content: flex-end;
        }

        .secondary-button,
        .remove-button {
          min-height: 44px;
          border: 1px solid #d5ded8;
          border-radius: 999px;
          padding: 0 18px;
          background: white;
          font-weight: 800;
          cursor: pointer;
        }

        .remove-button {
          border-color: #d7aaa5;
          color: #a02c22;
        }

        button:disabled {
          opacity: .55;
          cursor: not-allowed;
        }

        .community-map-footer {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-top: 18px;
          color: #6b7971;
          font-size: 13px;
        }

        .community-map-footer a,
        .locked-card a {
          color: #08754b;
          font-weight: 850;
          text-decoration: none;
        }

        .map-shell :global(.leaflet-container) {
          font-family: inherit;
        }

        .map-shell :global(.community-map-marker-shell),
        .map-shell :global(.community-map-draft-shell) {
          background: transparent;
          border: 0;
        }

        .map-shell :global(.community-map-marker),
        .map-shell :global(.community-map-draft) {
          display: grid;
          place-items: center;
          width: 34px;
          height: 34px;
          border: 3px solid white;
          border-radius: 50%;
          background: #08754b;
          color: white;
          box-shadow: 0 7px 18px rgba(0, 0, 0, .2);
          font-weight: 900;
        }

        .map-shell :global(.community-map-draft) {
          width: 38px;
          height: 38px;
          background: #10251b;
          font-size: 22px;
        }

        @media (max-width: 900px) {
          .community-map-page {
            padding: 22px 16px 110px;
          }

          .community-map-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .map-layout {
            grid-template-columns: 1fr;
          }

          .discovery-panel {
            min-height: auto;
          }

          .editor-grid {
            grid-template-columns: 1fr;
          }

          .editor-grid .wide {
            grid-column: auto;
          }

          .selected-card,
          .community-map-footer {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
