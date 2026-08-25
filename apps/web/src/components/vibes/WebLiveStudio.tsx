'use client';

import {
  createLiveSession,
  endLiveSession,
  getLiveAccess,
  startLiveSession,
  type LiveSession,
} from '@neighbour/api-client';
import { ConnectionState, Room, RoomEvent, Track, type LocalVideoTrack } from 'livekit-client';
import { useCallback, useEffect, useRef, useState } from 'react';

interface WebLiveStudioProps {
  open: boolean;
  onClose: () => void;
  onLiveEnded?: () => void;
}

type StudioState = 'setup' | 'starting' | 'live' | 'ending' | 'error';

export default function WebLiveStudio({ open, onClose, onLiveEnded }: WebLiveStudioProps) {
  const [state, setState] = useState<StudioState>('setup');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [message, setMessage] = useState('');
  const [connectionLabel, setConnectionLabel] = useState('Not connected');

  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const [viewerCount, setViewerCount] = useState(0);

  const [session, setSession] = useState<LiveSession | null>(null);

  const roomRef = useRef<Room | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const localVideoTrackRef = useRef<LocalVideoTrack | null>(null);

  const endingRef = useRef(false);

  const refreshViewerCount = useCallback(() => {
    const room = roomRef.current;

    if (!room) {
      setViewerCount(0);
      return;
    }

    setViewerCount(room.remoteParticipants.size);
  }, []);

  const cleanupRoom = useCallback(async (): Promise<void> => {
    const room = roomRef.current;

    if (!room) {
      return;
    }

    try {
      const videoTrack = localVideoTrackRef.current;

      if (videoTrack && videoElementRef.current) {
        videoTrack.detach(videoElementRef.current);
      }

      localVideoTrackRef.current = null;

      await room.localParticipant.setMicrophoneEnabled(false);
      await room.localParticipant.setCameraEnabled(false);
    } catch {
      // Best-effort local media cleanup.
    }

    room.removeAllListeners();
    await room.disconnect();

    roomRef.current = null;

    setViewerCount(0);
    setConnectionLabel('Disconnected');
  }, []);

  const closeStudio = useCallback(async (): Promise<void> => {
    if (state === 'live' || state === 'ending' || state === 'starting') {
      return;
    }

    await cleanupRoom();

    setSession(null);
    setTitle('');
    setDescription('');
    setMessage('');
    setMicEnabled(true);
    setCameraEnabled(true);
    setState('setup');

    onClose();
  }, [cleanupRoom, onClose, state]);

  const endBroadcast = useCallback(async (): Promise<void> => {
    if (!session || endingRef.current) {
      return;
    }

    endingRef.current = true;
    setState('ending');
    setMessage('');

    try {
      await endLiveSession(session.id);
    } catch (cause) {
      console.error('Unable to end web live session', cause);
    }

    try {
      await cleanupRoom();
    } finally {
      endingRef.current = false;

      setSession(null);
      setTitle('');
      setDescription('');
      setMicEnabled(true);
      setCameraEnabled(true);
      setState('setup');

      onLiveEnded?.();
      onClose();
    }
  }, [cleanupRoom, onClose, onLiveEnded, session]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleBeforeUnload = () => {
      const room = roomRef.current;

      if (room) {
        void room.disconnect();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      const room = roomRef.current;

      if (room) {
        room.removeAllListeners();
        void room.disconnect();
      }
    };
  }, []);

  async function startBroadcast(): Promise<void> {
    if (state === 'starting' || state === 'live') {
      return;
    }

    setState('starting');
    setMessage('');
    setConnectionLabel('Preparing LiveKit…');

    let createdSession: LiveSession | null = null;
    let room: Room | null = null;

    try {
      createdSession = await createLiveSession({
        ...(title.trim()
          ? {
              title: title.trim(),
            }
          : {}),
        ...(description.trim()
          ? {
              description: description.trim(),
            }
          : {}),
      });

      setSession(createdSession);

      const access = await getLiveAccess(createdSession.id);

      room = new Room({
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

      room.on(RoomEvent.ParticipantConnected, refreshViewerCount);
      room.on(RoomEvent.ParticipantDisconnected, refreshViewerCount);

      room.on(RoomEvent.Disconnected, () => {
        setConnectionLabel('Disconnected');
      });

      setConnectionLabel('Connecting…');

      await room.connect(access.serverUrl, access.token, {
        autoSubscribe: true,
      });

      refreshViewerCount();

      setConnectionLabel('Starting camera…');

      await room.localParticipant.setCameraEnabled(true, {
        facingMode: 'user',
      });

      await room.localParticipant.setMicrophoneEnabled(true);

      const cameraPublication = room.localParticipant.getTrackPublication(Track.Source.Camera);

      const cameraTrack = cameraPublication?.videoTrack;

      if (!cameraTrack) {
        throw new Error('LiveKit camera track was not created.');
      }

      localVideoTrackRef.current = cameraTrack;

      if (videoElementRef.current) {
        cameraTrack.attach(videoElementRef.current);
      }

      const liveSession = await startLiveSession(createdSession.id);

      setSession(liveSession);
      setMicEnabled(true);
      setCameraEnabled(true);
      setConnectionLabel('Connected');
      setState('live');
    } catch (cause) {
      console.error('Unable to start web live broadcast', cause);

      setMessage(cause instanceof Error ? cause.message : 'Unable to start live broadcast.');

      if (createdSession) {
        try {
          await endLiveSession(createdSession.id);
        } catch {
          // Best effort API cleanup.
        }
      }

      if (room) {
        try {
          await room.disconnect();
        } catch {
          // Best effort LiveKit cleanup.
        }
      }

      roomRef.current = null;
      localVideoTrackRef.current = null;

      setSession(null);
      setConnectionLabel('Disconnected');
      setState('error');
    }
  }

  async function toggleMicrophone(): Promise<void> {
    const room = roomRef.current;

    if (!room || state !== 'live') {
      return;
    }

    const next = !micEnabled;

    try {
      await room.localParticipant.setMicrophoneEnabled(next);
      setMicEnabled(next);
    } catch (cause) {
      console.error('Unable to toggle microphone', cause);
    }
  }

  async function toggleCamera(): Promise<void> {
    const room = roomRef.current;

    if (!room || state !== 'live') {
      return;
    }

    const next = !cameraEnabled;

    try {
      await room.localParticipant.setCameraEnabled(next);

      setCameraEnabled(next);

      if (next) {
        const publication = room.localParticipant.getTrackPublication(Track.Source.Camera);

        const cameraTrack = publication?.videoTrack;

        if (cameraTrack) {
          localVideoTrackRef.current = cameraTrack;

          if (videoElementRef.current) {
            cameraTrack.attach(videoElementRef.current);
          }
        }
      }
    } catch (cause) {
      console.error('Unable to toggle camera', cause);
    }
  }

  async function flipCamera(): Promise<void> {
    const track = localVideoTrackRef.current;

    if (!track || state !== 'live') {
      return;
    }

    const mediaTrack = track.mediaStreamTrack;

    const currentFacingMode = mediaTrack.getSettings().facingMode ?? 'user';

    const nextFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';

    try {
      await track.restartTrack({
        facingMode: nextFacingMode,
      });
    } catch (cause) {
      console.error('Unable to flip browser camera', cause);

      setMessage('This browser/device does not support camera switching.');
    }
  }

  if (!open) {
    return null;
  }

  const busy = state === 'starting' || state === 'ending';

  return (
    <div
      className="web-live-overlay"
      onMouseDown={() => {
        if (state === 'setup' || state === 'error') {
          void closeStudio();
        }
      }}
    >
      <section className="web-live-studio" onMouseDown={(event) => event.stopPropagation()}>
        <header className="web-live-header">
          <div>
            <span>NEIGHBOUR™ LIVE</span>

            <h2>{state === 'live' ? 'You’re live.' : 'Start a live Vibe'}</h2>
          </div>

          {state !== 'live' && state !== 'starting' ? (
            <button className="web-live-close" type="button" onClick={() => void closeStudio()}>
              ×
            </button>
          ) : null}
        </header>

        <div className="web-live-content">
          <div className="web-live-preview">
            <video ref={videoElementRef} autoPlay muted playsInline />

            {state !== 'live' ? (
              <div className="web-live-preview-placeholder">
                <div className="web-live-camera-icon">●</div>

                <strong>
                  {state === 'starting' ? 'Starting camera…' : 'Your camera preview appears here'}
                </strong>

                <span>Camera and microphone access is requested when you start.</span>
              </div>
            ) : null}

            {state === 'live' ? (
              <>
                <div className="web-live-badge">
                  <i />
                  LIVE
                </div>

                <div className="web-live-viewers">
                  {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
                </div>
              </>
            ) : null}
          </div>

          <aside className="web-live-panel">
            {state === 'setup' || state === 'error' ? (
              <>
                <label>
                  <span>Live title</span>

                  <input
                    value={title}
                    maxLength={120}
                    placeholder="What are you going live about?"
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </label>

                <label>
                  <span>Description</span>

                  <textarea
                    value={description}
                    maxLength={500}
                    placeholder="Tell your neighbours what’s happening…"
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </label>

                <div className="web-live-permissions">
                  <strong>Before you start</strong>

                  <p>Your browser will ask for permission to use your camera and microphone.</p>
                </div>

                {message ? <div className="web-live-error">{message}</div> : null}

                <button
                  className="web-live-start"
                  type="button"
                  disabled={busy}
                  onClick={() => void startBroadcast()}
                >
                  Go Live
                </button>
              </>
            ) : null}

            {state === 'starting' ? (
              <div className="web-live-starting">
                <div className="web-live-spinner" />

                <strong>Starting your live Vibe…</strong>

                <span>{connectionLabel}</span>
              </div>
            ) : null}

            {state === 'live' || state === 'ending' ? (
              <>
                <div className="web-live-status">
                  <div>
                    <span>STATUS</span>
                    <strong>{connectionLabel}</strong>
                  </div>

                  <div>
                    <span>AUDIENCE</span>
                    <strong>{viewerCount}</strong>
                  </div>
                </div>

                <div className="web-live-controls">
                  <button
                    type="button"
                    className={micEnabled ? 'active' : 'inactive'}
                    onClick={() => void toggleMicrophone()}
                  >
                    {micEnabled ? 'Mic On' : 'Mic Off'}
                  </button>

                  <button
                    type="button"
                    className={cameraEnabled ? 'active' : 'inactive'}
                    onClick={() => void toggleCamera()}
                  >
                    {cameraEnabled ? 'Camera On' : 'Camera Off'}
                  </button>

                  <button type="button" disabled={!cameraEnabled} onClick={() => void flipCamera()}>
                    Flip Camera
                  </button>
                </div>

                {message ? <div className="web-live-warning">{message}</div> : null}

                <button
                  className="web-live-end"
                  type="button"
                  disabled={state === 'ending'}
                  onClick={() => void endBroadcast()}
                >
                  {state === 'ending' ? 'Ending Live…' : 'End Live'}
                </button>
              </>
            ) : null}
          </aside>
        </div>
      </section>

      <style>{`
        .web-live-overlay {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(4, 10, 7, .78);
          backdrop-filter: blur(10px);
        }

        .web-live-studio {
          width: min(1120px, 100%);
          max-height: calc(100vh - 48px);
          overflow: auto;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 30px;
          background: #0b0f0d;
          color: #fff;
          box-shadow: 0 40px 120px rgba(0,0,0,.5);
        }

        .web-live-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 26px;
          border-bottom: 1px solid rgba(255,255,255,.09);
        }

        .web-live-header span {
          color: #63d29a;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .18em;
        }

        .web-live-header h2 {
          margin: 5px 0 0;
          font-size: 28px;
        }

        .web-live-close {
          width: 42px;
          height: 42px;
          border: 0;
          border-radius: 14px;
          background: rgba(255,255,255,.08);
          color: #fff;
          font-size: 28px;
          cursor: pointer;
        }

        .web-live-content {
          display: grid;
          grid-template-columns: minmax(0, 1.65fr) minmax(300px, .75fr);
          min-height: 610px;
        }

        .web-live-preview {
          position: relative;
          overflow: hidden;
          min-height: 610px;
          background: #020403;
        }

        .web-live-preview video {
          width: 100%;
          height: 100%;
          position: absolute;
          inset: 0;
          display: block;
          object-fit: cover;
          background: #020403;
        }

        .web-live-preview-placeholder {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 9px;
          padding: 30px;
          color: rgba(255,255,255,.58);
          text-align: center;
          background:
            radial-gradient(circle at 50% 30%, rgba(14,117,77,.22), transparent 42%),
            #050806;
        }

        .web-live-preview-placeholder strong {
          color: #fff;
          font-size: 19px;
        }

        .web-live-camera-icon {
          width: 58px;
          height: 58px;
          display: grid;
          place-items: center;
          margin-bottom: 7px;
          border-radius: 19px;
          background: #0e754d;
          color: #fff;
          font-size: 18px;
        }

        .web-live-badge {
          position: absolute;
          left: 18px;
          top: 18px;
          z-index: 4;
          display: flex;
          align-items: center;
          gap: 7px;
          border-radius: 999px;
          padding: 9px 13px;
          background: #ef233c;
          color: #fff;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .08em;
        }

        .web-live-badge i {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #fff;
        }

        .web-live-viewers {
          position: absolute;
          right: 18px;
          top: 18px;
          z-index: 4;
          border-radius: 999px;
          padding: 9px 13px;
          background: rgba(0,0,0,.5);
          backdrop-filter: blur(10px);
          font-size: 12px;
          font-weight: 800;
        }

        .web-live-panel {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 25px;
          background: #111713;
        }

        .web-live-panel label {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .web-live-panel label > span {
          color: rgba(255,255,255,.64);
          font-size: 12px;
          font-weight: 800;
        }

        .web-live-panel input,
        .web-live-panel textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 15px;
          background: rgba(255,255,255,.055);
          padding: 13px 14px;
          color: #fff;
          outline: none;
          font: inherit;
        }

        .web-live-panel textarea {
          min-height: 115px;
          resize: vertical;
        }

        .web-live-permissions {
          border-radius: 16px;
          padding: 14px;
          background: rgba(99,210,154,.08);
          border: 1px solid rgba(99,210,154,.15);
        }

        .web-live-permissions p {
          margin: 5px 0 0;
          color: rgba(255,255,255,.58);
          font-size: 12px;
          line-height: 1.5;
        }

        .web-live-start,
        .web-live-end {
          min-height: 50px;
          border: 0;
          border-radius: 15px;
          cursor: pointer;
          font-weight: 950;
          font-size: 14px;
        }

        .web-live-start {
          margin-top: auto;
          background: #0e754d;
          color: #fff;
        }

        .web-live-end {
          margin-top: auto;
          background: #ef233c;
          color: #fff;
        }

        .web-live-error,
        .web-live-warning {
          border-radius: 14px;
          padding: 12px 13px;
          font-size: 12px;
          line-height: 1.45;
        }

        .web-live-error {
          background: rgba(239,35,60,.13);
          color: #ffadb7;
        }

        .web-live-warning {
          background: rgba(255,190,75,.11);
          color: #ffd68c;
        }

        .web-live-starting {
          flex: 1;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 10px;
          text-align: center;
        }

        .web-live-starting span {
          color: rgba(255,255,255,.55);
          font-size: 12px;
        }

        .web-live-spinner {
          width: 38px;
          height: 38px;
          margin-bottom: 4px;
          border: 4px solid rgba(255,255,255,.12);
          border-top-color: #63d29a;
          border-radius: 999px;
          animation: web-live-spin .8s linear infinite;
        }

        @keyframes web-live-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .web-live-status {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .web-live-status > div {
          display: flex;
          flex-direction: column;
          gap: 5px;
          border-radius: 15px;
          padding: 14px;
          background: rgba(255,255,255,.06);
        }

        .web-live-status span {
          color: rgba(255,255,255,.42);
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .12em;
        }

        .web-live-controls {
          display: grid;
          gap: 9px;
        }

        .web-live-controls button {
          min-height: 46px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 14px;
          background: rgba(255,255,255,.07);
          color: #fff;
          cursor: pointer;
          font-weight: 800;
        }

        .web-live-controls button.active {
          border-color: rgba(99,210,154,.3);
          background: rgba(99,210,154,.12);
        }

        .web-live-controls button.inactive {
          border-color: rgba(239,35,60,.28);
          background: rgba(239,35,60,.1);
        }

        .web-live-controls button:disabled {
          opacity: .45;
          cursor: default;
        }

        @media (max-width: 850px) {
          .web-live-overlay {
            padding: 0;
          }

          .web-live-studio {
            width: 100%;
            height: 100%;
            max-height: none;
            border: 0;
            border-radius: 0;
          }

          .web-live-content {
            grid-template-columns: 1fr;
          }

          .web-live-preview {
            min-height: 52vh;
          }

          .web-live-panel {
            min-height: 320px;
          }
        }
      `}</style>
    </div>
  );
}
