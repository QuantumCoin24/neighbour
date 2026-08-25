import {
  AudioSession,
  LiveKitRoom,
  VideoTrack,
  useConnectionState,
  useParticipants,
  useTracks,
} from '@livekit/react-native';
import { leaveLiveSession, type LiveAccess, type LiveSession } from '@neighbour/api-client';
import { ConnectionState, Track } from 'livekit-client';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '../../../components/AppText';

interface LiveViewerRoomProps {
  access: LiveAccess;
  session: LiveSession;
  visible: boolean;
  onClosed: () => void;
}

function ViewerContent({ session, onClosed }: { session: LiveSession; onClosed: () => void }) {
  const insets = useSafeAreaInsets();
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const cameraTracks = useTracks([Track.Source.Camera]);
  const [leaving, setLeaving] = useState(false);

  const hostCamera = useMemo(
    () => cameraTracks.find((track) => track.participant.identity === session.creatorId),
    [cameraTracks, session.creatorId],
  );

  const viewerCount = Math.max(
    0,
    participants.filter((participant) => participant.identity !== session.creatorId).length,
  );

  async function leave(): Promise<void> {
    if (leaving) {
      return;
    }

    try {
      setLeaving(true);
      await leaveLiveSession(session.id);
    } catch (cause) {
      console.error('Unable to leave live session', cause);
    } finally {
      onClosed();
    }
  }

  return (
    <View style={styles.room}>
      {hostCamera ? (
        <VideoTrack trackRef={hostCamera} style={StyleSheet.absoluteFill} mirror={false} />
      ) : (
        <View style={styles.waiting}>
          {connectionState !== ConnectionState.Connected ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : null}

          <AppText style={styles.waitingTitle}>
            {connectionState === ConnectionState.Connected
              ? 'Waiting for live video…'
              : 'Joining live Vibe…'}
          </AppText>

          <AppText style={styles.waitingSubtitle}>{session.creator.displayName}</AppText>
        </View>
      )}

      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <AppText style={styles.liveBadgeText}>LIVE</AppText>
          </View>

          <View style={styles.viewerBadge}>
            <AppText style={styles.viewerText}>{viewerCount} watching</AppText>
          </View>
        </View>

        <View style={[styles.bottom, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.identity}>
            <AppText style={styles.creator}>{session.creator.displayName}</AppText>

            <AppText style={styles.title}>{session.title || 'Live Vibe'}</AppText>

            {session.description ? (
              <AppText style={styles.description}>{session.description}</AppText>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Leave live Vibe"
            disabled={leaving}
            onPress={() => {
              void leave();
            }}
            style={({ pressed }) => [
              styles.leaveButton,
              pressed ? styles.pressed : null,
              leaving ? styles.disabled : null,
            ]}
          >
            <AppText style={styles.leaveText}>{leaving ? 'Leaving…' : 'Leave Live'}</AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export function LiveViewerRoom({ access, session, visible, onClosed }: LiveViewerRoomProps) {
  useEffect(() => {
    if (!visible) {
      return;
    }

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
      onRequestClose={onClosed}
    >
      <LiveKitRoom
        serverUrl={access.serverUrl}
        token={access.token}
        connect
        audio
        video={false}
        options={{
          adaptiveStream: true,
          dynacast: true,
        }}
      >
        <ViewerContent session={session} onClosed={onClosed} />
      </LiveKitRoom>
    </Modal>
  );
}

const styles = StyleSheet.create({
  room: {
    flex: 1,
    backgroundColor: '#000000',
  },

  waiting: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080A0D',
    gap: 12,
    paddingHorizontal: 28,
  },

  waitingTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },

  waitingSubtitle: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 14,
    textAlign: 'center',
  },

  topBar: {
    paddingHorizontal: 18,
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
    backgroundColor: '#FFFFFF',
  },

  liveBadgeText: {
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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

  identity: {
    maxWidth: '86%',
    gap: 5,
  },

  creator: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },

  description: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 14,
    lineHeight: 20,
  },

  leaveButton: {
    alignSelf: 'flex-start',
    minWidth: 116,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.64)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  leaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },

  pressed: {
    opacity: 0.78,
  },

  disabled: {
    opacity: 0.55,
  },
});
