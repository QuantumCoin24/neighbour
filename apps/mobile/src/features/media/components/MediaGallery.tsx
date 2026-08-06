import type { PostMedia } from '@neighbour/api-client';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

import { MediaViewer } from './MediaViewer';

interface MediaGalleryProps {
  items: PostMedia[];
}

interface GalleryTileProps {
  item: PostMedia;
  style: StyleProp<ViewStyle>;
  onPress: () => void;
  overflow?: number;
}

function GalleryTile({ item, style, onPress, overflow = 0 }: GalleryTileProps) {
  const { theme } = useNeighbourTheme();

  return (
    <Pressable
      accessibilityLabel={item.altText ?? `Open photo ${item.position + 1}`}
      accessibilityRole="imagebutton"
      onPress={onPress}
      style={[
        styles.tile,
        {
          backgroundColor: theme.colors.surfaceMuted,
          borderRadius: theme.radius.md,
        },
        style,
      ]}
    >
      {item.asset.url ? (
        <Image resizeMode="cover" source={{ uri: item.asset.url }} style={styles.image} />
      ) : (
        <View style={styles.fallback}>
          <AppText variant="caption" tone="muted">
            Photo unavailable
          </AppText>
        </View>
      )}

      {overflow > 0 ? (
        <View style={styles.overflow}>
          <AppText variant="subheading" tone="inverse">
            +{overflow}
          </AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

export function MediaGallery({ items }: MediaGalleryProps) {
  const [viewerIndex, setViewerIndex] = useState(0);

  const [viewerVisible, setViewerVisible] = useState(false);

  if (items.length === 0) {
    return null;
  }

  const open = (index: number) => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  const viewer = (
    <MediaViewer
      initialIndex={viewerIndex}
      items={items}
      onClose={() => {
        setViewerVisible(false);
      }}
      visible={viewerVisible}
    />
  );

  if (items.length === 1) {
    return (
      <>
        <GalleryTile
          item={items[0]}
          onPress={() => {
            open(0);
          }}
          style={styles.single}
        />
        {viewer}
      </>
    );
  }

  if (items.length === 2) {
    return (
      <>
        <View style={styles.row}>
          {items.map((item, index) => (
            <GalleryTile
              item={item}
              key={item.id}
              onPress={() => {
                open(index);
              }}
              style={styles.half}
            />
          ))}
        </View>
        {viewer}
      </>
    );
  }

  if (items.length === 3) {
    return (
      <>
        <View style={styles.row}>
          <GalleryTile
            item={items[0]}
            onPress={() => {
              open(0);
            }}
            style={styles.hero}
          />

          <View style={styles.column}>
            {items.slice(1).map((item, index) => (
              <GalleryTile
                item={item}
                key={item.id}
                onPress={() => {
                  open(index + 1);
                }}
                style={styles.quarter}
              />
            ))}
          </View>
        </View>
        {viewer}
      </>
    );
  }

  const visibleItems = items.slice(0, 4);
  const overflow = Math.max(0, items.length - 4);

  return (
    <>
      <View style={styles.grid}>
        {visibleItems.map((item, index) => (
          <GalleryTile
            item={item}
            key={item.id}
            onPress={() => {
              open(index);
            }}
            overflow={index === 3 ? overflow : 0}
            style={styles.gridTile}
          />
        ))}
      </View>
      {viewer}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 3,
    height: 300,
    overflow: 'hidden',
  },
  column: {
    flex: 1,
    gap: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    height: 300,
    overflow: 'hidden',
  },
  tile: {
    overflow: 'hidden',
    position: 'relative',
  },
  single: {
    aspectRatio: 1.25,
    width: '100%',
  },
  half: {
    flex: 1,
    height: '100%',
  },
  hero: {
    flex: 1.6,
    height: '100%',
  },
  quarter: {
    flex: 1,
    width: '100%',
  },
  gridTile: {
    flexBasis: '49%',
    flexGrow: 1,
    height: '49%',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  fallback: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 12,
  },
  overflow: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.58)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
