'use client';

import 'leaflet/dist/leaflet.css';

import {
  completeAdventureStage,
  createAdventure,
  getAdventureProgress,
  getCommunityAdventures,
  getCommunityTrails,
  getMyAdventures,
  getMyCommunities,
  getMyProfile,
  getMyTrails,
  getPublicProfile,
  getPublicProfileAdventures,
  getPublicProfileTrails,
  removeAdventure,
  startAdventure,
  updateAdventure,
  type Adventure,
  type AdventureCategory,
  type AdventureProgress,
  type AdventureStageInput,
  type AdventureStageType,
  type Trail,
} from '@neighbour/api-client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

type Mode = 'PERSONAL' | 'COMMUNITY';

type Props = {
  mode: Mode;
  username?: string;
  communityId?: string;
  communitySlug?: string;
};

type DraftStage = {
  type: AdventureStageType;
  title: string;
  description: string;
  latitude: string;
  longitude: string;
};

const categories: AdventureCategory[] = [
  'FAMILY',
  'NATURE',
  'HISTORY',
  'PHOTOGRAPHY',
  'FITNESS',
  'EXPLORATION',
  'FOOD',
  'COMMUNITY',
  'SEASONAL',
  'OTHER',
];

const stageTypes: AdventureStageType[] = [
  'CHECKPOINT',
  'TASK',
  'CLUE',
  'ACTIVITY',
  'PHOTO',
  'INFORMATION',
];

const emptyStage = (): DraftStage => ({
  type: 'CHECKPOINT',
  title: '',
  description: '',
  latitude: '',
  longitude: '',
});

function token() {
  return localStorage.getItem('accessToken') ?? '';
}

