import {
  getMyProfile,
  getNearbyGeoItems,
  resolvePostalLocation,
  type GeoEntityType,
  type GeoPoint,
  type NearbyGeoItem,
} from '@neighbour/api-client';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { MapLocationStatus, MapPresentationMode } from '../types';

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
  const initialLocationResolutionStarted = useRef(false);

  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [items, setItems] = useState<NearbyGeoItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<GeoEntityType[]>(ALL_TYPES);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);
  const [mode, setMode] = useState<MapPresentationMode>('map');
  const [locationStatus, setLocationStatus] = useState<MapLocationStatus>('checking');
  const [locationSource, setLocationSource] = useState<'device' | 'profile' | 'none'>('none');
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

      if (!point) {
        setItems([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }
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

  const resolveSavedProfileLocation = useCallback(async (): Promise<GeoPoint | null> => {
    try {
      const profile = await getMyProfile();

      if (typeof profile.latitude === 'number' && typeof profile.longitude === 'number') {
        return {
          latitude: profile.latitude,
          longitude: profile.longitude,
        };
      }

      if (profile.postalCode?.trim()) {
        const postal = await resolvePostalLocation({
          countryCode: profile.countryCode?.trim() || 'GB',
          postalCode: profile.postalCode.trim(),
        });

        if (
          postal.resolved &&
          typeof postal.latitude === 'number' &&
          typeof postal.longitude === 'number'
        ) {
          return {
            latitude: postal.latitude,
            longitude: postal.longitude,
          };
        }
      }
    } catch {
      // A missing/incomplete profile simply means there is no saved fallback.
    }

    return null;
  }, []);

  const applySavedProfileLocation = useCallback(async () => {
    const point = await resolveSavedProfileLocation();

    if (!point) {
      setOrigin(null);
      setLocationSource('none');
      setItems([]);
      setLocationStatus('fallback');
      setLoading(false);
      return false;
    }

    setOrigin(point);
    setLocationSource('profile');
    setLocationStatus('fallback');
    setCameraRevision((value) => value + 1);

    await loadNearby({
      point,
      radius: radiusKm,
      types: selectedTypes,
    });

    return true;
  }, [loadNearby, radiusKm, resolveSavedProfileLocation, selectedTypes]);

  const resolveExistingPermission = useCallback(async () => {
    setLocationStatus('checking');

    try {
      const permission = await Location.getForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        const saved = await applySavedProfileLocation();

        if (!saved) {
          setLocationStatus(permission.canAskAgain ? 'fallback' : 'denied');
        }

        return;
      }

      const lastKnown = await Location.getLastKnownPositionAsync();

      if (lastKnown) {
        const point = locationObjectToPoint(lastKnown);

        setOrigin(point);
        setLocationSource('device');
        setLocationStatus('granted');
        setCameraRevision((value) => value + 1);

        await loadNearby({
          point,
          radius: radiusKm,
          types: selectedTypes,
        });

        return;
      }

      await applySavedProfileLocation();
    } catch {
      const saved = await applySavedProfileLocation();

      if (!saved) {
        setLocationStatus('unavailable');
      }
    }
  }, [applySavedProfileLocation, loadNearby, radiusKm, selectedTypes]);

  const requestLocation = useCallback(async () => {
    setLocating(true);
    setLocationStatus('requesting');
    setError(null);

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        const saved = await applySavedProfileLocation();

        if (!saved) {
          setLocationStatus('unavailable');
          setError(
            'Location Services are switched off. Enable them or add a postcode to your profile.',
          );
        }

        return;
      }

      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        const saved = await applySavedProfileLocation();

        if (!saved) {
          setLocationStatus('denied');
        }

        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const point = locationObjectToPoint(location);

      setOrigin(point);
      setLocationSource('device');
      setLocationStatus('granted');
      setCameraRevision((value) => value + 1);

      await loadNearby({
        point,
        radius: radiusKm,
        types: selectedTypes,
      });
    } catch {
      const saved = await applySavedProfileLocation();

      if (!saved) {
        setLocationStatus('unavailable');
        setError(
          'Your current location could not be determined. Add a postcode to your profile or try again.',
        );
      }
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
        setLocationSource('device');
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

  useEffect(() => {
    if (initialLocationResolutionStarted.current) {
      return;
    }

    initialLocationResolutionStarted.current = true;

    void resolveExistingPermission();
  }, [resolveExistingPermission]);

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
    usingFallbackLocation: locationSource === 'profile',
    locationSource,
    hasResolvedLocation: origin !== null,
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
  };
}
