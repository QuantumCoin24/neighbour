import { useEvent } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';

interface VibeVideoProps {
  uri: string;
  active: boolean;
}

export function VibeVideo({ uri, active }: VibeVideoProps) {
  const [muted, setMuted] = useState(true);

  const source = useMemo(
    () => ({
      uri,
      useCaching: true,
    }),
    [uri],
  );

  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  const { status } = useEvent(player, 'statusChange', {
    status: player.status,
  });

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player.playing,
  });

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    if (active) {
      player.play();

      return;
    }

    player.pause();
  }, [active, player]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        player.pause();

        return;
      }

      if (active) {
        player.play();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [active, player]);

  const loading = status === 'loading' || status === 'idle';

  const failed = status === 'error';

  const playing = isPlaying;

  return (
    <View style={styles.container}>
      <VideoView
        contentFit="cover"
        nativeControls={false}
        player={player}
        style={StyleSheet.absoluteFill}
      />

      <Pressable
        accessibilityLabel={playing ? 'Pause Vibe' : 'Play Vibe'}
        accessibilityRole="button"
        onPress={() => {
          if (failed) {
            player.replace(source);

            if (active) {
              player.play();
            }

            return;
          }

          if (playing) {
            player.pause();
          } else {
            player.play();
          }
        }}
        style={StyleSheet.absoluteFill}
      />

      {loading ? (
        <View pointerEvents="none" style={styles.loading}>
          <ActivityIndicator color="#FFFFFF" size="large" />
        </View>
      ) : null}

      {!loading && !playing && !failed ? (
        <View pointerEvents="none" style={styles.playIndicator}>
          <Text style={styles.playIcon}>▶</Text>
        </View>
      ) : null}

      {failed ? (
        <View pointerEvents="none" style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>Video unavailable</Text>

          <Text style={styles.errorCopy}>Tap to try again</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityLabel={muted ? 'Unmute Vibe' : 'Mute Vibe'}
        accessibilityRole="button"
        onPress={(event) => {
          event.stopPropagation();
          setMuted((value) => !value);
        }}
        style={styles.muteButton}
      >
        <Text style={styles.muteIcon}>{muted ? '🔇' : '🔊'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },

  loading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.14)',
    justifyContent: 'center',
  },

  playIndicator: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -36,
    marginTop: -36,
    position: 'absolute',
    top: '50%',
    width: 72,
  },

  playIcon: {
    color: '#FFFFFF',
    fontSize: 30,
    marginLeft: 4,
  },

  muteButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.46)',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    top: 18,
    width: 44,
  },

  muteIcon: {
    fontSize: 19,
  },

  errorOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)',
    justifyContent: 'center',
  },

  errorTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  errorCopy: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 13,
    marginTop: 5,
  },
});
