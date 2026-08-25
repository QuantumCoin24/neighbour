import {
  AudioSession,
  LiveKitRoom,
  VideoTrack,
  useLocalParticipant,
  useParticipants,
  useTracks,
} from '@livekit/react-native';
import type { LiveAccess, LiveSession } from '@neighbour/api-client';
import { Track } from 'livekit-client';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../../components/AppText';
import { endLiveSession, leaveLiveSession } from '@neighbour/api-client';

interface LiveBroadcastRoomProps {
  access: LiveAccess;
  session: LiveSession;
  visible: boolean;
  onClosed: () => void;
}

function BroadcastControls({ session, onClosed }: { session: LiveSession; onClosed: () => void }) {
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const tracks = useTracks([Track.Source.Camera]);

  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const [ending, setEnding] = useState(false);

  const localCamera = useMemo(
    () => tracks.find((track) => track.participant.identity === localParticipant.identity),
    [tracks, localParticipant.identity],
  );

  useEffect(() => {
    void localParticipant.setCameraEnabled(true).catch((cause) => {
      console.error('Unable to start live camera', cause);
    });
  }, [localParticipant]);

  async function toggleMic(): Promise<void> {
    const next = !micEnabled;
    await localParticipant.setMicrophoneEnabled(next);
    setMicEnabled(next);
  }

  async function flipCamera(): Promise<void> {
    const publication = localParticipant.getTrackPublication(Track.Source.Camera);

    const track = publication?.track;

    if (!track || !('restartTrack' in track)) {
      return;
    }

    const next: 'front' | 'back' = cameraPosition === 'front' ? 'back' : 'front';

    await track.restartTrack({
      facingMode: next === 'front' ? 'user' : 'environment',
    });

    setCameraPosition(next);
  }

  async function end(): Promise<void> {
    if (ending) return;

    try {
      setEnding(true);
      await endLiveSession(session.id);
      onClosed();
    } catch (cause) {
      console.error('Unable to end live session', cause);
      setEnding(false);
    }
  }

  return (
    <View style={styles.broadcast}>
      {localCamera ? (
        <VideoTrack
          trackRef={localCamera}
          style={StyleSheet.absoluteFill}
          mirror={cameraPosition === 'front'}
        />
      ) : (
        <View style={styles.cameraLoading}>
          <AppText style={styles.cameraLoadingText}>Starting camera…</AppText>
        </View>
      )}

      <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View style={styles.topBar}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <AppText style={styles.liveBadgeText}>LIVE</AppText>
          </View>

          <View style={styles.viewerBadge}>
            <AppText style={styles.viewerText}>
              {Math.max(0, participants.length - 1)} watching
            </AppText>
          </View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.titleWrap}>
            <AppText style={styles.broadcastTitle}>{session.title || 'Live Vibe'}</AppText>

            {session.description ? (
              <AppText style={styles.broadcastDescription}>{session.description}</AppText>
            ) : null}
          </View>

          <View style={styles.controls}>
            <Pressable onPress={toggleMic} style={styles.control}>
              <AppText style={styles.controlText}>{micEnabled ? 'Mic On' : 'Mic Off'}</AppText>
            </Pressable>

            <Pressable onPress={flipCamera} style={styles.control}>
              <AppText style={styles.controlText}>Flip</AppText>
            </Pressable>

            <Pressable
              onPress={end}
              disabled={ending}
              style={[styles.control, styles.endControl, ending && styles.disabled]}
            >
              <AppText style={styles.controlText}>{ending ? 'Ending…' : 'End'}</AppText>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

export function LiveBroadcastRoom({ access, session, visible, onClosed }: LiveBroadcastRoomProps) {
  useEffect(() => {
    if (!visible) return;

    void AudioSession.startAudioSession();

    return () => {
      void AudioSession.stopAudioSession();
      void leaveLiveSession(session.id).catch(() => undefined);
    };
  }, [session.id, visible]);

  return (
    <Modal
      animationType="fade"
      visible={visible}
      presentationStyle="fullScreen"
      onRequestClose={() => undefined}
    >
      <LiveKitRoom
        serverUrl={access.serverUrl}
        token={access.token}
        connect
        audio
        video
        options={{
          adaptiveStream: true,
          dynacast: true,
        }}
      >
        <BroadcastControls session={session} onClosed={onClosed} />
      </LiveKitRoom>
    </Modal>
  );
}

const styles = StyleSheet.create({
  broadcast: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  cameraLoadingText: {
    color: '#fff',
  },
  topBar: {
    paddingHorizontal: 18,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  liveBadge: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: '#ef233c',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  liveDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  viewerBadge: {
    height: 34,
    paddingHorizontal: 13,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center',
  },
  viewerText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  bottom: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 18,
  },
  titleWrap: {
    maxWidth: '82%',
    gap: 4,
  },
  broadcastTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  broadcastDescription: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    lineHeight: 20,
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
  },
  control: {
    minWidth: 82,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  endControl: {
    backgroundColor: '#ef233c',
    marginLeft: 'auto',
  },
  controlText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  disabled: {
    opacity: 0.6,
  },
});
