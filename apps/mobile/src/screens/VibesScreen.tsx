import {
  recordVibeView,
  type Vibe,
} from '@neighbour/api-client';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import {
  useCallback,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type ViewToken,
} from 'react-native';

import { AppText } from '../components';
import {
  VibeCard,
  VibeCommentsSheet,
  useVibesFeed,
} from '../features/vibes';
import type { AppTabParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type VibesScreenProps =
  BottomTabScreenProps<AppTabParamList, 'Vibes'>;

interface WatchSession {
  vibeId: string;
  startedAt: number;
}

export default function VibesScreen(
  _props: VibesScreenProps,
) {
  const { theme } = useNeighbourTheme();
  const feed = useVibesFeed();

  const [viewportHeight, setViewportHeight] =
    useState(0);

  const [activeId, setActiveId] =
    useState<string | null>(null);

  const [commentsVibeId, setCommentsVibeId] =
    useState<string | null>(null);

  const watchRef = useRef<WatchSession | null>(
    null,
  );

  const itemsRef = useRef<Vibe[]>([]);
  itemsRef.current = feed.items;

  const finishWatch = useCallback(() => {
    const session = watchRef.current;

    if (!session) {
      return;
    }

    watchRef.current = null;

    const elapsedMs = Math.max(
      0,
      Date.now() - session.startedAt,
    );

    if (elapsedMs < 750) {
      return;
    }

    const vibe = itemsRef.current.find(
      (item) => item.id === session.vibeId,
    );

    const durationMs =
      vibe?.media[0]?.durationMs ?? null;

    const ratio =
      durationMs && durationMs > 0
        ? Math.min(1, elapsedMs / durationMs)
        : undefined;

    void recordVibeView(session.vibeId, {
      sessionKey: `mobile-${session.startedAt}`,
      watchTimeMs: elapsedMs,
      ...(ratio !== undefined
        ? {
            completionRatio: ratio,
            completed: ratio >= 0.9,
          }
        : {}),
      replay: false,
    }).catch(() => {
      // Analytics must never interrupt playback.
    });
  }, []);

  const beginWatch = useCallback(
    (vibeId: string) => {
      if (watchRef.current?.vibeId === vibeId) {
        return;
      }

      finishWatch();

      watchRef.current = {
        vibeId,
        startedAt: Date.now(),
      };

      setActiveId(vibeId);
    },
    [finishWatch],
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        finishWatch();
        setActiveId(null);
      };
    }, [finishWatch]),
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 75,
    minimumViewTime: 150,
  }).current;

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<Vibe>[];
    }) => {
      const visible = viewableItems.find(
        (entry) =>
          entry.isViewable && entry.item?.id,
      );

      if (visible?.item?.id) {
        beginWatch(visible.item.id);
      }
    },
  ).current;

  if (feed.loading) {
    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: '#080A0D',
          },
        ]}
      >
        <ActivityIndicator
          color={theme.colors.primary}
        />
        <AppText tone="inverse">
          Opening Vibes…
        </AppText>
      </View>
    );
  }

  if (feed.items.length === 0) {
    return (
      <View
        style={[
          styles.center,
          {
            backgroundColor: '#080A0D',
          },
        ]}
      >
        <AppText
          style={styles.emptyTitle}
          tone="inverse"
        >
          VIBES
        </AppText>

        <AppText
          style={styles.emptyCopy}
          tone="inverse"
        >
          Your neighbourhood has not started moving yet.
        </AppText>

        {feed.error ? (
          <AppText tone="inverse">
            {feed.error}
          </AppText>
        ) : null}
      </View>
    );
  }

  return (
    <View
      onLayout={(event) => {
        const nextHeight =
          event.nativeEvent.layout.height;

        if (
          nextHeight > 0 &&
          nextHeight !== viewportHeight
        ) {
          setViewportHeight(nextHeight);
        }
      }}
      style={styles.screen}
    >
      {viewportHeight > 0 ? (
        <FlatList
          data={feed.items}
          decelerationRate="fast"
          disableIntervalMomentum
          getItemLayout={(_, index) => ({
            index,
            length: viewportHeight,
            offset: viewportHeight * index,
          })}
          initialNumToRender={2}
          keyExtractor={(item) => item.id}
          maxToRenderPerBatch={3}
          onEndReached={() => {
            void feed.loadMore();
          }}
          onEndReachedThreshold={0.7}
          onViewableItemsChanged={
            onViewableItemsChanged
          }
          pagingEnabled
          refreshControl={
            <RefreshControl
              refreshing={feed.refreshing}
              onRefresh={() => {
                finishWatch();
                void feed.refresh();
              }}
              tintColor="#FFFFFF"
            />
          }
          removeClippedSubviews
          renderItem={({ item }) => (
            <VibeCard
              active={item.id === activeId}
              height={viewportHeight}
              onChange={feed.replaceItem}
              onComments={() => {
                setCommentsVibeId(item.id);
              }}
              vibe={item}
            />
          )}
          showsVerticalScrollIndicator={false}
          snapToAlignment="start"
          snapToInterval={viewportHeight}
          viewabilityConfig={viewabilityConfig}
          windowSize={3}
        />
      ) : null}

      {feed.loadingMore ? (
        <View style={styles.pagination}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : null}

      <VibeCommentsSheet
        onClose={() => {
          setCommentsVibeId(null);
        }}
        onCreated={() => {
          const vibe = feed.items.find(
            (item) => item.id === commentsVibeId,
          );

          if (!vibe) {
            return;
          }

          feed.replaceItem({
            ...vibe,
            engagement: {
              ...vibe.engagement,
              commentCount:
                vibe.engagement.commentCount + 1,
            },
          });
        }}
        vibeId={commentsVibeId}
        visible={Boolean(commentsVibeId)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#080A0D',
    flex: 1,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 3,
  },
  emptyCopy: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.72,
    textAlign: 'center',
  },
  pagination: {
    alignItems: 'center',
    bottom: 18,
    left: 0,
    position: 'absolute',
    right: 0,
  },
});
