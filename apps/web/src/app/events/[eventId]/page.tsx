'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  attendEvent,
  deleteEvent,
  getEvent,
  getEventAttendance,
  getMyProfile,
  leaveEvent,
  type EventAttendance,
  type EventItem,
  type PrivateProfile,
} from '@neighbour/api-client';

import ReportButton from '../../../components/security/ReportButton';

const shell: React.CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  padding: '44px 42px 80px',
};

const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid rgba(9, 46, 32, .09)',
  borderRadius: 26,
  boxShadow: '0 18px 45px rgba(31,46,38,.06)',
};

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [attendance, setAttendance] = useState<EventAttendance[]>([]);
  const [profile, setProfile] = useState<PrivateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [changingAttendance, setChangingAttendance] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (): Promise<void> => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setError('Your session has expired. Please sign in again.');
      return;
    }

    const [eventResult, attendanceResult, profileResult] = await Promise.all([
      getEvent(eventId),
      getEventAttendance(eventId),
      getMyProfile(token),
    ]);

    setEvent(eventResult);
    setAttendance(attendanceResult);
    setProfile(profileResult);
  }, [eventId]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError('');

      try {
        await load();
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError.message : 'This event could not be loaded.',
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const isGoing = useMemo(
    () => Boolean(profile && attendance.some((item) => item.userId === profile.userId)),
    [attendance, profile],
  );

  const canDelete = Boolean(event && profile && event.creatorId === profile.userId);

  async function changeAttendance(): Promise<void> {
    if (changingAttendance) {
      return;
    }

    const token = localStorage.getItem('accessToken');

    if (!token) {
      setError('Your session has expired. Please sign in again.');
      return;
    }

    setChangingAttendance(true);
    setError('');

    try {
      if (isGoing) {
        await leaveEvent(token, eventId);
      } else {
        await attendEvent(token, eventId);
      }

      const [updatedAttendance, updatedEvent] = await Promise.all([
        getEventAttendance(eventId),
        getEvent(eventId),
      ]);

      setAttendance(updatedAttendance);
      setEvent(updatedEvent);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Your attendance could not be updated.',
      );
    } finally {
      setChangingAttendance(false);
    }
  }

  async function removeEvent(): Promise<void> {
    if (!event || !canDelete || deleting) {
      return;
    }

    const confirmed = window.confirm(
      'Delete this event permanently? Its attendance records will also be removed. This cannot be undone.',
    );

    if (!confirmed) {
      return;
    }

    const token = localStorage.getItem('accessToken');

    if (!token) {
      setError('Your session has expired. Please sign in again.');
      return;
    }

    setDeleting(true);
    setError('');

    try {
      await deleteEvent(token, event.id);

      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.assign('/community');
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'The event could not be deleted.',
      );
      setDeleting(false);
    }
  }

  if (loading) {
    return <main style={shell}>Loading event…</main>;
  }

  if (!event) {
    return (
      <main style={shell}>
        <section style={{ ...card, padding: 30 }}>
          <h1>Event unavailable</h1>
          <p>{error || 'This event could not be found.'}</p>
          <Link href="/community">Back to communities</Link>
        </section>
      </main>
    );
  }

  return (
    <main style={shell}>
      <section
        style={{
          borderRadius: 30,
          padding: '34px 36px',
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
          }}
        >
          COMMUNITY EVENT
        </div>

        <h1
          style={{
            margin: '10px 0 8px',
            fontSize: 'clamp(34px,5vw,56px)',
          }}
        >
          {event.title}
        </h1>

        <p
          style={{
            maxWidth: 700,
            color: 'rgba(255,255,255,.76)',
            lineHeight: 1.6,
            fontSize: 17,
          }}
        >
          {event.description}
        </p>

        <div style={{ marginTop: 20, fontWeight: 850 }}>{formatDate(event.startsAt)}</div>

        <div
          style={{
            marginTop: 5,
            color: 'rgba(255,255,255,.65)',
          }}
        >
          until {formatDate(event.endsAt)}
        </div>
      </section>

      {error ? (
        <div
          role="alert"
          style={{
            ...card,
            marginTop: 18,
            padding: 16,
            color: '#b42318',
            background: '#fff4f2',
            fontWeight: 750,
          }}
        >
          {error}
        </div>
      ) : null}

      <section
        style={{
          ...card,
          marginTop: 20,
          padding: 28,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 22,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                color: '#08754b',
                fontSize: 12,
                fontWeight: 850,
                letterSpacing: '.12em',
              }}
            >
              ATTENDANCE
            </div>

            <h2 style={{ margin: '6px 0' }}>
              {attendance.length}{' '}
              {attendance.length === 1 ? 'neighbour is going' : 'neighbours are going'}
            </h2>

            {event.creator ? (
              <p style={{ margin: 0, color: '#6b7771' }}>Hosted by {event.creator.displayName}</p>
            ) : null}
          </div>

          <button
            type="button"
            disabled={changingAttendance}
            onClick={() => void changeAttendance()}
            style={{
              minHeight: 46,
              border: 0,
              borderRadius: 999,
              background: isGoing ? '#edf3ef' : '#08754b',
              color: isGoing ? '#263d32' : '#fff',
              cursor: changingAttendance ? 'default' : 'pointer',
              opacity: changingAttendance ? 0.6 : 1,
              padding: '0 20px',
              fontWeight: 850,
            }}
          >
            {changingAttendance ? 'Updating…' : isGoing ? 'Leave event' : 'Attend event'}
          </button>
        </div>
      </section>

      <section
        style={{
          ...card,
          marginTop: 20,
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}
        >
          <ReportButton targetType="EVENT" targetId={event.id} />

          {canDelete ? (
            <button
              type="button"
              disabled={deleting}
              onClick={() => void removeEvent()}
              style={{
                minHeight: 42,
                borderRadius: 999,
                border: '1px solid #b42318',
                background: '#fff',
                color: '#b42318',
                cursor: deleting ? 'default' : 'pointer',
                opacity: deleting ? 0.6 : 1,
                padding: '0 16px',
                fontWeight: 850,
              }}
            >
              {deleting ? 'Deleting…' : 'Delete event'}
            </button>
          ) : null}
        </div>
      </section>

      <div style={{ marginTop: 22 }}>
        <button
          type="button"
          onClick={() => window.history.back()}
          style={{
            border: 0,
            background: 'transparent',
            color: '#08754b',
            cursor: 'pointer',
            padding: 0,
            fontWeight: 850,
          }}
        >
          ← Back to events
        </button>
      </div>
    </main>
  );
}
