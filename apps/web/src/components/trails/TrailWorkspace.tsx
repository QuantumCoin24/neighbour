'use client';

import {
  createTrail,
  getCommunity,
  getCommunityTrails,
  getMyCommunities,
  getMyProfile,
  getMyTrails,
  getPublicProfile,
  getPublicProfileTrails,
  removeTrail,
  updateTrail,
  type CommunityMembership,
  type Trail,
  type TrailCategory,
  type TrailCheckpointInput,
  type TrailVisibility,
} from '@neighbour/api-client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type { LayerGroup, Map as LeafletMap } from 'leaflet';

const categories: Array<{ value: TrailCategory; label: string }> = [
  { value: 'WALKING', label: 'Walking' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'CYCLING', label: 'Cycling' },
  { value: 'FAMILY', label: 'Family' },
  { value: 'NATURE', label: 'Nature' },
  { value: 'HISTORY', label: 'History' },
  { value: 'PHOTOGRAPHY', label: 'Photography' },
  { value: 'FOOD', label: 'Food' },
  { value: 'DOG_WALKING', label: 'Dog walking' },
  { value: 'ACCESSIBLE', label: 'Accessible' },
  { value: 'COMMUNITY', label: 'Community' },
  { value: 'OTHER', label: 'Other' },
];

type Mode = 'PERSONAL' | 'COMMUNITY';

interface TrailWorkspaceProps {
  mode: Mode;
  username?: string;
  slug?: string;
  backHref: string;
}

function categoryLabel(category: TrailCategory) {
  return categories.find((item) => item.value === category)?.label ?? 'Trail';
}

function checkpointPath(trail: Trail) {
  return [...trail.checkpoints]
    .sort((a, b) => a.position - b.position)
    .map((checkpoint) => [checkpoint.latitude, checkpoint.longitude] as [number, number]);
}

function formatDistance(distanceM: number | null) {
  if (distanceM === null) return null;
  if (distanceM >= 1000) return `Approx. ${(distanceM / 1000).toFixed(1)} km`;
  return `Approx. ${distanceM} m`;
}

