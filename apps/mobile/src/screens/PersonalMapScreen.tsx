import {
  createMapDiscovery,
  createSecurityReport,
  deleteMapDiscovery,
  updateMapDiscovery,
  getMyMapDiscoveries,
  getPublicProfileMapDiscoveries,
  type MapDiscovery,
  type MapDiscoveryCategory,
  type MapDiscoveryType,
  type MapDiscoveryVisibility,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSessionAccessToken } from '../auth/session';
import { AppText, Button, Card } from '../components';
import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonalMap'>;

type Coordinate = {
  latitude: number;
  longitude: number;
};

const FALLBACK_REGION = {
  latitude: 53.4808,
  longitude: -2.2426,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const CATEGORIES: {
  id: MapDiscoveryCategory;
  label: string;
  symbol: string;
}[] = [
  { id: 'NATURE', label: 'Nature', symbol: '✿' },
  { id: 'WALK', label: 'Walk', symbol: '↟' },
  { id: 'ACTIVITY', label: 'Activity', symbol: '●' },
  { id: 'VIEWPOINT', label: 'Viewpoint', symbol: '◉' },
  { id: 'LOCAL_HISTORY', label: 'Local history', symbol: '⌂' },
  { id: 'ART_CULTURE', label: 'Art & culture', symbol: '◇' },
  { id: 'COMMUNITY', label: 'Community', symbol: '◎' },
  { id: 'OTHER', label: 'Other', symbol: '•' },
];

const TYPES: {
  id: MapDiscoveryType;
  label: string;
}[] = [
  { id: 'LANDMARK', label: 'Landmark' },
  { id: 'MOMENT', label: 'Moment' },
  { id: 'SEASONAL', label: 'Seasonal' },
];

const VISIBILITIES: {
  id: MapDiscoveryVisibility;
  label: string;
}[] = [
  { id: 'PRIVATE', label: 'Private' },
  { id: 'PUBLIC', label: 'Public' },
];

function categorySymbol(category: MapDiscoveryCategory): string {
  return CATEGORIES.find((item) => item.id === category)?.symbol ?? '•';
}

function formatType(type: MapDiscoveryType): string {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function defaultExpiry(type: MapDiscoveryType): Date | null {
  const date = new Date();

  if (type === 'MOMENT') {
    date.setDate(date.getDate() + 1);
    return date;
  }

  if (type === 'SEASONAL') {
    date.setMonth(date.getMonth() + 3);
    return date;
  }

  return null;
}

export default function PersonalMapScreen({ navigation, route }: Props) {
  const { theme } = useNeighbourTheme();
  const mapRef = useRef<MapView | null>(null);

  const owner = route.params.owner;
  const username = route.params.username;
  const displayName = route.params.displayName?.trim() || username;

  const [discoveries, setDiscoveries] = useState<MapDiscovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MapDiscovery | null>(null);
  const [dropping, setDropping] = useState(false);
  const [draftPoint, setDraftPoint] = useState<Coordinate | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MapDiscoveryCategory>('OTHER');
  const [type, setType] = useState<MapDiscoveryType>('LANDMARK');
  const [visibility, setVisibility] = useState<MapDiscoveryVisibility>('PRIVATE');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        if (owner) {
          const token = getSessionAccessToken();

          if (!token) {
            throw new Error('Your session has expired. Please sign in again.');
          }

          const result = await getMyMapDiscoveries(token);
          setDiscoveries(result.filter((item) => item.scope === 'PERSONAL'));
        } else {
          setDiscoveries(await getPublicProfileMapDiscoveries(username));
        }
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Neighbour could not load this Personal Map.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [owner, username],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!discoveries.length) {
      return;
    }

    const first = discoveries[0];

    mapRef.current?.animateToRegion(
      {
        latitude: first.latitude,
        longitude: first.longitude,
        latitudeDelta: 0.035,
        longitudeDelta: 0.035,
      },
      350,
    );
  }, [discoveries]);

  const cancelDrop = () => {
    setDropping(false);
    setDraftPoint(null);
    setTitle('');
    setDescription('');
    setCategory('OTHER');
    setType('LANDMARK');
    setVisibility('PRIVATE');
  };

  const saveDiscovery = async () => {
    if (!owner || !draftPoint || saving) {
      return;
    }

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!cleanTitle) {
      Alert.alert('Add a title', 'Give this discovery a short name before saving it.');
      return;
    }

    const token = getSessionAccessToken();

    if (!token) {
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }

    const expiry = defaultExpiry(type);

    setSaving(true);

    try {
      await createMapDiscovery(token, {
        scope: 'PERSONAL',
        type,
        category,
        title: cleanTitle,
        description: cleanDescription,
        latitude: draftPoint.latitude,
        longitude: draftPoint.longitude,
        visibility,
        ...(type === 'SEASONAL' ? { startsAt: new Date().toISOString() } : {}),
        ...(expiry ? { expiresAt: expiry.toISOString() } : {}),
      });

      cancelDrop();
      await load(true);
    } catch (caughtError) {
      Alert.alert(
        'Discovery not saved',
        caughtError instanceof Error
          ? caughtError.message
          : 'Neighbour could not save this discovery.',
      );
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (item: MapDiscovery) => {
    if (!owner) return;

    setDropping(false);
    setDraftPoint(null);
    setEditingId(item.id);
    setSelected(item);
    setTitle(item.title);
    setDescription(item.description);
    setCategory(item.category);
    setType(item.type);
    setVisibility(item.visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCategory('OTHER');
    setType('LANDMARK');
    setVisibility('PRIVATE');
  };

  const saveEdit = async (item: MapDiscovery) => {
    if (!owner || editingId !== item.id || saving) return;

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      Alert.alert('Add a title', 'Give this discovery a short name before saving it.');
      return;
    }

    const token = getSessionAccessToken();
    if (!token) {
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }

    const expiry = defaultExpiry(type);
    setSaving(true);

    try {
      await updateMapDiscovery(token, item.id, {
        type,
        category,
        title: cleanTitle,
        description: description.trim(),
        visibility,
        startsAt: type === 'SEASONAL' ? new Date().toISOString() : null,
        expiresAt: expiry ? expiry.toISOString() : null,
      });

      setEditingId(null);
      await load(true);
    } catch (caughtError) {
      Alert.alert(
        'Changes not saved',
        caughtError instanceof Error
          ? caughtError.message
          : 'Neighbour could not update this discovery.',
      );
    } finally {
      setSaving(false);
    }
  };

  const submitDiscoveryReport = async (item: MapDiscovery, reason: string) => {
    if (owner || reportingId) return;

    const token = getSessionAccessToken();
    if (!token) {
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }

    setReportingId(item.id);

    try {
      await createSecurityReport(token, {
        targetType: 'MAP_DISCOVERY',
        targetId: item.id,
        reason,
        description: `Personal Map discovery: ${item.title}`,
      });

      Alert.alert('Report submitted', 'Neighbour’s moderation team will review this discovery.');
    } catch (caughtError) {
      Alert.alert(
        'Report not submitted',
        caughtError instanceof Error
          ? caughtError.message
          : 'Neighbour could not submit this report.',
      );
    } finally {
      setReportingId(null);
    }
  };

  const openReportMenu = (item: MapDiscovery) => {
    Alert.alert('Report discovery', 'Why are you reporting this discovery?', [
      {
        text: 'Inappropriate',
        onPress: () => void submitDiscoveryReport(item, 'INAPPROPRIATE'),
      },
      {
        text: 'Misleading or false',
        onPress: () => void submitDiscoveryReport(item, 'MISLEADING'),
      },
      {
        text: 'Safety concern',
        onPress: () => void submitDiscoveryReport(item, 'SAFETY_CONCERN'),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const removeDiscovery = async (item: MapDiscovery) => {
    if (!owner || deleting) {
      return;
    }

    const token = getSessionAccessToken();

    if (!token) {
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }

    setDeleting(true);

    try {
      await deleteMapDiscovery(token, item.id);
      setSelected(null);
      await load(true);
    } catch (caughtError) {
      Alert.alert(
        'Discovery not removed',
        caughtError instanceof Error
          ? caughtError.message
          : 'Neighbour could not remove this discovery.',
      );
    } finally {
      setDeleting(false);
    }
  };

  const confirmRemove = (item: MapDiscovery) => {
    Alert.alert('Remove discovery?', `Remove "${item.title}" from your Personal Map?`, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void removeDiscovery(item);
        },
      },
    ]);
  };

  const initialRegion = discoveries[0]
    ? {
        latitude: discoveries[0].latitude,
        longitude: discoveries[0].longitude,
        latitudeDelta: 0.035,
        longitudeDelta: 0.035,
      }
    : FALLBACK_REGION;

  if (loading) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          {
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <AppText tone="secondary">Opening Personal Map…</AppText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Back"
          accessibilityRole="button"
          onPress={() => {
            navigation.goBack();
          }}
          style={[
            styles.backButton,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="bodyStrong">‹</AppText>
        </Pressable>

        <View style={styles.topCopy}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {owner ? 'Your Personal Map' : `${displayName}'s Personal Map`}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {discoveries.length} {discoveries.length === 1 ? 'discovery' : 'discoveries'}
          </AppText>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Trails"
          onPress={() => {
            navigation.navigate('Trails', {
              mode: 'PERSONAL',
              username,
              owner,
              displayName,
            });
          }}
          style={[
            styles.trailsButton,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="label" tone="brand">
            Trails ↝
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Adventures"
          onPress={() => {
            navigation.navigate('Adventures', {
              mode: 'PERSONAL',
              username,
              owner,
              displayName,
            });
          }}
          style={[
            styles.trailsButton,
            {
              backgroundColor: theme.colors.surfaceMuted,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="label" tone="brand">
            Adventures ↝
          </AppText>
        </Pressable>
        {owner ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={dropping ? 'Cancel dropping a pin' : 'Drop a pin'}
            onPress={() => {
              if (dropping) {
                cancelDrop();
              } else {
                setSelected(null);
                setDropping(true);
              }
            }}
            style={[
              styles.dropButton,
              {
                backgroundColor: dropping ? theme.colors.surfaceMuted : theme.colors.primary,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="label" tone={dropping ? 'primary' : 'inverse'}>
              {dropping ? 'Cancel' : 'Drop a pin'}
            </AppText>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void load(true);
              }}
            >
              <Card variant="muted" style={styles.card}>
                <AppText variant="bodyStrong">Map unavailable</AppText>
                <AppText tone="secondary">{error}</AppText>
                <AppText variant="label" tone="brand">
                  Tap to retry
                </AppText>
              </Card>
            </Pressable>
          ) : null}

          <View
            style={[
              styles.mapShell,
              {
                borderColor: theme.colors.border,
                borderRadius: theme.radius.xl,
              },
            ]}
          >
            <MapView
              ref={mapRef}
              initialRegion={initialRegion}
              onPress={(event) => {
                if (!dropping) {
                  return;
                }

                setDraftPoint({
                  latitude: event.nativeEvent.coordinate.latitude,
                  longitude: event.nativeEvent.coordinate.longitude,
                });
                setSelected(null);
              }}
              style={styles.map}
            >
              {discoveries.map((item) => (
                <Marker
                  key={item.id}
                  coordinate={{
                    latitude: item.latitude,
                    longitude: item.longitude,
                  }}
                  onPress={() => {
                    setSelected(item);
                  }}
                  title={item.title}
                >
                  <View
                    style={[
                      styles.marker,
                      {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.surface,
                      },
                    ]}
                  >
                    <AppText variant="bodyStrong" tone="inverse">
                      {categorySymbol(item.category)}
                    </AppText>
                  </View>
                </Marker>
              ))}

              {draftPoint ? (
                <Marker coordinate={draftPoint} pinColor={theme.colors.danger} />
              ) : null}
            </MapView>

            {dropping && !draftPoint ? (
              <View
                pointerEvents="none"
                style={[
                  styles.mapInstruction,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText variant="caption">Tap the exact place on the map</AppText>
              </View>
            ) : null}
          </View>

          {dropping && draftPoint ? (
            <Card style={styles.form}>
              <View>
                <AppText variant="overline" tone="brand">
                  NEW DISCOVERY
                </AppText>
                <AppText variant="subheading">What did you find?</AppText>
                <AppText variant="caption" tone="secondary">
                  {draftPoint.latitude.toFixed(6)}, {draftPoint.longitude.toFixed(6)}
                </AppText>
              </View>

              <View style={styles.field}>
                <AppText variant="caption" tone="secondary">
                  Title
                </AppText>
                <TextInput
                  maxLength={120}
                  onChangeText={setTitle}
                  placeholder="The Sunflowers"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.lg,
                      color: theme.colors.text,
                    },
                  ]}
                  value={title}
                />
              </View>

              <View style={styles.field}>
                <AppText variant="caption" tone="secondary">
                  Description
                </AppText>
                <TextInput
                  multiline
                  onChangeText={setDescription}
                  placeholder="What makes this place worth remembering?"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[
                    styles.input,
                    styles.multilineInput,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.lg,
                      color: theme.colors.text,
                    },
                  ]}
                  value={description}
                />
              </View>

              <View style={styles.field}>
                <AppText variant="caption" tone="secondary">
                  Category
                </AppText>
                <View style={styles.chips}>
                  {CATEGORIES.map((item) => {
                    const active = category === item.id;

                    return (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => {
                          setCategory(item.id);
                        }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active
                              ? theme.colors.primary
                              : theme.colors.surfaceMuted,
                            borderColor: active ? theme.colors.primary : theme.colors.border,
                            borderRadius: theme.radius.pill,
                          },
                        ]}
                      >
                        <AppText variant="caption" tone={active ? 'inverse' : 'secondary'}>
                          {item.symbol} {item.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <AppText variant="caption" tone="secondary">
                  Lifecycle
                </AppText>
                <View style={styles.chips}>
                  {TYPES.map((item) => {
                    const active = type === item.id;

                    return (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => {
                          setType(item.id);
                        }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active
                              ? theme.colors.primary
                              : theme.colors.surfaceMuted,
                            borderColor: active ? theme.colors.primary : theme.colors.border,
                            borderRadius: theme.radius.pill,
                          },
                        ]}
                      >
                        <AppText variant="caption" tone={active ? 'inverse' : 'secondary'}>
                          {item.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <AppText variant="caption" tone="secondary">
                  Visibility
                </AppText>
                <View style={styles.chips}>
                  {VISIBILITIES.map((item) => {
                    const active = visibility === item.id;

                    return (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        onPress={() => {
                          setVisibility(item.id);
                        }}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active
                              ? theme.colors.primary
                              : theme.colors.surfaceMuted,
                            borderColor: active ? theme.colors.primary : theme.colors.border,
                            borderRadius: theme.radius.pill,
                          },
                        ]}
                      >
                        <AppText variant="caption" tone={active ? 'inverse' : 'secondary'}>
                          {item.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Button
                disabled={!title.trim() || saving}
                label="Save discovery"
                loading={saving}
                onPress={() => {
                  void saveDiscovery();
                }}
              />
            </Card>
          ) : null}

          {selected ? (
            <Card style={styles.card}>
              <View style={styles.discoveryHeading}>
                <View
                  style={[
                    styles.discoverySymbol,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderRadius: theme.radius.lg,
                    },
                  ]}
                >
                  <AppText variant="subheading">{categorySymbol(selected.category)}</AppText>
                </View>

                <View style={styles.discoveryCopy}>
                  <AppText variant="subheading">{selected.title}</AppText>
                  <AppText variant="caption" tone="secondary">
                    {formatType(selected.type)} · {selected.visibility.toLowerCase()}
                  </AppText>
                </View>
              </View>

              {selected.description ? (
                <AppText tone="secondary">{selected.description}</AppText>
              ) : null}

              <AppText variant="caption" tone="secondary">
                {selected.latitude.toFixed(6)}, {selected.longitude.toFixed(6)}
              </AppText>

              {owner ? (
                editingId === selected.id ? (
                  <>
                    <TextInput
                      maxLength={120}
                      onChangeText={setTitle}
                      placeholder="Discovery title"
                      placeholderTextColor={theme.colors.textMuted}
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.colors.surfaceMuted,
                          borderColor: theme.colors.border,
                          borderRadius: theme.radius.lg,
                          color: theme.colors.text,
                        },
                      ]}
                      value={title}
                    />
                    <TextInput
                      multiline
                      onChangeText={setDescription}
                      placeholder="What makes this place worth remembering?"
                      placeholderTextColor={theme.colors.textMuted}
                      style={[
                        styles.input,
                        styles.multilineInput,
                        {
                          backgroundColor: theme.colors.surfaceMuted,
                          borderColor: theme.colors.border,
                          borderRadius: theme.radius.lg,
                          color: theme.colors.text,
                        },
                      ]}
                      value={description}
                    />

                    <AppText variant="caption" tone="secondary">
                      Category
                    </AppText>
                    <View style={styles.chips}>
                      {CATEGORIES.map((item) => {
                        const active = category === item.id;
                        return (
                          <Pressable
                            key={item.id}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            onPress={() => setCategory(item.id)}
                            style={[
                              styles.chip,
                              {
                                backgroundColor: active
                                  ? theme.colors.primary
                                  : theme.colors.surfaceMuted,
                                borderColor: active ? theme.colors.primary : theme.colors.border,
                                borderRadius: theme.radius.pill,
                              },
                            ]}
                          >
                            <AppText variant="caption" tone={active ? 'inverse' : 'secondary'}>
                              {item.symbol} {item.label}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>

                    <AppText variant="caption" tone="secondary">
                      Lifecycle
                    </AppText>
                    <View style={styles.chips}>
                      {TYPES.map((item) => {
                        const active = type === item.id;
                        return (
                          <Pressable
                            key={item.id}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            onPress={() => setType(item.id)}
                            style={[
                              styles.chip,
                              {
                                backgroundColor: active
                                  ? theme.colors.primary
                                  : theme.colors.surfaceMuted,
                                borderColor: active ? theme.colors.primary : theme.colors.border,
                                borderRadius: theme.radius.pill,
                              },
                            ]}
                          >
                            <AppText variant="caption" tone={active ? 'inverse' : 'secondary'}>
                              {item.label}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>

                    <AppText variant="caption" tone="secondary">
                      Visibility
                    </AppText>
                    <View style={styles.chips}>
                      {VISIBILITIES.map((item) => {
                        const active = visibility === item.id;
                        return (
                          <Pressable
                            key={item.id}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            onPress={() => setVisibility(item.id)}
                            style={[
                              styles.chip,
                              {
                                backgroundColor: active
                                  ? theme.colors.primary
                                  : theme.colors.surfaceMuted,
                                borderColor: active ? theme.colors.primary : theme.colors.border,
                                borderRadius: theme.radius.pill,
                              },
                            ]}
                          >
                            <AppText variant="caption" tone={active ? 'inverse' : 'secondary'}>
                              {item.label}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>

                    {visibility === 'PUBLIC' ? (
                      <AppText variant="caption" tone="secondary">
                        Public discoveries share the location you selected. Avoid publishing
                        sensitive private locations.
                      </AppText>
                    ) : null}

                    <Button
                      disabled={!title.trim() || saving}
                      label={saving ? 'Saving…' : 'Save changes'}
                      loading={saving}
                      onPress={() => void saveEdit(selected)}
                    />
                    <Button label="Cancel" onPress={cancelEdit} variant="ghost" />
                  </>
                ) : (
                  <>
                    <Button
                      label="Edit discovery"
                      onPress={() => beginEdit(selected)}
                      variant="secondary"
                    />
                    <Button
                      disabled={deleting}
                      label="Remove discovery"
                      loading={deleting}
                      onPress={() => confirmRemove(selected)}
                      variant="secondary"
                    />
                  </>
                )
              ) : (
                <Button
                  disabled={reportingId === selected.id}
                  label={reportingId === selected.id ? 'Reporting…' : 'Report discovery'}
                  onPress={() => openReportMenu(selected)}
                  variant="ghost"
                />
              )}
            </Card>
          ) : null}

          {!discoveries.length && !dropping && !error ? (
            <Card variant="muted" style={styles.card}>
              <AppText variant="subheading">
                {owner ? 'Your map is ready' : 'No public discoveries yet'}
              </AppText>
              <AppText tone="secondary">
                {owner
                  ? 'Drop your first pin to remember an exact place, landmark or moment.'
                  : `${displayName} has not shared any public Personal Map discoveries yet.`}
              </AppText>

              {owner ? (
                <Button
                  label="Drop your first pin"
                  onPress={() => {
                    setDropping(true);
                  }}
                  variant="secondary"
                />
              ) : null}
            </Card>
          ) : null}

          {discoveries.length ? (
            <View style={styles.list}>
              <View style={styles.listHeading}>
                <AppText variant="subheading">Discoveries</AppText>
                {refreshing ? (
                  <ActivityIndicator color={theme.colors.primary} size="small" />
                ) : null}
              </View>

              {discoveries.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => {
                    setSelected(item);
                    mapRef.current?.animateToRegion(
                      {
                        latitude: item.latitude,
                        longitude: item.longitude,
                        latitudeDelta: 0.025,
                        longitudeDelta: 0.025,
                      },
                      300,
                    );
                  }}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.78 : 1,
                  })}
                >
                  <Card variant="muted" style={styles.discoveryRow}>
                    <View
                      style={[
                        styles.discoverySymbol,
                        {
                          backgroundColor: theme.colors.surface,
                          borderRadius: theme.radius.lg,
                        },
                      ]}
                    >
                      <AppText variant="subheading">{categorySymbol(item.category)}</AppText>
                    </View>

                    <View style={styles.discoveryCopy}>
                      <AppText variant="bodyStrong">{item.title}</AppText>
                      <AppText variant="caption" tone="secondary">
                        {formatType(item.type)} · {item.visibility.toLowerCase()}
                      </AppText>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Card variant="muted" style={styles.card}>
            <AppText variant="caption" tone="secondary">
              Personal Map discoveries stay separate from Nearby. Saving a pin here never
              automatically publishes it to Neighbour's main Nearby map.
            </AppText>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  backButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  topCopy: {
    flex: 1,
  },
  trailsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 12,
  },
  dropButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: 15,
  },
  headerSpacer: {
    width: 42,
  },
  content: {
    gap: 16,
    paddingBottom: 42,
    paddingHorizontal: 18,
  },
  mapShell: {
    borderWidth: 1,
    height: 390,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapInstruction: {
    alignSelf: 'center',
    bottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    position: 'absolute',
  },
  marker: {
    alignItems: 'center',
    borderRadius: 19,
    borderWidth: 3,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  card: {
    gap: 10,
  },
  form: {
    gap: 18,
  },
  field: {
    gap: 8,
  },
  input: {
    borderWidth: 1,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  discoveryHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  discoveryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  discoverySymbol: {
    alignItems: 'center',
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  discoveryCopy: {
    flex: 1,
    gap: 2,
  },
  list: {
    gap: 10,
  },
  listHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