function nice(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function AdventureWorkspace({ mode, username, communityId, communitySlug }: Props) {
  const [items, setItems] = useState<Adventure[]>([]);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [selected, setSelected] = useState<Adventure | null>(null);
  const [progress, setProgress] = useState<AdventureProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeMember, setActiveMember] = useState(mode === 'PERSONAL');
  const [owner, setOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [moderator, setModerator] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [category, setCategory] = useState<AdventureCategory>('EXPLORATION');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'COMMUNITY' | 'PUBLIC'>(
    mode === 'COMMUNITY' ? 'COMMUNITY' : 'PRIVATE',
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [trailId, setTrailId] = useState('');
  const [stages, setStages] = useState<DraftStage[]>([emptyStage()]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [mapRenderVersion, setMapRenderVersion] = useState(0);

  const currentToken = typeof window === 'undefined' ? '' : token();

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');

    try {
      const auth = token();

      if (mode === 'PERSONAL') {
        if (!username) throw new Error('Profile username is required.');

        const publicProfile = await getPublicProfile(username);
        let adventures: Adventure[];
        let availableTrails: Trail[];

        if (auth) {
          const mine = await getMyProfile(auth);
          const isOwner = mine.userId === publicProfile.userId;

          setCurrentUserId(mine.userId);
          setOwner(isOwner);
          setActiveMember(isOwner);

          if (isOwner) {
            adventures = (await getMyAdventures(auth)).filter((item) => item.scope === 'PERSONAL');
            availableTrails = (await getMyTrails(auth)).filter(
              (trail) => trail.scope === 'PERSONAL',
            );
          } else {
            adventures = await getPublicProfileAdventures(username);
            availableTrails = await getPublicProfileTrails(username);
          }
        } else {
          setCurrentUserId(null);
          setOwner(false);
          setActiveMember(false);
          adventures = await getPublicProfileAdventures(username);
          availableTrails = await getPublicProfileTrails(username);
        }

        setItems(adventures);
        setTrails(availableTrails);
        setSelected((current) =>
          current
            ? (adventures.find((item) => item.id === current.id) ?? adventures[0] ?? null)
            : (adventures[0] ?? null),
        );
      } else {
        if (!communityId) throw new Error('Community id is required.');

        const [adventures, communityTrails, memberships, profile] = await Promise.all([
          getCommunityAdventures(auth, communityId),
          getCommunityTrails(auth, communityId),
          getMyCommunities(auth),
          getMyProfile(auth),
        ]);

        const membership =
          memberships.find(
            (item) => item.community.id === communityId || item.community.slug === communitySlug,
          ) ?? null;

        const normalizedMembership =
          membership?.role === 'OWNER' ? { ...membership, status: 'ACTIVE' as const } : membership;

        const active = normalizedMembership?.status === 'ACTIVE';
        const role = normalizedMembership?.role;

        setCurrentUserId(profile.userId);
        setOwner(false);
        setActiveMember(active);
        setModerator(Boolean(active && role && ['OWNER', 'ADMIN', 'MODERATOR'].includes(role)));
        setItems(adventures);
        setTrails(communityTrails);
        setSelected((current) =>
          current
            ? (adventures.find((item) => item.id === current.id) ?? adventures[0] ?? null)
            : (adventures[0] ?? null),
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Adventures could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [mode, username, communityId, communitySlug]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selected || !currentToken) {
      setProgress(null);
      return;
    }

    void getAdventureProgress(currentToken, selected.id)
      .then(setProgress)
      .catch(() => setProgress(null));
  }, [selected?.id, currentToken]);

  useEffect(() => {
    if (loading) return;
    if (mode === 'COMMUNITY' && !activeMember) return;
    if (!mapContainerRef.current || mapRef.current) return;

    let cancelled = false;

    void import('leaflet').then((L) => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current, { zoomControl: true }).setView(
        [53.4808, -2.2426],
        13,
      );

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setMapRenderVersion((value) => value + 1);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [loading, mode, activeMember]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    let cancelled = false;

    void import('leaflet').then((L) => {
      if (cancelled || mapRef.current !== map || layerRef.current !== layer) return;

      layer.clearLayers();

      if (!selected) return;

      const points: [number, number][] = [];

      selected.stages
        .filter((stage) => stage.latitude !== null && stage.longitude !== null)
        .sort((a, b) => a.position - b.position)
        .forEach((stage) => {
          const point: [number, number] = [Number(stage.latitude), Number(stage.longitude)];

          points.push(point);

          L.marker(point)
            .bindPopup(
              `<strong>${stage.position + 1}. ${stage.title}</strong><br/>${nice(stage.type)}`,
            )
            .addTo(layer);
        });

      if (points.length > 1) {
        L.polyline(points).addTo(layer);
      }

      if (points.length === 1) {
        map.setView(points[0], 15);
      } else if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points).pad(0.2), { maxZoom: 15 });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selected, mapRenderVersion]);

  function resetForm() {
    setCategory('EXPLORATION');
    setTitle('');
    setDescription('');
    setVisibility(mode === 'COMMUNITY' ? 'COMMUNITY' : 'PRIVATE');
    setEstimatedMinutes('');
    setTrailId('');
    setStages([emptyStage()]);
  }

  function beginCreate() {
    resetForm();
    setEditing(false);
    setCreating(true);
  }

  function beginEdit() {
    if (!selected) return;

    setCategory(selected.category);
    setTitle(selected.title);
    setDescription(selected.description);
    setVisibility(selected.visibility);
    setEstimatedMinutes(
      selected.estimatedMinutes === null ? '' : String(selected.estimatedMinutes),
    );
    setTrailId(selected.trailId ?? '');
    setStages(
      selected.stages.map((stage) => ({
        type: stage.type,
        title: stage.title,
        description: stage.description ?? '',
        latitude: stage.latitude === null ? '' : String(stage.latitude),
        longitude: stage.longitude === null ? '' : String(stage.longitude),
      })),
    );
    setCreating(false);
    setEditing(true);
  }

  function updateStage(index: number, patch: Partial<DraftStage>) {
    setStages((current) =>
      current.map((stage, position) => (position === index ? { ...stage, ...patch } : stage)),
    );
  }

  function stagePayload(): AdventureStageInput[] {
    return stages.map((stage, position) => {
      const latitude = stage.latitude.trim();
      const longitude = stage.longitude.trim();

      if ((latitude && !longitude) || (!latitude && longitude)) {
        throw new Error(`Stage ${position + 1} needs both latitude and longitude.`);
      }

      return {
        position,
        type: stage.type,
        title: stage.title.trim(),
        description: stage.description.trim() || undefined,
        ...(latitude && longitude
          ? {
              latitude: Number(latitude),
              longitude: Number(longitude),
            }
          : {}),
      };
    });
  }

  async function save() {
    if (!title.trim() || !description.trim()) {
      setMessage('Give the adventure a title and description.');
      return;
    }

    if (stages.some((stage) => !stage.title.trim())) {
      setMessage('Every adventure stage needs a title.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const auth = token();
      const payload = {
        category,
        title: title.trim(),
        description: description.trim(),
        visibility,
        trailId: trailId || undefined,
        estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : undefined,
        stages: stagePayload(),
      };

      let saved: Adventure;

      if (editing && selected) {
        saved = await updateAdventure(auth, selected.id, payload);
      } else {
        saved = await createAdventure(auth, {
          ...payload,
          scope: mode,
          communityId: mode === 'COMMUNITY' ? communityId : undefined,
        });
      }

      await load();
      setSelected(saved);
      setCreating(false);
      setEditing(false);
      setMessage(editing ? 'Adventure updated.' : 'Adventure created.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Adventure could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selected) return;
    if (!window.confirm(`Remove "${selected.title}"?`)) return;

    try {
      await removeAdventure(token(), selected.id);
      setSelected(null);
      setProgress(null);
      await load();
      setMessage('Adventure removed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Adventure could not be removed.');
    }
  }

  async function start() {
    if (!selected) return;

    try {
      const next = await startAdventure(token(), selected.id);
      setProgress(next);
      setMessage(
        next.completedAt
          ? 'Adventure complete.'
          : next.completedStages.length
            ? 'Adventure resumed.'
            : 'Adventure started.',
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Adventure could not be started.');
    }
  }

  async function complete(position: number) {
    if (!selected) return;

    try {
      const next = await completeAdventureStage(token(), selected.id, position);
      setProgress(next);
      setMessage(next.completedAt ? 'Adventure complete!' : 'Stage complete.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Stage could not be completed.');
    }
  }

  const selectedMine = Boolean(selected && currentUserId && selected.creatorId === currentUserId);

  const canCreate = mode === 'PERSONAL' ? owner : activeMember;
  const canEdit = Boolean(selected && selectedMine && canCreate);
  const canRemove = canEdit || Boolean(selected && mode === 'COMMUNITY' && moderator);

  const returnHref =
    mode === 'COMMUNITY'
      ? `/community/${encodeURIComponent(communitySlug ?? '')}/map`
      : `/profile/${encodeURIComponent(username ?? '')}/map`;

  if (loading) {
    return (
      <main className="adventure-page">
        <p>Loading adventures…</p>
      </main>
    );
  }

  if (mode === 'COMMUNITY' && !activeMember) {
    return (
      <main className="adventure-page">
        <h1>Community Adventures</h1>
        <p>Active community membership is required.</p>
        <Link href={returnHref}>← Back to community map</Link>
      </main>
    );
  }

  return (
    <main className="adventure-page">
      <section className="heading">
        <div>
          <div className="eyebrow">
            {mode === 'COMMUNITY' ? 'COMMUNITY' : 'PERSONAL'} ADVENTURES
          </div>
          <h1>Adventures</h1>
          <p>Follow an experience stage by stage. Progress is saved to your account.</p>
        </div>

        {canCreate ? (
          <button className="primary" onClick={beginCreate}>
            Create Adventure
          </button>
        ) : null}
      </section>

      {message ? <div className="message">{message}</div> : null}

      <section className="layout">
        <aside className="list">
          <strong>
            {items.length} adventure{items.length === 1 ? '' : 's'}
          </strong>

          {items.length === 0 ? (
            <div className="empty">
              <p>No adventures here yet.</p>
              {activeMember ? (
                <button onClick={beginCreate}>Create the first adventure</button>
              ) : null}
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                className={selected?.id === item.id ? 'item selected' : 'item'}
                onClick={() => setSelected(item)}
              >
                <strong>{item.title}</strong>
                <span>
                  {nice(item.category)} · {item.stages.length} stages
                </span>
              </button>
            ))
          )}
        </aside>

        <section className="experience">
          <div className="map-shell">
            <div ref={mapContainerRef} className="leaflet-map" />
          </div>

          {selected ? (
            <article className="detail">
              <div className="detail-head">
                <div>
                  <div className="eyebrow">{nice(selected.category)}</div>
                  <h2>{selected.title}</h2>
                </div>

                <div className="actions">
                  {canEdit ? <button onClick={beginEdit}>Edit</button> : null}
                  {canRemove ? <button onClick={remove}>Remove</button> : null}
                </div>
              </div>

              <p>{selected.description}</p>

              <div className="meta">
                <span>{selected.visibility}</span>
                <span>{selected.stages.length} stages</span>
                {selected.estimatedMinutes ? (
                  <span>About {selected.estimatedMinutes} min</span>
                ) : null}
                {selected.trailId ? <span>Linked trail</span> : null}
              </div>

              {!progress ? (
                <button className="start" onClick={start}>
                  Start Adventure
                </button>
              ) : progress.completedAt ? (
                <div className="complete-box">
                  <strong>Adventure complete ✓</strong>
                  <button onClick={start}>Start again</button>
                </div>
              ) : (
                <div className="progress-box">
                  <strong>
                    {progress.completedStages.length} / {selected.stages.length} stages complete
                  </strong>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.round(
                          (progress.completedStages.length / Math.max(selected.stages.length, 1)) *
                            100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="stages">
                {[...selected.stages]
                  .sort((a, b) => a.position - b.position)
                  .map((stage) => {
                    const done = progress?.completedStages.includes(stage.position) ?? false;
                    const current = progress?.currentStagePosition === stage.position;
                    const enabled = Boolean(progress && !progress.completedAt && (current || done));

                    return (
                      <div
                        key={stage.id}
                        className={done ? 'stage done' : current ? 'stage current' : 'stage'}
                      >
                        <div className="stage-number">{done ? '✓' : stage.position + 1}</div>
                        <div className="stage-body">
                          <span>{nice(stage.type)}</span>
                          <strong>{stage.title}</strong>
                          {stage.description ? <p>{stage.description}</p> : null}
                          {current && !done && enabled ? (
                            <button onClick={() => complete(stage.position)}>Complete stage</button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </article>
          ) : (
            <div className="empty detail-empty">Select an adventure to explore it.</div>
          )}
        </section>
      </section>

      {creating || editing ? (
        <section className="editor">
          <div className="editor-head">
            <h2>{editing ? 'Edit Adventure' : 'Create Adventure'}</h2>
            <button
              onClick={() => {
                setCreating(false);
                setEditing(false);
              }}
            >
              Cancel
            </button>
          </div>

          <div className="form-grid">
            <label>
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
              />
            </label>

            <label>
              Category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as AdventureCategory)}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {nice(item)}
                  </option>
                ))}
              </select>
            </label>

            <label className="wide">
              Description
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
              />
            </label>

            <label>
              Visibility
              <select
                value={visibility}
                onChange={(event) =>
                  setVisibility(event.target.value as 'PRIVATE' | 'COMMUNITY' | 'PUBLIC')
                }
              >
                <option value="PRIVATE">Private</option>
                {mode === 'PERSONAL' ? <option value="PUBLIC">Public</option> : null}
                {mode === 'COMMUNITY' ? <option value="COMMUNITY">Community</option> : null}
              </select>
            </label>

            <label>
              Estimated minutes
              <input
                type="number"
                min="1"
                value={estimatedMinutes}
                onChange={(event) => setEstimatedMinutes(event.target.value)}
              />
            </label>

            <label className="wide">
              Linked trail
              <select value={trailId} onChange={(event) => setTrailId(event.target.value)}>
                <option value="">No linked trail</option>
                {trails.map((trail) => (
                  <option key={trail.id} value={trail.id}>
                    {trail.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="stage-editor">
            <div className="stage-editor-head">
              <h3>Adventure stages</h3>
              <button onClick={() => setStages((current) => [...current, emptyStage()])}>
                Add stage
              </button>
            </div>

            {stages.map((stage, index) => (
              <div className="stage-form" key={index}>
                <strong>Stage {index + 1}</strong>

                <select
                  value={stage.type}
                  onChange={(event) =>
                    updateStage(index, { type: event.target.value as AdventureStageType })
                  }
                >
                  {stageTypes.map((item) => (
                    <option key={item} value={item}>
                      {nice(item)}
                    </option>
                  ))}
                </select>

                <input
                  placeholder="Stage title"
                  value={stage.title}
                  onChange={(event) => updateStage(index, { title: event.target.value })}
                />

                <textarea
                  placeholder="Instructions, clue or information"
                  value={stage.description}
                  onChange={(event) => updateStage(index, { description: event.target.value })}
                />

                <div className="coords">
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude (optional)"
                    value={stage.latitude}
                    onChange={(event) => updateStage(index, { latitude: event.target.value })}
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude (optional)"
                    value={stage.longitude}
                    onChange={(event) => updateStage(index, { longitude: event.target.value })}
                  />
                </div>

                {stages.length > 1 ? (
                  <button
                    className="danger"
                    onClick={() =>
                      setStages((current) => current.filter((_, position) => position !== index))
                    }
                  >
                    Remove stage
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          <button className="primary save" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : editing ? 'Save Adventure' : 'Create Adventure'}
          </button>
        </section>
      ) : null}

      <footer>
        <Link href={returnHref}>
          ← Back to {mode === 'COMMUNITY' ? 'community' : 'personal'} map
        </Link>
        <p>
          Adventures stay within their Personal or Community Map context and do not automatically
          enter Nearby.
        </p>
      </footer>

      <style jsx>{`
        .adventure-page {
          max-width: 1420px;
          margin: 0 auto;
          padding: 32px;
          color: #10251b;
        }
        .heading,
        .detail-head,
        .editor-head,
        .stage-editor-head {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          align-items: center;
        }
        .eyebrow {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.14em;
          opacity: 0.62;
        }
        h1 {
          font-size: 42px;
          margin: 6px 0;
        }
        h2 {
          margin: 4px 0;
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
        .primary,
        .start {
          border: 0;
          border-radius: 999px;
          padding: 12px 18px;
          background: #10251b;
          color: white;
          font-weight: 800;
        }

        .editor button.primary {
          border-color: #10251b;
          background: #10251b;
          color: white;
        }

        input,
        textarea,
        select {
          color: #10251b;
          background: white;
        }

        input::placeholder,
        textarea::placeholder {
          color: #66776e;
          opacity: 1;
        }
        .message {
          margin: 18px 0;
          padding: 12px 16px;
          border-radius: 14px;
          background: #eef5f0;
        }
        .layout {
          display: grid;
          grid-template-columns: 300px 1fr;
          gap: 22px;
          margin-top: 24px;
        }
        .list,
        .detail,
        .editor {
          background: white;
          border: 1px solid #dfe8e2;
          border-radius: 22px;
          padding: 18px;
        }
        .list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-self: start;
        }
        .item {
          text-align: left;
          border: 1px solid #e1e8e3;
          background: white;
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .item.selected {
          border-color: #10251b;
          background: #f1f6f3;
        }
        .item span {
          font-size: 13px;
          opacity: 0.65;
        }
        .experience {
          min-width: 0;
        }
        .map-shell {
          height: 430px;
          overflow: hidden;
          border-radius: 22px;
          border: 1px solid #dfe8e2;
          background: #edf3ef;
        }
        .leaflet-map {
          height: 100%;
          width: 100%;
        }
        .detail {
          margin-top: 18px;
        }
        .actions {
          display: flex;
          gap: 8px;
        }
        .actions button,
        .editor button,
        .stage button,
        .empty button {
          border: 1px solid #cad8cf;
          background: white;
          border-radius: 999px;
          padding: 8px 12px;
        }
        .meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 16px 0;
        }
        .meta span {
          padding: 7px 10px;
          background: #eef4f0;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
        }
        .progress-box,
        .complete-box {
          margin: 18px 0;
          padding: 16px;
          border-radius: 16px;
          background: #f0f6f2;
        }
        .complete-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .progress-track {
          height: 9px;
          border-radius: 999px;
          background: #dce7df;
          margin-top: 10px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #10251b;
        }
        .stages {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 20px;
        }
        .stage {
          display: flex;
          gap: 14px;
          padding: 15px;
          border: 1px solid #dfe8e2;
          border-radius: 16px;
          opacity: 0.65;
        }
        .stage.current {
          opacity: 1;
          border-color: #10251b;
        }
        .stage.done {
          opacity: 1;
          background: #f1f7f3;
        }
        .stage-number {
          width: 34px;
          height: 34px;
          flex: 0 0 34px;
          border-radius: 50%;
          background: #10251b;
          color: white;
          display: grid;
          place-items: center;
          font-weight: 900;
        }
        .stage-body {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .stage-body > span {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
          opacity: 0.55;
        }
        .stage-body p {
          margin: 3px 0;
        }
        .editor {
          margin-top: 24px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 18px;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 7px;
          font-size: 13px;
          font-weight: 800;
        }
        .wide {
          grid-column: 1 / -1;
        }
        input,
        textarea,
        select {
          border: 1px solid #cad8cf;
          border-radius: 12px;
          padding: 11px;
          background: white;
        }
        .stage-editor {
          margin-top: 24px;
        }
        .stage-form {
          margin-top: 12px;
          padding: 15px;
          border: 1px solid #dfe8e2;
          border-radius: 16px;
          display: grid;
          gap: 10px;
        }
        .coords {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .danger {
          justify-self: start;
        }
        .save {
          margin-top: 20px;
        }
        footer {
          margin-top: 28px;
          padding: 20px 0;
          border-top: 1px solid #dfe8e2;
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }
        footer p {
          margin: 0;
          opacity: 0.62;
        }
        @media (max-width: 850px) {
          .adventure-page {
            padding: 18px;
          }
          .layout {
            grid-template-columns: 1fr;
          }
          .form-grid,
          .coords {
            grid-template-columns: 1fr;
          }
          .wide {
            grid-column: auto;
          }
          .heading,
          footer {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <style jsx global>{`
        .map-shell .leaflet-container {
          height: 100%;
          width: 100%;
        }
      `}</style>
    </main>
  );
}
