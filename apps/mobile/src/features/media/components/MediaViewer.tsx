import type { PostMedia } from '@neighbour/api-client';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { AppText } from '../../../components';

interface MediaViewerProps {
  items: PostMedia[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
}

export function MediaViewer({ items, initialIndex, visible, onClose }: MediaViewerProps) {
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<PostMedia>>(null);
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setIndex(initialIndex);

    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({
        animated: false,
        index: initialIndex,
      });
    });
  }, [initialIndex, visible]);

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <SafeAreaView style={styles.screen}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Close photo viewer"
            accessibilityRole="button"
            onPress={onClose}
            style={styles.close}
          >
            <AppText variant="subheading" tone="inverse">
              ×
            </AppText>
          </Pressable>

          <AppText variant="label" tone="inverse">
            {index + 1} / {items.length}
          </AppText>

          <View style={styles.spacer} />
        </View>

        <FlatList
          data={items}
          decelerationRate="fast"
          getItemLayout={(_, itemIndex) => ({
            index: itemIndex,
            length: width,
            offset: width * itemIndex,
          })}
          horizontal
          initialScrollIndex={initialIndex}
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={onMomentumEnd}
          pagingEnabled
          ref={listRef}
          renderItem={({ item }) => (
            <View
              style={{
                height: height - 90,
                width,
              }}
            >
              {item.asset.url ? (
                <Image
                  accessibilityLabel={item.altText ?? `Photo ${item.position + 1}`}
                  resizeMode="contain"
                  source={{
                    uri: item.asset.url,
                  }}
                  style={styles.image}
                />
              ) : (
                <View style={styles.unavailable}>
                  <AppText tone="inverse">Photo unavailable</AppText>
                </View>
              )}
            </View>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#000000',
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 56,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  close: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  spacer: {
    height: 42,
    width: 42,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  unavailable: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
