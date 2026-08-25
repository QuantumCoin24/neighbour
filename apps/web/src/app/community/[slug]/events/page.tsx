'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import {
  createEvent,
  getCommunity,
  getCommunityEvents,
  type Community,
  type EventItem,
} from '@neighbour/api-client';

import CommunityTabs from '../../../../components/community/CommunityTabs';
import ReportButton from '../../../../components/security/ReportButton';

const shell: React.CSSProperties = {
  maxWidth: '1160px',
  margin: '0 auto',
  padding: '44px 42px 80px',
};

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid rgba(9, 46, 32, .09)',
  borderRadius: 26,
  boxShadow: '0 18px 45px rgba(31,46,38,.06)',
};

export default function EventsPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  async function load() {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setError('No active session found.');
      setLoading(false);
      return;
    }

    try {
      const c = await getCommunity(token, slug);
      const result = await getCommunityEvents(c.id);

      setCommunity(c);
      setEvents(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load events.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [slug]);

  async function submitEvent(): Promise<void> {
    if (!community || creating) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const start = new Date(startsAt);
    const end = new Date(endsAt);

    if (!token) {
      setCreateError('Your session has expired. Please sign in again.');
      return;
    }

    if (cleanTitle.length < 3) {
      setCreateError('Give the event a title of at least 3 characters.');
      return;
    }

    if (!cleanDescription) {
      setCreateError('Add a short description so neighbours know what the event is about.');
      return;
    }

    if (!startsAt || Number.isNaN(start.getTime())) {
      setCreateError('Enter a valid start date and time.');
      return;
    }

    if (!endsAt || Number.isNaN(end.getTime())) {
      setCreateError('Enter a valid end date and time.');
      return;
    }

    if (end.getTime() <= start.getTime()) {
      setCreateError('The event must finish after it starts.');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      await createEvent(token, {
        communityId: community.id,
        title: cleanTitle,
        description: cleanDescription,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
      });

      setTitle('');
      setDescription('');
      setStartsAt('');
      setEndsAt('');
      setCreateOpen(false);

      await load();
    } catch (caughtError) {
      setCreateError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The event could not be created. Please try again.',
      );
    } finally {
      setCreating(false);
    }
  }

  const sortedEvents = useMemo(
    () =>
      [...events].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [events],
  );

  if (loading) {
    return <main style={shell}>Loading community events…</main>;
  }

  return (
    <main style={shell}>
      <section
        style={{
          borderRadius: 30,
          padding: '34px 36px',
          marginBottom: 24,
          color: '#fff',
          background: 'linear-gradient(135deg, #071426 0%, #102d4a 100%)',
        }}
      >
        <div
          style={{
            color: '#8ee8bf',
            fontSize: 12,
            fontWeight: 850,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
          }}
        >
          Local calendar
        </div>

        <div
          style={{
            marginTop: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'end',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(34px,4vw,54px)',
                lineHeight: 1,
              }}
            >
              Events
            </h1>

            <p
              style={{
                margin: '12px 0 0',
                color: 'rgba(255,255,255,.75)',
                fontSize: 17,
              }}
            >
              {community
                ? `What's happening around ${community.name}.`
                : 'What’s happening in your local community.'}
            </p>
          </div>

          <div
            style={{
              minWidth: 150,
              padding: '17px 20px',
              borderRadius: 20,
              background: 'rgba(255,255,255,.08)',
              border: '1px solid rgba(255,255,255,.12)',
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 850 }}>{events.length}</div>
            <div style={{ color: 'rgba(255,255,255,.68)' }}>
              {events.length === 1 ? 'event' : 'events'}
            </div>
          </div>
        </div>
      </section>

      <CommunityTabs slug={slug} />

      <section
        style={{
          ...card,
          margin: '18px 0 22px',
          padding: 22,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                color: '#08754b',
                fontSize: 12,
                fontWeight: 850,
                letterSpacing: '.14em',
                textTransform: 'uppercase',
              }}
            >
              Community calendar
            </div>

            <h2 style={{ margin: '5px 0 0' }}>Create an event</h2>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreateError('');
              setCreateOpen((current) => !current);
            }}
            style={{
              border: 0,
              borderRadius: 999,
              background: '#08754b',
              color: '#fff',
              cursor: 'pointer',
              padding: '12px 18px',
              fontWeight: 850,
            }}
          >
            {createOpen ? 'Close' : '+ Create event'}
          </button>
        </div>

        {createOpen ? (
          <div
            style={{
              display: 'grid',
              gap: 14,
              marginTop: 20,
            }}
          >
            <label style={{ display: 'grid', gap: 6 }}>
              <strong>Event title</strong>
              <input
                value={title}
                maxLength={120}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Neighbourhood clean-up"
                style={{
                  minHeight: 46,
                  border: '1px solid #dce5e0',
                  borderRadius: 13,
                  padding: '0 13px',
                  font: 'inherit',
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <strong>Description</strong>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Tell neighbours what the event is about."
                style={{
                  minHeight: 110,
                  border: '1px solid #dce5e0',
                  borderRadius: 13,
                  padding: 13,
                  resize: 'vertical',
                  font: 'inherit',
                }}
              />
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: 14,
              }}
            >
              <label style={{ display: 'grid', gap: 6 }}>
                <strong>Starts</strong>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  style={{
                    minHeight: 46,
                    border: '1px solid #dce5e0',
                    borderRadius: 13,
                    padding: '0 13px',
                    font: 'inherit',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <strong>Ends</strong>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                  style={{
                    minHeight: 46,
                    border: '1px solid #dce5e0',
                    borderRadius: 13,
                    padding: '0 13px',
                    font: 'inherit',
                  }}
                />
              </label>
            </div>

            {createError ? (
              <div
                role="alert"
                style={{
                  borderRadius: 12,
                  background: '#fff4f2',
                  color: '#b42318',
                  padding: '10px 12px',
                  fontWeight: 750,
                }}
              >
                {createError}
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={creating}
                onClick={() => void submitEvent()}
                style={{
                  border: 0,
                  borderRadius: 999,
                  background: '#102d4a',
                  color: '#fff',
                  cursor: creating ? 'default' : 'pointer',
                  opacity: creating ? 0.6 : 1,
                  padding: '12px 20px',
                  fontWeight: 850,
                }}
              >
                {creating ? 'Publishing…' : 'Publish event'}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {error ? (
        <div style={{ ...card, padding: 28 }}>{error}</div>
      ) : sortedEvents.length === 0 ? (
        <section
          style={{
            ...card,
            minHeight: 340,
            padding: 34,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: 520 }}>
            <div
              style={{
                width: 64,
                height: 64,
                margin: '0 auto 18px',
                borderRadius: 22,
                display: 'grid',
                placeItems: 'center',
                background: '#edf7f1',
                color: '#08754b',
                fontSize: 28,
              }}
            >
              17
            </div>

            <h2 style={{ margin: 0, fontSize: 30 }}>Nothing scheduled yet</h2>

            <p
              style={{
                color: '#6b7771',
                fontSize: 17,
                lineHeight: 1.6,
                margin: '10px auto 0',
              }}
            >
              This community does not currently have any scheduled events. When local events are
              published, they will appear here.
            </p>

            <Link
              href={`/community/${slug}`}
              style={{
                display: 'inline-block',
                marginTop: 22,
                padding: '12px 18px',
                borderRadius: 14,
                background: '#08754b',
                color: '#fff',
                fontWeight: 850,
                textDecoration: 'none',
              }}
            >
              Back to community
            </Link>
          </div>
        </section>
      ) : (
        <section
          style={{
            display: 'grid',
            gap: 16,
          }}
        >
          {sortedEvents.map((event) => (
            <article key={event.id} style={{ ...card, padding: 26 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 20,
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 500px' }}>
                  <div
                    style={{
                      color: '#b77f13',
                      fontSize: 12,
                      fontWeight: 850,
                      letterSpacing: '.16em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Community event
                  </div>

                  <h2 style={{ margin: '7px 0 6px', fontSize: 27 }}>{event.title}</h2>

                  {event.description ? (
                    <p
                      style={{
                        margin: '0 0 14px',
                        color: '#66736d',
                        lineHeight: 1.6,
                      }}
                    >
                      {event.description}
                    </p>
                  ) : null}

                  <strong>{new Date(event.startsAt).toLocaleString()}</strong>

                  <div style={{ marginTop: 16 }}>
                    <Link
                      href={`/events/${event.id}`}
                      style={{
                        display: 'inline-block',
                        borderRadius: 999,
                        background: '#102d4a',
                        color: '#fff',
                        padding: '10px 15px',
                        textDecoration: 'none',
                        fontWeight: 850,
                      }}
                    >
                      View event
                    </Link>
                  </div>
                </div>

                <ReportButton targetType="EVENT" targetId={event.id} />
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
