import {
  VideoView,
  useVideoPlayer,
} from 'expo-video';
import { useEffect, useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

interface VibeVideoProps {
  uri: string;
  active: boolean;
}

export function VibeVideo({
  uri,
  active,
}: VibeVideoProps) {
  const source = useMemo(
    () => ({
      uri,
      useCaching: true,
    }),
    [uri],
  );

  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
  });

  useEffect(() => {
    if (active) {
      player.play();

      return;
    }

    player.pause();
  }, [active, player]);

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          player.playing
            ? 'Pause Vibe'
            : 'Play Vibe'
        }
        onPress={() => {
          if (player.playing) {
            player.pause();
          } else {
            player.play();
          }
        }}
        style={StyleSheet.absoluteFill}
      >
        <VideoView
          contentFit="cover"
          nativeControls={false}
          player={player}
          style={StyleSheet.absoluteFill}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
});
