'use client';

import { getLiveAccess, leaveLiveSession, type LiveSession } from '@neighbour/api-client';
import {
  ConnectionState,
  Room,
  RoomEvent,
  Track,
  type RemoteTrack,
  type RemoteTrackPublication,
  type RemoteParticipant,
} from 'livekit-client';
import { useCallback, useEffect, useRef, useState } from 'react';

interface WebLiveViewerProps {
  open: boolean;
  session: LiveSession | null;
  onClose: () => void;
}

type ViewerState = 'idle' | 'joining' | 'watching' | 'leaving' | 'error';

export default function WebLiveViewer({ open, session, onClose }: WebLiveViewerProps) {
  const [state, setState] = useState<ViewerState>('idle');
  const [message, setMessage] = useState('');
  const [connectionLabel, setConnectionLabel] = useState('Not connected');
  const [viewerCount, setViewerCount] = useState(0);
  const [hostVideoReady, setHostVideoReady] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const hostTrackRef = useRef<RemoteTrack | null>(null);
  const joinedSessionIdRef = useRef<string | null>(null);
  const leaveRequestedRef = useRef(false);

  const refreshViewerCount = useCallback(() => {
    const room = roomRef.current;

    if (!room || !session) {
      setViewerCount(0);
      return;
    }

    const viewers = Array.from(room.remoteParticipants.values()).filter(
      (participant) => participant.identity !== session.creatorId,
    ).length;

    setViewerCount(viewers);
  }, [session]);

  const detachHostTrack = useCallback(() => {
    const track = hostTrackRef.current;

    if (track && videoElementRef.current) {
      track.detach(videoElementRef.current);
    }

    hostTrackRef.current = null;
    setHostVideoReady(false);
  }, []);

  const attachHostTrack = useCallback(
    (track: RemoteTrack, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
      if (!session) {
        return;
      }

      if (participant.identity !== session.creatorId) {
        return;
      }

      if (publication.source !== Track.Source.Camera) {
        return;
      }

      detachHostTrack();

      hostTrackRef.current = track;

      if (videoElementRef.current) {
        track.attach(videoElementRef.current);
      }

      setHostVideoReady(true);
    },
    [detachHostTrack, session],
  );

  const disconnectRoom = useCallback(async () => {
    const room = roomRef.current;

    detachHostTrack();

    if (!room) {
      return;
    }

    room.removeAllListeners();

    try {
      await room.disconnect();
    } catch {
      // Best-effort LiveKit cleanup.
    }

    roomRef.current = null;
    setViewerCount(0);
    setConnectionLabel('Disconnected');
  }, [detachHostTrack]);

  const notifyLeave = useCallback(async () => {
    const sessionId = joinedSessionIdRef.current;

    if (!sessionId || leaveRequestedRef.current) {
      return;
    }

    leaveRequestedRef.current = true;

    try {
      await leaveLiveSession(sessionId);
    } catch (cause) {
      console.error('Unable to leave web live session', cause);
    } finally {
      joinedSessionIdRef.current = null;
    }
  }, []);

  const closeViewer = useCallback(async () => {
    if (state === 'leaving') {
      return;
    }

    setState('leaving');

    await notifyLeave();
    await disconnectRoom();

    setMessage('');
    setState('idle');
    onClose();
  }, [disconnectRoom, notifyLeave, onClose, state]);

  useEffect(() => {
    if (!open || !session) {
      return;
    }

    let cancelled = false;

    leaveRequestedRef.current = false;
    joinedSessionIdRef.current = session.id;

    async function connectViewer(): Promise<void> {
      setState('joining');
      setMessage('');
      setHostVideoReady(false);
      setConnectionLabel('Joining…');

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      roomRef.current = room;

      const updateConnection = (connectionState: ConnectionState) => {
        if (connectionState === ConnectionState.Connected) {
          setConnectionLabel('Connected');
        } else if (connectionState === ConnectionState.Connecting) {
          setConnectionLabel('Connecting…');
        } else if (connectionState === ConnectionState.Reconnecting) {
          setConnectionLabel('Reconnecting…');
        } else {
          setConnectionLabel('Disconnected');
        }
      };

      room.on(RoomEvent.ConnectionStateChanged, updateConnection);

      room.on(RoomEvent.TrackSubscribed, attachHostTrack);

      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track === hostTrackRef.current) {
          detachHostTrack();
        }
      });

      room.on(RoomEvent.ParticipantConnected, refreshViewerCount);
      room.on(RoomEvent.ParticipantDisconnected, refreshViewerCount);

      room.on(RoomEvent.Disconnected, () => {
        setConnectionLabel('Disconnected');
      });

      try {
        const access = await getLiveAccess(session.id);

        if (cancelled) {
          return;
        }

        await room.connect(access.serverUrl, access.token, {
          autoSubscribe: true,
        });

        if (cancelled) {
          await room.disconnect();
          return;
        }

        refreshViewerCount();

        for (const participant of room.remoteParticipants.values()) {
          if (participant.identity !== session.creatorId) {
            continue;
          }

          const publication = participant.getTrackPublication(Track.Source.Camera);

          if (publication?.track) {
            attachHostTrack(publication.track, publication, participant);
          }
        }

        setConnectionLabel('Connected');
        setState('watching');
      } catch (cause) {
        console.error('Unable to join web live session', cause);

        setMessage(cause instanceof Error ? cause.message : 'Unable to join this live Vibe.');

        setConnectionLabel('Disconnected');
        setState('error');

        await disconnectRoom();
      }
    }

    void connectViewer();

    return () => {
      cancelled = true;

      void (async () => {
        await notifyLeave();
        await disconnectRoom();
      })();
    };
  }, [attachHostTrack, disconnectRoom, notifyLeave, open, refreshViewerCount, session]);

  if (!open || !session) {
    return null;
  }

  const busy = state === 'joining' || state === 'leaving';

  return (
    <div className="web-live-viewer-overlay">
      <section
        aria-label="Live Vibe viewer"
        aria-modal="true"
        className="web-live-viewer"
        role="dialog"
      >
        <div className="web-live-viewer-video">
          <video ref={videoElementRef} autoPlay playsInline />

          {!hostVideoReady ? (
            <div className="web-live-viewer-waiting">
              <div className="web-live-viewer-pulse" />

              <strong>
                {state === 'joining' ? 'Joining live Vibe…' : 'Waiting for live video…'}
              </strong>

              <span>{session.creator.displayName}</span>

              {message ? <p>{message}</p> : null}
            </div>
          ) : null}

          <div className="web-live-viewer-top">
            <div className="web-live-viewer-badge">
              <i />
              LIVE
            </div>

            <div className="web-live-viewer-audience">
              {viewerCount} {viewerCount === 1 ? 'watching' : 'watching'}
            </div>
          </div>

          <div className="web-live-viewer-bottom">
            <div className="web-live-viewer-identity">
              <strong>{session.creator.displayName}</strong>

              <h2>{session.title || 'Live Vibe'}</h2>

              {session.description ? <p>{session.description}</p> : null}

              <span>{connectionLabel}</span>
            </div>

            <button type="button" disabled={busy} onClick={() => void closeViewer()}>
              {state === 'leaving' ? 'Leaving…' : 'Leave Live'}
            </button>
          </div>
        </div>
      </section>

      <style>{`
        .web-live-viewer-overlay {
          position: fixed;
          inset: 0;
          z-index: 2100;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(0, 0, 0, .9);
          backdrop-filter: blur(12px);
        }

        .web-live-viewer {
          width: min(1180px, 100%);
          height: min(820px, calc(100vh - 40px));
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, .12);
          border-radius: 30px;
          background: #050706;
          box-shadow: 0 40px 120px rgba(0, 0, 0, .65);
        }

        .web-live-viewer-video {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #050706;
        }

        .web-live-viewer-video video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: #050706;
        }

        .web-live-viewer-waiting {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 28px;
          text-align: center;
          color: #fff;
          background:
            radial-gradient(circle at center, rgba(36, 125, 85, .2), transparent 45%),
            #080a09;
        }

        .web-live-viewer-waiting strong {
          font-size: 22px;
        }

        .web-live-viewer-waiting span,
        .web-live-viewer-waiting p {
          color: rgba(255, 255, 255, .62);
        }

        .web-live-viewer-pulse {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #63d29a;
          box-shadow: 0 0 0 8px rgba(99, 210, 154, .12);
        }

        .web-live-viewer-top,
        .web-live-viewer-bottom {
          position: absolute;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 26px;
          pointer-events: none;
        }

        .web-live-viewer-top {
          top: 0;
          align-items: flex-start;
          background: linear-gradient(to bottom, rgba(0, 0, 0, .65), transparent);
        }

        .web-live-viewer-bottom {
          bottom: 0;
          align-items: flex-end;
          background: linear-gradient(to top, rgba(0, 0, 0, .82), transparent);
        }

        .web-live-viewer-badge,
        .web-live-viewer-audience {
          display: flex;
          align-items: center;
          min-height: 34px;
          border-radius: 999px;
          color: #fff;
          font-size: 13px;
          font-weight: 900;
        }

        .web-live-viewer-badge {
          gap: 7px;
          padding: 0 13px;
          background: #ef233c;
          letter-spacing: .08em;
        }

        .web-live-viewer-badge i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #fff;
        }

        .web-live-viewer-audience {
          padding: 0 14px;
          background: rgba(0, 0, 0, .52);
        }

        .web-live-viewer-identity {
          max-width: 720px;
          color: #fff;
        }

        .web-live-viewer-identity strong {
          font-size: 14px;
          font-weight: 900;
        }

        .web-live-viewer-identity h2 {
          margin: 5px 0;
          font-size: clamp(24px, 4vw, 42px);
        }

        .web-live-viewer-identity p {
          margin: 0 0 8px;
          color: rgba(255, 255, 255, .78);
          line-height: 1.5;
        }

        .web-live-viewer-identity span {
          color: rgba(255, 255, 255, .5);
          font-size: 12px;
        }

        .web-live-viewer-bottom button {
          pointer-events: auto;
          flex: 0 0 auto;
          border: 0;
          border-radius: 999px;
          background: #fff;
          color: #111;
          cursor: pointer;
          padding: 13px 20px;
          font: inherit;
          font-weight: 900;
        }

        .web-live-viewer-bottom button:disabled {
          cursor: default;
          opacity: .55;
        }

        @media (max-width: 720px) {
          .web-live-viewer-overlay {
            padding: 0;
          }

          .web-live-viewer {
            width: 100%;
            height: 100vh;
            border: 0;
            border-radius: 0;
          }

          .web-live-viewer-top,
          .web-live-viewer-bottom {
            padding: 18px;
          }

          .web-live-viewer-bottom {
            flex-direction: column;
            align-items: stretch;
          }

          .web-live-viewer-bottom button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
