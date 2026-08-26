import type { GeoPoint, NearbyGeoItem } from '@neighbour/api-client';
import { AppleMaps, GoogleMaps } from 'expo-maps';
import type { ComponentRef } from 'react';
import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

interface NativeNeighbourMapProps {
  origin: GeoPoint;
  items: NearbyGeoItem[];
  selectedItemId: string | null;
  cameraRevision: number;
  showUserLocation: boolean;
  onSelectItem: (itemId: string) => void;
}

function getMarkerColor(
  item: NearbyGeoItem,
  selected: boolean,
  colors: {
    primary: string;
    community: string;
    event: string;
    business: string;
    information: string;
  },
): string {
  if (selected) {
    return colors.primary;
  }

  switch (item.type) {
    case 'NEIGHBOURHOOD':
      return colors.information;
    case 'COMMUNITY':
      return colors.community;
    case 'EVENT':
      return colors.event;
    case 'BUSINESS':
      return colors.business;
  }
}

export function NativeNeighbourMap({
  origin,
  items,
  selectedItemId,
  cameraRevision,
  showUserLocation,
  onSelectItem,
}: NativeNeighbourMapProps) {
  const { theme, isDark } = useNeighbourTheme();

  const appleMapRef = useRef<ComponentRef<typeof AppleMaps.View>>(null);

  const cameraPosition = {
    coordinates: {
      latitude: origin.latitude,
      longitude: origin.longitude,
    },
    zoom: 12,
  };

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    /*
     * expo-maps treats cameraPosition as the INITIAL viewport.
     *
     * Nearby resolves location asynchronously, so force MapKit onto the
     * resolved user position once the native Apple Maps view has mounted.
     * This prevents the MapKit surface from remaining mounted with an
     * uninitialised/blank viewport.
     */
    const timer = setTimeout(() => {
      appleMapRef.current?.setCameraPosition({
        coordinates: {
          latitude: origin.latitude,
          longitude: origin.longitude,
        },
        zoom: 12,
      });
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [cameraRevision, origin.latitude, origin.longitude]);

  if (Platform.OS === 'ios') {
    const markers: AppleMaps.Marker[] = items.map((item) => ({
      id: item.id,
      coordinates: {
        latitude: item.latitude,
        longitude: item.longitude,
      },
      title: item.title,
      tintColor: getMarkerColor(item, item.id === selectedItemId, theme.colors),
      systemImage:
        item.type === 'COMMUNITY'
          ? 'person.3.fill'
          : item.type === 'EVENT'
            ? 'calendar'
            : item.type === 'BUSINESS'
              ? 'storefront.fill'
              : 'map.fill',
    }));

    return (
      <AppleMaps.View
        ref={appleMapRef}
        key={`apple-map-${cameraRevision}-${origin.latitude}-${origin.longitude}`}
        cameraPosition={cameraPosition}
        colorScheme={isDark ? AppleMaps.MapColorScheme.DARK : AppleMaps.MapColorScheme.LIGHT}
        markers={markers}
        onMarkerClick={(marker: AppleMaps.Marker) => {
          if (marker.id) {
            onSelectItem(marker.id);
          }
        }}
        properties={{
          isMyLocationEnabled: showUserLocation,
          selectionEnabled: true,
        }}
        style={styles.map}
        uiSettings={{
          compassEnabled: true,
          myLocationButtonEnabled: false,
          scaleBarEnabled: true,
          togglePitchEnabled: true,
        }}
      />
    );
  }

  if (Platform.OS === 'android') {
    const markers: GoogleMaps.Marker[] = items.map((item) => ({
      id: item.id,
      coordinates: {
        latitude: item.latitude,
        longitude: item.longitude,
      },
      title: item.title,
      snippet: `${item.distanceKm.toFixed(1)} km away`,
      showCallout: true,
      zIndex: item.id === selectedItemId ? 10 : 1,
    }));

    return (
      <GoogleMaps.View
        key={`google-map-${cameraRevision}`}
        cameraPosition={cameraPosition}
        colorScheme={isDark ? GoogleMaps.MapColorScheme.DARK : GoogleMaps.MapColorScheme.LIGHT}
        markers={markers}
        onMarkerClick={(marker: GoogleMaps.Marker) => {
          if (marker.id) {
            onSelectItem(marker.id);
          }
        }}
        properties={{
          isBuildingEnabled: true,
          isMyLocationEnabled: showUserLocation,
          selectionEnabled: true,
        }}
        style={styles.map}
        uiSettings={{
          compassEnabled: true,
          mapToolbarEnabled: false,
          myLocationButtonEnabled: false,
          rotationGesturesEnabled: true,
          scrollGesturesEnabled: true,
          tiltGesturesEnabled: true,
          zoomControlsEnabled: false,
          zoomGesturesEnabled: true,
        }}
      />
    );
  }

  return (
    <View style={styles.unsupported}>
      <Card variant="muted" style={styles.unsupportedCard}>
        <AppText variant="subheading">Native map unavailable</AppText>

        <AppText tone="secondary">
          Neighbour Maps requires the iPhone or Android development build. Nearby places remain
          available in List mode.
        </AppText>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  unsupported: {
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  unsupportedCard: {
    gap: 8,
  },
});
