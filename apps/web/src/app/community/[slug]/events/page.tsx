'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import {
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
