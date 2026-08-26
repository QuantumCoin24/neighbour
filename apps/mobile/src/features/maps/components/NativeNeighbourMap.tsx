import type { GeoPoint, NearbyGeoItem } from '@neighbour/api-client';
import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_DEFAULT, type Region } from 'react-native-maps';

interface NativeNeighbourMapProps {
  origin: GeoPoint;
  radiusKm: number;
  items: NearbyGeoItem[];
  cameraRevision: number;
  onSelectItem?: (itemId: string) => void;
}

const DEFAULT_DELTA = 0.08;

export function NativeNeighbourMap({
  origin,
  radiusKm,
  items,
  cameraRevision,
  onSelectItem,
}: NativeNeighbourMapProps) {
  const mapRef = useRef<MapView>(null);

  const region = useMemo<Region>(
    () => ({
      latitude: origin.latitude,
      longitude: origin.longitude,
      latitudeDelta: DEFAULT_DELTA,
      longitudeDelta: DEFAULT_DELTA,
    }),
    [origin.latitude, origin.longitude],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      mapRef.current?.animateToRegion(region, 350);
    }, 250);

    return () => clearTimeout(timer);
  }, [cameraRevision, region]);

  if (Platform.OS !== 'ios') {
    return <View style={styles.map} />;
  }

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_DEFAULT}
      style={styles.map}
      initialRegion={region}
      showsUserLocation
      showsMyLocationButton={false}
      showsCompass
      showsScale={false}
      mapType="standard"
    >
      <Circle
        center={{
          latitude: origin.latitude,
          longitude: origin.longitude,
        }}
        radius={radiusKm * 1000}
        strokeWidth={1}
        strokeColor="rgba(47, 128, 237, 0.45)"
        fillColor="rgba(47, 128, 237, 0.08)"
      />

      {items.map((item) => (
        <Marker
          key={item.id}
          coordinate={{
            latitude: item.latitude,
            longitude: item.longitude,
          }}
          title={item.title}
          description={
            item.distanceKm != null ? `${item.distanceKm.toFixed(1)} km away` : undefined
          }
          onPress={() => onSelectItem?.(item.id)}
        />
      ))}
    </MapView>
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
});
