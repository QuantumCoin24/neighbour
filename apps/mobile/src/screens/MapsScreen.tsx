import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Card } from '../components';
import CompactStatusCard from '../components/system/CompactStatusCard';
import ScreenHero from '../components/system/ScreenHero';
import {
  MapFilters,
  NativeNeighbourMap,
  NearbyPlaceCard,
  useNeighbourMapController,
} from '../features/maps';
import type { RootStackParamList } from '../navigation/routes';
import { ROUTES } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

const RADIUS_OPTIONS = [2, 5, 10, 25, 50];

export default function MapsScreen() {
  const { theme } = useNeighbourTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const map = useNeighbourMapController();

  useEffect(() => {
    if (__DEV__ && map.error) {
      console.warn('[Neighbour/Nearby] load error:', map.error);
    }
  }, [map.error]);

  const permissionNeedsSettings = map.locationStatus === 'denied';

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <ScreenHero
        eyebrow="NEIGHBOUR MAPS™"
        title="Explore nearby"
        description="Discover communities, events and local places around you."
        symbol="⌖"
      >
        <View
          style={[
            styles.modeControl,
            {
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          {(['map', 'list'] as const).map((mode) => {
            const selected = map.mode === mode;

            return (
              <Pressable
                key={mode}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  map.setMode(mode);
                }}
                style={[
                  styles.modeButton,
                  {
                    backgroundColor: selected ? theme.colors.inverseText : 'transparent',
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  style={{
                    color: selected ? theme.colors.primaryStrong : theme.colors.inverseText,
                    fontWeight: '700',
                  }}
                >
                  {mode === 'map' ? 'Map' : 'List'}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </ScreenHero>

      <Pressable
        accessibilityLabel="Search Neighbour"
        accessibilityRole="button"
        onPress={() => {
          navigation.navigate(ROUTES.SEARCH);
        }}
        style={[
          styles.searchButton,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.xl,
          },
          theme.shadows.card,
        ]}
      >
        <View
          style={[
            styles.searchIcon,
            {
              backgroundColor: theme.colors.primarySoft,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText tone="brand" style={styles.searchIconText}>
            ⌕
          </AppText>
        </View>

        <View style={styles.searchCopy}>
          <AppText variant="bodyStrong">Search Neighbour</AppText>
          <AppText variant="caption" tone="secondary">
            Find people, communities, events and local activity.
          </AppText>
        </View>

        <AppText tone="brand" style={styles.searchArrow}>
          ›
        </AppText>
      </Pressable>

      <View style={styles.filters}>
        <View style={styles.filterInset}>
          <MapFilters
            counts={map.counts}
            onToggle={map.toggleType}
            selectedTypes={map.selectedTypes}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.radiusContent}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {RADIUS_OPTIONS.map((radius) => {
            const selected = map.radiusKm === radius;

            return (
              <Pressable
                key={radius}
                accessibilityRole="button"
                accessibilityState={{
                  selected,
                }}
                onPress={() => {
                  map.changeRadius(radius);
                }}
                style={[
                  styles.radiusButton,
                  {
                    backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText variant="caption" tone={selected ? 'brand' : 'secondary'}>
                  {radius} km
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {map.usingFallbackLocation ? (
        <Card variant="muted" style={styles.locationCard}>
          <View style={styles.locationCopy}>
            <AppText variant="bodyStrong">Manchester launch area</AppText>

            <AppText variant="caption" tone="secondary">
              Nearby results are using the Manchester launch area until you choose to share your
              location.
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={map.locating}
            onPress={() => {
              if (permissionNeedsSettings) {
                void Linking.openSettings();
              } else {
                void map.requestLocation();
              }
            }}
            style={[
              styles.locationButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.pill,
                opacity: map.locating ? 0.55 : 1,
              },
            ]}
          >
            {map.locating ? (
              <ActivityIndicator color={theme.colors.inverseText} size="small" />
            ) : (
              <AppText variant="label" tone="inverse">
                {permissionNeedsSettings ? 'Open settings' : 'Use my location'}
              </AppText>
            )}
          </Pressable>
        </Card>
      ) : null}

      {map.error ? (
        <View style={styles.statusWrap}>
          <CompactStatusCard
            title="Nearby is reconnecting"
            message={map.error}
            actionLabel="Retry"
            onPress={() => {
              void map.retry();
            }}
            tone="warning"
          />
        </View>
      ) : null}

      {map.mode === 'map' ? (
        <View
          style={[
            styles.mapContainer,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.xl,
            },
            theme.shadows.card,
          ]}
        >
          {map.loading ? (
            <View style={styles.mapLoading}>
              <ActivityIndicator color={theme.colors.primary} size="large" />

              <AppText tone="secondary">Finding nearby places…</AppText>
            </View>
          ) : (
            <NativeNeighbourMap
              cameraRevision={map.cameraRevision}
              items={map.filteredItems}
              onSelectItem={map.selectItem}
              origin={map.origin}
              selectedItemId={map.selectedItem?.id ?? null}
              showUserLocation={map.locationStatus === 'granted'}
            />
          )}

          <Pressable
            accessibilityLabel="Recenter map"
            accessibilityRole="button"
            disabled={map.locating}
            onPress={() => {
              void map.recenter();
            }}
            style={[
              styles.recenterButton,
              {
                backgroundColor: theme.colors.glassStrong,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.pill,
                opacity: map.locating ? 0.55 : 1,
              },
              theme.shadows.floating,
            ]}
          >
            {map.locating ? (
              <ActivityIndicator color={theme.colors.primary} size="small" />
            ) : (
              <AppText tone="brand" style={styles.recenterIcon}>
                ⌖
              </AppText>
            )}
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={map.refreshing}
              onRefresh={() => {
                void map.refresh();
              }}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.listSummary}>
            <AppText variant="subheading">{map.filteredItems.length} nearby places</AppText>

            <AppText variant="caption" tone="secondary">
              Within {map.radiusKm} km
            </AppText>
          </View>

          {map.loading ? (
            <View style={styles.listLoading}>
              <ActivityIndicator color={theme.colors.primary} size="large" />

              <AppText tone="secondary">Finding nearby places…</AppText>
            </View>
          ) : map.filteredItems.length === 0 ? (
            <Card variant="muted" style={styles.emptyCard}>
              <AppText variant="subheading">No nearby places yet</AppText>

              <AppText tone="secondary">
                Location-enabled communities, events and businesses within this radius will appear
                here as records are added.
              </AppText>
            </Card>
          ) : (
            map.filteredItems.map((item) => (
              <NearbyPlaceCard
                key={`${item.type}-${item.id}`}
                item={item}
                onPress={() => {
                  map.selectItem(item.id);
                }}
                selected={map.selectedItem?.id === item.id}
              />
            ))
          )}
        </ScrollView>
      )}

      {map.selectedItem ? (
        <View
          style={[
            styles.selection,
            {
              backgroundColor: theme.colors.glassStrong,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.xl,
            },
            theme.shadows.floating,
          ]}
        >
          <NearbyPlaceCard item={map.selectedItem} onPress={map.clearSelection} selected />

          <View style={styles.selectionActions}>
            <Pressable accessibilityRole="button" onPress={map.clearSelection}>
              <AppText variant="caption" tone="secondary">
                Close
              </AppText>
            </Pressable>

            {map.mode === 'list' ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  map.setMode('map');
                }}
              >
                <AppText variant="caption" tone="brand">
                  Show on map
                </AppText>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  modeControl: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    padding: 3,
  },

  modeButton: {
    minWidth: 62,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  searchButton: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 18,
    marginTop: 14,
    padding: 14,
  },

  searchIcon: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },

  searchIconText: {
    fontSize: 24,
    lineHeight: 28,
  },

  searchCopy: {
    flex: 1,
    gap: 3,
  },

  searchArrow: {
    fontSize: 26,
    lineHeight: 30,
  },

  filters: {
    gap: 12,
    paddingTop: 14,
    paddingBottom: 12,
  },

  filterInset: {
    paddingHorizontal: 18,
  },

  radiusContent: {
    gap: 8,
  },

  radiusButton: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },

  locationCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginBottom: 12,
    marginHorizontal: 18,
    padding: 14,
  },

  locationCopy: {
    flex: 1,
    gap: 3,
  },

  locationButton: {
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  statusWrap: {
    marginBottom: 10,
    marginHorizontal: 18,
  },

  mapContainer: {
    flex: 1,
    marginBottom: 14,
    marginHorizontal: 18,
    overflow: 'hidden',
    position: 'relative',
  },

  mapLoading: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },

  recenterButton: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    bottom: 16,
    height: 48,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    width: 48,
  },

  recenterIcon: {
    fontSize: 23,
    lineHeight: 27,
  },

  list: {
    gap: 12,
    paddingBottom: 150,
    paddingHorizontal: 18,
  },

  listSummary: {
    gap: 2,
  },

  listLoading: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 54,
  },

  emptyCard: {
    gap: 7,
  },

  selection: {
    bottom: 96,
    gap: 10,
    left: 18,
    padding: 10,
    position: 'absolute',
    right: 18,
  },

  selectionActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 4,
    paddingHorizontal: 8,
  },
});
