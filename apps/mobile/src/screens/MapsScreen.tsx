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
import {
  MapFilters,
  NativeNeighbourMap,
  NearbyPlaceCard,
  useNeighbourMapController,
} from '../features/maps';
import { useNeighbourTheme } from '../theme';

const RADIUS_OPTIONS = [2, 5, 10, 25, 50];

export default function MapsScreen() {
  const { theme } = useNeighbourTheme();
  const map = useNeighbourMapController();

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
      <View style={styles.header}>
        <View style={styles.heading}>
          <AppText variant="overline" tone="brand">
            Neighbour Maps™
          </AppText>

          <AppText variant="title">Explore nearby</AppText>

          <AppText variant="bodyLarge" tone="secondary">
            Discover communities, events, businesses and neighbourhoods around you.
          </AppText>
        </View>

        <View
          style={[
            styles.modeControl,
            {
              backgroundColor: theme.colors.surfaceMuted,
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
                accessibilityState={{
                  selected,
                }}
                onPress={() => {
                  map.setMode(mode);
                }}
                style={[
                  styles.modeButton,
                  {
                    backgroundColor: selected ? theme.colors.primary : 'transparent',
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText
                  variant="caption"
                  tone={selected ? 'inverse' : 'secondary'}
                  style={styles.modeLabel}
                >
                  {mode === 'map' ? 'Map' : 'List'}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.filters}>
        <MapFilters
          counts={map.counts}
          onToggle={map.toggleType}
          selectedTypes={map.selectedTypes}
        />

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
            <AppText variant="bodyStrong">Using the Manchester launch area</AppText>

            <AppText variant="caption" tone="secondary">
              Neighbour does not publish or continuously track your precise location. Location
              access is only used to request nearby public places.
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
                borderRadius: theme.radius.lg,
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
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void map.retry();
          }}
          style={[
            styles.errorBanner,
            {
              backgroundColor: `${theme.colors.danger}14`,
              borderColor: theme.colors.danger,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          <AppText
            variant="caption"
            style={{
              color: theme.colors.danger,
            }}
          >
            {map.error} Tap to retry.
          </AppText>
        </Pressable>
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

              <AppText tone="secondary">Loading nearby places…</AppText>
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
              <AppText variant="subheading">No mapped places yet</AppText>

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
  header: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  heading: {
    flex: 1,
    gap: 7,
  },
  modeControl: {
    flexDirection: 'row',
    padding: 3,
  },
  modeButton: {
    minWidth: 52,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  modeLabel: {
    textAlign: 'center',
    fontWeight: '700',
  },
  filters: {
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  radiusContent: {
    gap: 8,
  },
  radiusButton: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  locationCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    marginHorizontal: 18,
    padding: 15,
  },
  locationCopy: {
    flex: 1,
    gap: 4,
  },
  locationButton: {
    alignItems: 'center',
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  errorBanner: {
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
    marginHorizontal: 18,
    padding: 12,
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
    gap: 14,
    justifyContent: 'center',
  },
  recenterButton: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    bottom: 18,
    height: 50,
    justifyContent: 'center',
    position: 'absolute',
    right: 18,
    width: 50,
  },
  recenterIcon: {
    fontSize: 24,
    lineHeight: 28,
  },
  list: {
    gap: 12,
    paddingBottom: 150,
    paddingHorizontal: 18,
  },
  listSummary: {
    gap: 3,
  },
  listLoading: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 60,
  },
  emptyCard: {
    gap: 8,
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
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
});
