import type { Vibe } from '@neighbour/api-client';
import {
  Image,
  StyleSheet,
  View,
} from 'react-native';

import { VibeVideo } from './VibeVideo';

interface VibeMediaSurfaceProps {
  vibe: Vibe;
  active: boolean;
}

export function VibeMediaSurface({
  vibe,
  active,
}: VibeMediaSurfaceProps) {
  const media = vibe.media[0];

  if (!media?.publicUrl) {
    return (
      <View style={styles.empty}>
        <View style={styles.orbLarge} />
        <View style={styles.orbSmall} />
      </View>
    );
  }

  if (media.mimeType.startsWith('video/')) {
    return (
      <VibeVideo
        active={active}
        uri={media.publicUrl}
      />
    );
  }

  return (
    <View style={styles.imageCanvas}>
      <Image
        resizeMode="contain"
        source={{
          uri: media.publicUrl,
        }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  imageCanvas: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
  },
  empty: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#080A0D',
    overflow: 'hidden',
  },
  orbLarge: {
    position: 'absolute',
    width: 430,
    height: 430,
    borderRadius: 215,
    backgroundColor: 'rgba(55, 145, 112, 0.24)',
    top: -100,
    right: -170,
  },
  orbSmall: {
    position: 'absolute',
    width: 290,
    height: 290,
    borderRadius: 145,
    backgroundColor: 'rgba(255,255,255,0.055)',
    bottom: 80,
    left: -130,
  },
});
