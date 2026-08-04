'use client';

import { useEffect, useState } from 'react';

import { useParams } from 'next/navigation';

import ReportButton from '../../../../components/security/ReportButton';

import { getCommunity, getCommunityEvents, type EventItem } from '@neighbour/api-client';

export default function EventsPage() {
  const params = useParams();

  const slug = params.slug as string;

  const [events, setEvents] = useState<EventItem[]>([]);

  const [loading, setLoading] = useState(true);

  async function load() {
    const token = localStorage.getItem('accessToken');

    if (!token) return;

    const community = await getCommunity(token, slug);

    const result = await getCommunityEvents(community.id);

    setEvents(result);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <main style={{ padding: '40px' }}>Loading events...</main>;
  }

  return (
    <main
      style={{
        padding: '40px',
        maxWidth: '800px',
        margin: 'auto',
      }}
    >
      <h1>Community Events</h1>

      {events.length === 0 ? (
        <p>No events scheduled.</p>
      ) : (
        events.map((event) => (
          <section
            key={event.id}
            style={{
              padding: '20px',
              marginTop: '15px',
              background: '#fff',
              borderRadius: '20px',
            }}
          >
            <h3>{event.title}</h3>

            <p>{event.description}</p>

            <small>{new Date(event.startsAt).toLocaleString()}</small>

            <div
              style={{
                marginTop: '15px',
              }}
            >
              <ReportButton targetType="EVENT" targetId={event.id} />
            </div>
          </section>
        ))
      )}
    </main>
  );
}
