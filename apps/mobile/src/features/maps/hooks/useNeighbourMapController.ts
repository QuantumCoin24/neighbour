import {
  getNearbyGeoItems,
  type GeoEntityType,
  type GeoPoint,
  type NearbyGeoItem,
} from '@neighbour/api-client';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { MapLocationStatus, MapPresentationMode } from '../types';

const MANCHESTER_LAUNCH_ORIGIN: GeoPoint = {
  latitude: 53.4808,
  longitude: -2.2426,
};

const DEFAULT_RADIUS_KM = 10;

const ALL_TYPES: GeoEntityType[] = ['NEIGHBOURHOOD', 'COMMUNITY', 'EVENT', 'BUSINESS'];

function locationObjectToPoint(location: Location.LocationObject): GeoPoint {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

export function useNeighbourMapController() {
  const requestSequence = useRef(0);

  const [origin, setOrigin] = useState<GeoPoint>(MANCHESTER_LAUNCH_ORIGIN);
  const [items, setItems] = useState<NearbyGeoItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<GeoEntityType[]>(ALL_TYPES);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [mode, setMode] = useState<MapPresentationMode>('map');
  const [locationStatus, setLocationStatus] = useState<MapLocationStatus>('checking');
  const [usingFallbackLocation, setUsingFallbackLocation] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraRevision, setCameraRevision] = useState(0);

  const loadNearby = useCallback(
    async (
      options: {
        refresh?: boolean;
        point?: GeoPoint;
        radius?: number;
        types?: GeoEntityType[];
      } = {},
    ) => {
      const point = options.point ?? origin;
      const radius = options.radius ?? radiusKm;
      const types = options.types ?? selectedTypes;

      const requestId = requestSequence.current + 1;
      requestSequence.current = requestId;

      if (options.refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const response = await getNearbyGeoItems({
          ...point,
          radiusKm: radius,
          types,
          limit: 200,
        });

        if (requestSequence.current !== requestId) {
          return;
        }

        setItems(response.items);

        setSelectedItemId((current) =>
          current && response.items.some((item) => item.id === current) ? current : null,
        );
      } catch {
        if (requestSequence.current === requestId) {
          setError(
            'Nearby places could not be loaded. Check that the API and database are available.',
          );
        }
      } finally {
        if (requestSequence.current === requestId) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [origin, radiusKm, selectedTypes],
  );

  const resolveExistingPermission = useCallback(async () => {
    setLocationStatus('checking');

    try {
      const permission = await Location.getForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setLocationStatus(permission.canAskAgain ? 'fallback' : 'denied');
        setUsingFallbackLocation(true);

        return;
      }

      const lastKnown = await Location.getLastKnownPositionAsync();

      if (lastKnown) {
        const point = locationObjectToPoint(lastKnown);

        setOrigin(point);
        setUsingFallbackLocation(false);
        setLocationStatus('granted');
        setCameraRevision((value) => value + 1);

        return;
      }

      setLocationStatus('fallback');
      setUsingFallbackLocation(true);
    } catch {
      setLocationStatus('unavailable');
      setUsingFallbackLocation(true);
    }
  }, []);

  const requestLocation = useCallback(async () => {
    setLocating(true);
    setLocationStatus('requesting');
    setError(null);

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        setLocationStatus('unavailable');
        setUsingFallbackLocation(true);
        setError(
          'Location Services are switched off. Enable them in device settings to use your current position.',
        );

        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setLocationStatus('denied');
        setUsingFallbackLocation(true);

        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const point = locationObjectToPoint(location);

      setOrigin(point);
      setUsingFallbackLocation(false);
      setLocationStatus('granted');
      setCameraRevision((value) => value + 1);

      await loadNearby({
        point,
        radius: radiusKm,
        types: selectedTypes,
      });
    } catch {
      setLocationStatus('unavailable');
      setUsingFallbackLocation(true);
      setError(
        'Your current location could not be determined. Neighbour Maps will continue using the launch area.',
      );
    } finally {
      setLocating(false);
    }
  }, [loadNearby, radiusKm, selectedTypes]);

  const recenter = useCallback(async () => {
    if (locationStatus === 'granted') {
      setLocating(true);

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const point = locationObjectToPoint(location);

        setOrigin(point);
        setUsingFallbackLocation(false);
        setCameraRevision((value) => value + 1);

        await loadNearby({
          point,
          radius: radiusKm,
          types: selectedTypes,
        });
      } catch {
        setError(
          'Your position could not be refreshed. The previous map position is still being used.',
        );
      } finally {
        setLocating(false);
      }

      return;
    }

    await requestLocation();
  }, [loadNearby, locationStatus, radiusKm, requestLocation, selectedTypes]);

  const changeRadius = useCallback(
    (value: number) => {
      setRadiusKm(value);
      setSelectedItemId(null);

      void loadNearby({
        radius: value,
      });
    },
    [loadNearby],
  );

  const toggleType = useCallback(
    (type: GeoEntityType) => {
      setSelectedTypes((current) => {
        const removing = current.includes(type);

        const next = removing ? current.filter((item) => item !== type) : [...current, type];

        const safeNext = next.length > 0 ? next : [type];

        setSelectedItemId(null);

        void loadNearby({
          types: safeNext,
        });

        return safeNext;
      });
    },
    [loadNearby],
  );

  const refresh = useCallback(async () => {
    await loadNearby({
      refresh: true,
    });
  }, [loadNearby]);

  const resetToLaunchArea = useCallback(() => {
    setOrigin(MANCHESTER_LAUNCH_ORIGIN);
    setUsingFallbackLocation(true);
    setLocationStatus('fallback');
    setCameraRevision((value) => value + 1);

    void loadNearby({
      point: MANCHESTER_LAUNCH_ORIGIN,
    });
  }, [loadNearby]);

  useEffect(() => {
    void resolveExistingPermission();
  }, [resolveExistingPermission]);

  useEffect(() => {
    void loadNearby();
  }, []);

  const filteredItems = useMemo(
    () => items.filter((item) => selectedTypes.includes(item.type)),
    [items, selectedTypes],
  );

  const selectedItem = useMemo(
    () => filteredItems.find((item) => item.id === selectedItemId) ?? null,
    [filteredItems, selectedItemId],
  );

  const counts = useMemo(() => {
    const result: Record<GeoEntityType, number> = {
      NEIGHBOURHOOD: 0,
      COMMUNITY: 0,
      EVENT: 0,
      BUSINESS: 0,
    };

    for (const item of items) {
      result[item.type] += 1;
    }

    return result;
  }, [items]);

  return {
    origin,
    items,
    filteredItems,
    selectedItem,
    selectedTypes,
    radiusKm,
    mode,
    locationStatus,
    loading,
    refreshing,
    locating,
    error,
    usingFallbackLocation,
    cameraRevision,
    counts,

    setMode,
    selectItem: setSelectedItemId,
    clearSelection: () => {
      setSelectedItemId(null);
    },
    toggleType,
    changeRadius,
    requestLocation,
    recenter,
    refresh,
    retry: loadNearby,
    resetToLaunchArea,
  };
}
