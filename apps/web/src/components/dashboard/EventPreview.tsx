'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { getCommunityEvents, type EventItem } from '@neighbour/api-client';

interface Props {
  communityId?: string;
}

export default function EventPreview({ communityId }: Props) {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    async function load() {
      if (!communityId) {
        return;
      }

      try {
        const response = await getCommunityEvents(communityId);

        setEvents(response.slice(0, 3));
      } catch {
        setEvents([]);
      }
    }

    void load();
  }, [communityId]);

  return (
    <section className="event-module">
      <div className="event-header">
        <div>
          <span>UPCOMING</span>
          <h2>Local events</h2>
          <p>What’s happening around you.</p>
        </div>

        <Link href="/community">View all</Link>
      </div>

      {events.length === 0 ? (
        <div className="event-empty">
          <div>17</div>

          <section>
            <strong>Nothing scheduled yet</strong>
            <p>Your next local event can start here.</p>
          </section>
        </div>
      ) : (
        <div className="event-list">
          {events.map((event) => {
            const date = new Date(event.startsAt);

            return (
              <article key={event.id} className="event-item">
                <div className="event-date">
                  <strong>{date.getDate()}</strong>
                  <span>
                    {date.toLocaleDateString(undefined, {
                      month: 'short',
                    })}
                  </span>
                </div>

                <div>
                  <strong>{event.title}</strong>

                  <p>{event.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <style>{`
        .event-module {
          height: 100%;
          box-sizing: border-box;
          padding: 20px;
          border: 1px solid rgba(18,48,38,.07);
          border-radius: 20px;
          background: #fff;
          box-shadow:
            0 12px 34px
            rgba(19,45,34,.04);
        }

        .event-header {
          display: flex;
          justify-content: space-between;
          gap: 14px;
        }

        .event-header span {
          color: #b78223;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: .12em;
        }

        .event-header h2 {
          margin: 5px 0 0;
          color: #102019;
          font-size: 18px;
          letter-spacing: -.02em;
        }

        .event-header p {
          margin: 5px 0 0;
          color: #7a8781;
          font-size: 11px;
        }

        .event-header > a {
          color: #0b6846;
          font-size: 10px;
          font-weight: 800;
          text-decoration: none;
        }

        .event-empty {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-top: 18px;
          padding: 14px;
          border-radius: 14px;
          background: #f8faf9;
        }

        .event-empty > div {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #fff2d7;
          color: #8a641b;
          font-size: 13px;
          font-weight: 850;
        }

        .event-empty strong {
          color: #24372f;
          font-size: 12px;
        }

        .event-empty p {
          margin: 3px 0 0;
          color: #7a8781;
          font-size: 10px;
        }

        .event-list {
          display: grid;
          gap: 9px;
          margin-top: 15px;
        }

        .event-item {
          display: flex;
          gap: 11px;
          padding: 11px;
          border-radius: 13px;
          background: #f8faf9;
        }

        .event-date {
          width: 38px;
          height: 42px;
          display: grid;
          place-items: center;
          align-content: center;
          border-radius: 10px;
          background: #fff2d7;
          color: #7e5d1b;
        }

        .event-date strong {
          line-height: 1;
          font-size: 14px;
        }

        .event-date span {
          margin-top: 2px;
          font-size: 8px;
          text-transform: uppercase;
        }

        .event-item > div:last-child
          > strong {
          color: #22362d;
          font-size: 11px;
        }

        .event-item p {
          margin: 3px 0 0;
          color: #78847e;
          font-size: 9px;
          line-height: 1.4;
        }
      `}</style>
    </section>
  );
}