export default function TrailWorkspace({ mode, username, slug, backHref }: TrailWorkspaceProps) {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [membership, setMembership] = useState<CommunityMembership | null>(null);
  const [owner, setOwner] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const [heading, setHeading] = useState('Trails');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('Loading trails…');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TrailCategory>('WALKING');
  const [visibility, setVisibility] = useState<TrailVisibility>(
    mode === 'PERSONAL' ? 'PRIVATE' : 'COMMUNITY',
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [checkpoints, setCheckpoints] = useState<TrailCheckpointInput[]>([]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const creatingRef = useRef(false);
  const editingRef = useRef(false);
  const [mapRenderVersion, setMapRenderVersion] = useState(0);

  creatingRef.current = creating;
  editingRef.current = editing;

  const selected = trails.find((trail) => trail.id === selectedId) ?? null;
  const activeMember = membership?.status === 'ACTIVE';
  const moderator =
    membership?.role === 'OWNER' ||
    membership?.role === 'ADMIN' ||
    membership?.role === 'MODERATOR';

  async function load() {
    setLoading(true);
    setMessage('Loading trails…');

    try {
      const token = localStorage.getItem('accessToken');

      if (mode === 'PERSONAL') {
        if (!username) throw new Error('Profile unavailable.');

        const publicProfile = await getPublicProfile(username);
        setHeading(`${publicProfile.displayName}'s trails`);

        if (token) {
          const mine = await getMyProfile(token);
          const isOwner = mine.userId === publicProfile.userId;
          setCurrentUserId(mine.userId);
          setOwner(isOwner);
          setCanCreate(isOwner);

          const result = isOwner
            ? await getMyTrails(token)
            : await getPublicProfileTrails(username);

          setTrails(result.filter((trail) => trail.scope === 'PERSONAL'));
        } else {
          setOwner(false);
          setCanCreate(false);
          setTrails(await getPublicProfileTrails(username));
        }
      } else {
        if (!slug) throw new Error('Community unavailable.');
        if (!token) {
          setMessage('Sign in to view community trails.');
          setTrails([]);
          setLoading(false);
          return;
        }

        const community = await getCommunity(token, slug);
        const [memberships, profile] = await Promise.all([
          getMyCommunities(token),
          getMyProfile(token),
        ]);

        setHeading(`${community.name} trails`);
        setCommunityId(community.id);
        setCurrentUserId(profile.userId);

        const ownMembership =
          memberships.find(
            (item) => item.community.id === community.id || item.community.slug === community.slug,
          ) ?? null;

        const normalizedMembership =
          ownMembership?.role === 'OWNER'
            ? { ...ownMembership, status: 'ACTIVE' as const }
            : ownMembership;

        setMembership(normalizedMembership);
        const active = normalizedMembership?.status === 'ACTIVE';
        setCanCreate(active);

        if (!active) {
          setTrails([]);
          setMessage('Join this community to view and create its trails.');
          setLoading(false);
          return;
        }

        setTrails(await getCommunityTrails(token, community.id));
      }

      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Trails could not be loaded.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [mode, username, slug]);

  useEffect(() => {
    if (loading) return;
    if (mode === 'COMMUNITY' && !activeMember) return;
    if (!mapContainerRef.current || mapRef.current) return;

    void import('leaflet').then((L) => {
      if (!mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
      }).setView([53.4808, -2.2426], 13);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      const layer = L.layerGroup().addTo(map);
      mapRef.current = map;
      layerRef.current = layer;
      setMapRenderVersion((version) => version + 1);

      map.on('click', (event) => {
        if (!creatingRef.current && !editingRef.current) return;

        setCheckpoints((current) => [
          ...current,
          {
            position: current.length,
            latitude: event.latlng.lat,
            longitude: event.latlng.lng,
            title: `Checkpoint ${current.length + 1}`,
          },
        ]);
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [loading, mode, activeMember]);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;

    void import('leaflet').then((L) => {
      const map = mapRef.current;
      const layer = layerRef.current;
      if (!map || !layer) return;

      layer.clearLayers();

      const path =
        selected && !creating && !editing
          ? checkpointPath(selected)
          : checkpoints.map(
              (checkpoint) => [checkpoint.latitude, checkpoint.longitude] as [number, number],
            );

      if (path.length > 1) {
        L.polyline(path, {
          weight: 5,
          opacity: 0.8,
        }).addTo(layer);
      }

      path.forEach((point, index) => {
        L.marker(point, {
          icon: L.divIcon({
            className: 'trail-checkpoint-marker',
            html: `<span>${index + 1}</span>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          }),
        }).addTo(layer);
      });

      if (path.length === 1) {
        map.setView(path[0], 15);
      } else if (path.length > 1) {
        map.fitBounds(L.latLngBounds(path), {
          padding: [45, 45],
          maxZoom: 16,
        });
      }
    });
  }, [selected, checkpoints, creating, editing, mapRenderVersion]);

  function resetEditor() {
    setTitle('');
    setDescription('');
    setCategory('WALKING');
    setVisibility(mode === 'PERSONAL' ? 'PRIVATE' : 'COMMUNITY');
    setEstimatedMinutes('');
    setCheckpoints([]);
    setCreating(false);
    setEditing(false);
  }

  function beginCreate() {
    setSelectedId(null);
    resetEditor();
    setCreating(true);
    setMessage('Click the map to place checkpoint 1, then checkpoint 2.');
  }

  function beginEdit(trail: Trail) {
    setCreating(false);
    setEditing(true);
    setTitle(trail.title);
    setDescription(trail.description);
    setCategory(trail.category);
    setVisibility(trail.visibility);
    setEstimatedMinutes(trail.estimatedMinutes?.toString() ?? '');
    setCheckpoints(
      [...trail.checkpoints]
        .sort((a, b) => a.position - b.position)
        .map((checkpoint, index) => ({
          mapDiscoveryId: checkpoint.mapDiscoveryId ?? undefined,
          position: index,
          title: checkpoint.title ?? undefined,
          instruction: checkpoint.instruction ?? undefined,
          latitude: checkpoint.latitude,
          longitude: checkpoint.longitude,
        })),
    );
    setMessage('Edit the trail or click the map to add another checkpoint.');
  }

  function removeCheckpoint(position: number) {
    setCheckpoints((current) =>
      current
        .filter((checkpoint) => checkpoint.position !== position)
        .map((checkpoint, index) => ({ ...checkpoint, position: index })),
    );
  }

  async function save() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setMessage('Sign in to save a trail.');
      return;
    }

    if (!title.trim() || !description.trim()) {
      setMessage('Add a trail name and description.');
      return;
    }

    if (checkpoints.length < 2) {
      setMessage('A trail needs at least two checkpoints.');
      return;
    }

    setSaving(true);
    setMessage('Saving trail…');

    try {
      const duration = estimatedMinutes.trim() ? Number.parseInt(estimatedMinutes, 10) : undefined;

      let saved: Trail;

      if (editing && selected) {
        saved = await updateTrail(token, selected.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          visibility,
          estimatedMinutes:
            duration && Number.isFinite(duration) && duration > 0 ? duration : undefined,
          checkpoints,
        });
      } else {
        saved = await createTrail(token, {
          scope: mode,
          communityId: mode === 'COMMUNITY' ? (communityId ?? undefined) : undefined,
          title: title.trim(),
          description: description.trim(),
          category,
          visibility,
          estimatedMinutes:
            duration && Number.isFinite(duration) && duration > 0 ? duration : undefined,
          checkpoints,
        });
      }

      resetEditor();
      await load();
      setSelectedId(saved.id);
      setMessage(editing ? 'Trail updated.' : 'Trail created.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The trail could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(trail: Trail) {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    setRemoving(true);
    setMessage('Removing trail…');

    try {
      await removeTrail(token, trail.id);
      setSelectedId(null);
      resetEditor();
      await load();
      setMessage('Trail removed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The trail could not be removed.');
    } finally {
      setRemoving(false);
    }
  }

  const canEditSelected =
    selected !== null && currentUserId !== null && selected.creatorId === currentUserId;

  const canRemoveSelected =
    canEditSelected || (mode === 'COMMUNITY' && Boolean(activeMember && moderator));

  return (
    <main className="trail-page">
      <header className="trail-header">
        <div>
          <Link href={backHref} className="back-link">
            ← Back to map
          </Link>
          <span className="eyebrow">
            {mode === 'PERSONAL' ? 'PERSONAL MAP · TRAILS' : 'COMMUNITY MAP · TRAILS'}
          </span>
          <h1>{heading}</h1>
          <p>
            Follow an ordered checkpoint path created deliberately for this map. Trail lines connect
            checkpoints in sequence and are not turn-by-turn navigation.
          </p>
        </div>

        {canCreate && !creating && !editing ? (
          <button type="button" className="primary-button" onClick={beginCreate}>
            Create trail
          </button>
        ) : null}
      </header>

      {message ? <div className="message">{message}</div> : null}

      {!loading && mode === 'COMMUNITY' && !activeMember ? (
        <section className="locked-card">
          <span>TRAILS</span>
          <h2>Community members only</h2>
          <p>Join this community to view and contribute trails.</p>
          <Link href={backHref}>Back to community map</Link>
        </section>
      ) : null}

      {!loading && (mode === 'PERSONAL' || activeMember) ? (
        <section className="workspace">
          <aside className="trail-list">
            <div className="list-heading">
              <span>TRAILS</span>
              <strong>{trails.length}</strong>
            </div>

            {trails.length === 0 ? (
              <div className="empty-state">
                <strong>No trails yet.</strong>
                <p>
                  {canCreate
                    ? 'Create the first route by placing at least two ordered checkpoints.'
                    : 'There are no trails available here yet.'}
                </p>
                {canCreate ? (
                  <button type="button" onClick={beginCreate}>
                    Create first trail
                  </button>
                ) : null}
              </div>
            ) : (
              trails.map((trail) => (
                <button
                  key={trail.id}
                  type="button"
                  className={selectedId === trail.id ? 'trail-row selected' : 'trail-row'}
                  onClick={() => {
                    resetEditor();
                    setSelectedId(trail.id);
                  }}
                >
                  <span className="trail-symbol">↝</span>
                  <span>
                    <strong>{trail.title}</strong>
                    <small>
                      {categoryLabel(trail.category)} · {trail.checkpoints.length} checkpoints
                    </small>
                  </span>
                </button>
              ))
            )}
          </aside>

          <div className="map-column">
            <div className="map-shell">
              <div ref={mapContainerRef} className="trail-map" />
              {(creating || editing) && checkpoints.length < 2 ? (
                <div className="map-hint">
                  Click the map to place checkpoint {checkpoints.length + 1}.
                </div>
              ) : null}
            </div>

            {creating || editing ? (
              <section className="editor-card">
                <div className="editor-heading">
                  <div>
                    <span>{editing ? 'EDIT TRAIL' : 'NEW TRAIL'}</span>
                    <h2>{editing ? 'Refine this trail' : 'Build a checkpoint path'}</h2>
                  </div>
                  <strong>{checkpoints.length} checkpoints</strong>
                </div>

                <div className="form-grid">
                  <label className="wide">
                    <span>Name</span>
                    <input
                      value={title}
                      maxLength={120}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="Sunday woodland loop"
                    />
                  </label>

                  <label>
                    <span>Category</span>
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value as TrailCategory)}
                    >
                      {categories.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Visibility</span>
                    <select
                      value={visibility}
                      onChange={(event) => setVisibility(event.target.value as TrailVisibility)}
                    >
                      <option value="PRIVATE">Private</option>
                      {mode === 'PERSONAL' ? (
                        <option value="PUBLIC">Public</option>
                      ) : (
                        <option value="COMMUNITY">Community</option>
                      )}
                    </select>
                  </label>

                  <label>
                    <span>Estimated time · minutes</span>
                    <input
                      type="number"
                      min="1"
                      max="10080"
                      value={estimatedMinutes}
                      onChange={(event) => setEstimatedMinutes(event.target.value)}
                      placeholder="45"
                    />
                  </label>

                  <label className="wide">
                    <span>Description</span>
                    <textarea
                      value={description}
                      maxLength={2000}
                      rows={4}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="What should someone know before following this trail?"
                    />
                  </label>
                </div>

                <div className="checkpoint-editor">
                  <div className="checkpoint-heading">
                    <strong>Ordered checkpoints</strong>
                    <span>Click the map to add another.</span>
                  </div>

                  {checkpoints.map((checkpoint, index) => (
                    <div
                      className="checkpoint-row"
                      key={`${checkpoint.latitude}-${checkpoint.longitude}-${index}`}
                    >
                      <span className="checkpoint-number">{index + 1}</span>
                      <input
                        value={checkpoint.title ?? ''}
                        maxLength={120}
                        onChange={(event) =>
                          setCheckpoints((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, title: event.target.value } : item,
                            ),
                          )
                        }
                        placeholder={`Checkpoint ${index + 1}`}
                      />
                      <input
                        value={checkpoint.instruction ?? ''}
                        maxLength={500}
                        onChange={(event) =>
                          setCheckpoints((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, instruction: event.target.value }
                                : item,
                            ),
                          )
                        }
                        placeholder="Optional instruction"
                      />
                      <button type="button" onClick={() => removeCheckpoint(checkpoint.position)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="editor-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={saving}
                    onClick={() => {
                      resetEditor();
                      setMessage('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={
                      saving || !title.trim() || !description.trim() || checkpoints.length < 2
                    }
                    onClick={() => void save()}
                  >
                    {saving ? 'Saving…' : editing ? 'Save changes' : 'Create trail'}
                  </button>
                </div>
              </section>
            ) : selected ? (
              <section className="detail-card">
                <div className="detail-heading">
                  <div>
                    <span>{categoryLabel(selected.category).toUpperCase()}</span>
                    <h2>{selected.title}</h2>
                  </div>
                  <span className="visibility">{selected.visibility}</span>
                </div>

                <p>{selected.description}</p>

                <div className="metadata">
                  <span>{selected.checkpoints.length} checkpoints</span>
                  {selected.estimatedMinutes ? (
                    <span>About {selected.estimatedMinutes} min</span>
                  ) : null}
                  {formatDistance(selected.distanceM) ? (
                    <span>{formatDistance(selected.distanceM)}</span>
                  ) : null}
                </div>

                <div className="checkpoint-detail-list">
                  {[...selected.checkpoints]
                    .sort((a, b) => a.position - b.position)
                    .map((checkpoint, index) => (
                      <div className="checkpoint-detail" key={checkpoint.id}>
                        <span className="checkpoint-number">{index + 1}</span>
                        <div>
                          <strong>{checkpoint.title || `Checkpoint ${index + 1}`}</strong>
                          {checkpoint.instruction ? <p>{checkpoint.instruction}</p> : null}
                        </div>
                      </div>
                    ))}
                </div>

                {canEditSelected || canRemoveSelected ? (
                  <div className="detail-actions">
                    {canEditSelected ? (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => beginEdit(selected)}
                      >
                        Edit trail
                      </button>
                    ) : null}

                    {canRemoveSelected ? (
                      <button
                        type="button"
                        className="danger-button"
                        disabled={removing}
                        onClick={() => void remove(selected)}
                      >
                        {removing ? 'Removing…' : 'Remove trail'}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : (
              <section className="detail-card intro-card">
                <span>TRAIL EXPERIENCE</span>
                <h2>Select a trail</h2>
                <p>
                  Choose a trail to see its ordered checkpoint path, route information and
                  instructions.
                </p>
              </section>
            )}
          </div>
        </section>
      ) : null}

      <footer className="trail-footer">
        <Link href={backHref}>← Return to map</Link>
        <span>
          {mode === 'PERSONAL'
            ? 'Personal Trails remain separate from Nearby.'
            : 'Community Trails remain inside this community and do not automatically enter Nearby.'}
        </span>
      </footer>

      <style>{`
        .trail-page {
          width: min(100% - 48px, 1380px);
          margin: 0 auto;
          padding: 38px 0 80px;
          color: #14261d;
        }
        .trail-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 24px;
        }
        .back-link {
          display: block;
          width: fit-content;
          margin-bottom: 22px;
          color: #527064;
          text-decoration: none;
          font-weight: 700;
        }
        .eyebrow,
        .editor-heading span,
        .detail-heading > div > span,
        .intro-card > span,
        .locked-card > span,
        .list-heading > span {
          display: block;
          color: #0e754d;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: .14em;
        }
        .trail-header h1 {
          margin: 7px 0 8px;
          font-size: clamp(34px, 5vw, 58px);
          line-height: .98;
        }
        .trail-header p {
          max-width: 760px;
          margin: 0;
          color: #5c6d64;
          line-height: 1.6;
        }
        button,
        input,
        textarea,
        select {
          font: inherit;
        }
        button {
          cursor: pointer;
        }
        .primary-button,
        .secondary-button,
        .danger-button,
        .empty-state button {
          border: 0;
          border-radius: 999px;
          padding: 12px 18px;
          font-weight: 800;
        }
        .primary-button,
        .empty-state button {
          background: #153f2e;
          color: white;
        }
        .secondary-button {
          background: #e8efe9;
          color: #183d2e;
        }
        .danger-button {
          background: #f7e5e2;
          color: #8b3028;
        }
        .message {
          margin-bottom: 18px;
          border: 1px solid #dce7df;
          border-radius: 16px;
          padding: 13px 16px;
          background: #f7faf8;
          color: #456052;
          font-weight: 700;
        }
        .workspace {
          display: grid;
          grid-template-columns: minmax(250px, 320px) minmax(0, 1fr);
          gap: 22px;
          align-items: start;
        }
        .trail-list,
        .detail-card,
        .editor-card,
        .locked-card {
          border: 1px solid #dce7df;
          border-radius: 24px;
          background: white;
          box-shadow: 0 16px 50px rgba(25, 59, 44, .06);
        }
        .trail-list {
          overflow: hidden;
        }
        .list-heading {
          display: flex;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid #e5ece7;
        }
        .trail-row {
          width: 100%;
          display: flex;
          gap: 13px;
          align-items: center;
          border: 0;
          border-bottom: 1px solid #edf2ee;
          padding: 16px 18px;
          background: white;
          text-align: left;
          color: inherit;
        }
        .trail-row.selected {
          background: #edf6f0;
        }
        .trail-row small {
          display: block;
          margin-top: 4px;
          color: #708077;
        }
        .trail-symbol {
          display: grid;
          width: 36px;
          height: 36px;
          place-items: center;
          border-radius: 50%;
          background: #e7f3eb;
          color: #0e754d;
          font-size: 19px;
        }
        .empty-state {
          padding: 26px 20px;
        }
        .empty-state p {
          color: #6b7b72;
          line-height: 1.5;
        }
        .map-column {
          min-width: 0;
        }
        .map-shell {
          position: relative;
          overflow: hidden;
          border-radius: 26px;
          border: 1px solid #d7e3db;
          background: #e8efe9;
          box-shadow: 0 18px 60px rgba(25, 59, 44, .08);
        }
        .trail-map {
          width: 100%;
          height: 540px;
        }
        .map-hint {
          position: absolute;
          z-index: 500;
          left: 20px;
          bottom: 20px;
          border-radius: 999px;
          padding: 11px 15px;
          background: rgba(20, 38, 29, .92);
          color: white;
          font-weight: 800;
        }
        .editor-card,
        .detail-card {
          margin-top: 20px;
          padding: 24px;
        }
        .editor-heading,
        .detail-heading,
        .checkpoint-heading,
        .editor-actions,
        .detail-actions,
        .metadata {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .editor-heading h2,
        .detail-heading h2,
        .intro-card h2 {
          margin: 5px 0 0;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 22px;
        }
        .form-grid label {
          display: grid;
          gap: 7px;
          font-weight: 800;
        }
        .form-grid .wide {
          grid-column: 1 / -1;
        }
        .form-grid input,
        .form-grid textarea,
        .form-grid select,
        .checkpoint-row input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #ccd9d0;
          border-radius: 13px;
          padding: 11px 12px;
          background: #fbfcfb;
          color: #14261d;
        }
        .checkpoint-editor {
          margin-top: 22px;
        }
        .checkpoint-heading {
          margin-bottom: 12px;
        }
        .checkpoint-heading span {
          color: #708077;
        }
        .checkpoint-row {
          display: grid;
          grid-template-columns: 36px minmax(140px, .8fr) minmax(180px, 1.2fr) auto;
          gap: 10px;
          align-items: center;
          margin-bottom: 9px;
        }
        .checkpoint-row button {
          border: 0;
          background: transparent;
          color: #8b3028;
          font-weight: 800;
        }
        .checkpoint-number {
          display: grid;
          width: 32px;
          height: 32px;
          place-items: center;
          flex: 0 0 auto;
          border-radius: 50%;
          background: #153f2e;
          color: white;
          font-weight: 900;
        }
        .editor-actions,
        .detail-actions {
          justify-content: flex-end;
          margin-top: 22px;
        }
        .detail-card > p,
        .intro-card p {
          color: #5f7167;
          line-height: 1.65;
        }
        .visibility {
          border-radius: 999px;
          padding: 7px 10px;
          background: #edf4ef;
          color: #466154;
          font-size: 12px;
          font-weight: 900;
        }
        .metadata {
          justify-content: flex-start;
          flex-wrap: wrap;
          margin: 18px 0;
        }
        .metadata span {
          border-radius: 999px;
          padding: 8px 11px;
          background: #f0f5f1;
          font-weight: 800;
        }
        .checkpoint-detail-list {
          display: grid;
          gap: 10px;
          margin-top: 20px;
        }
        .checkpoint-detail {
          display: flex;
          gap: 13px;
          align-items: flex-start;
          border-top: 1px solid #e8eee9;
          padding-top: 14px;
        }
        .checkpoint-detail p {
          margin: 5px 0 0;
          color: #68796f;
        }
        .locked-card {
          padding: 34px;
        }
        .locked-card p {
          color: #66776d;
        }
        .locked-card a {
          color: #0e754d;
          font-weight: 800;
        }
        .trail-footer {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          margin-top: 28px;
          color: #697a70;
        }
        .trail-footer a {
          color: #315d48;
          font-weight: 800;
          text-decoration: none;
        }
        :global(.trail-checkpoint-marker) {
          background: transparent;
          border: 0;
        }
        :global(.trail-checkpoint-marker span) {
          display: grid;
          width: 34px;
          height: 34px;
          place-items: center;
          border: 3px solid white;
          border-radius: 50%;
          background: #153f2e;
          color: white;
          box-shadow: 0 4px 16px rgba(0, 0, 0, .25);
          font-weight: 900;
        }
        @media (max-width: 860px) {
          .trail-page {
            width: min(100% - 28px, 1380px);
            padding-top: 24px;
          }
          .trail-header,
          .trail-footer {
            align-items: flex-start;
            flex-direction: column;
          }
          .workspace {
            grid-template-columns: 1fr;
          }
          .trail-list {
            max-height: 330px;
            overflow: auto;
          }
          .trail-map {
            height: 440px;
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
          .form-grid .wide {
            grid-column: auto;
          }
          .checkpoint-row {
            grid-template-columns: 36px 1fr;
          }
          .checkpoint-row input,
          .checkpoint-row button {
            grid-column: 2;
          }
        }
      `}</style>
    </main>
  );
}
