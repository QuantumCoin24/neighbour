import {
  createMapDiscovery,
  createSecurityReport,
  deleteMapDiscovery,
  updateMapDiscovery,
  getCommunityMapDiscoveries,
  getMyCommunities,
  type MapDiscovery,
  type MapDiscoveryCategory,
  type MapDiscoveryType,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { useAuth } from '../auth/auth-context';
import { getSessionAccessToken } from '../auth/session';
import { AppText, Button, Card, Screen } from '../components';
import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CommunityMap'>;

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

export default function CommunityMapScreen({ navigation, route }: Props) {
  const { theme } = useNeighbourTheme();
  const { user } = useAuth();

  const { communityId, communitySlug, communityName, latitude, longitude } = route.params;

  const [discoveries, setDiscoveries] = useState<MapDiscovery[]>([]);
  const [membership, setMembership] = useState<{
    role: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';
    status: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dropping, setDropping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<MapDiscovery | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [draftCoordinate, setDraftCoordinate] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MapDiscoveryCategory>('OTHER');
  const [type, setType] = useState<MapDiscoveryType>('LANDMARK');

  const mapRef = useRef<MapView | null>(null);

  const activeMember = membership?.status === 'ACTIVE';
  const canModerate =
    activeMember &&
    (membership?.role === 'OWNER' ||
      membership?.role === 'ADMIN' ||
      membership?.role === 'MODERATOR');

  const load = useCallback(
    async (quiet = false) => {
      const token = getSessionAccessToken();

      if (!token) {
        setError('Please sign in again to open this Community Map.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!quiet) {
        setLoading(true);
      }

      setError(null);

      try {
        const memberships = await getMyCommunities(token);
        const currentMembership =
          memberships.find(
            (item) => item.community.id === communityId || item.community.slug === communitySlug,
          ) ?? null;

        setMembership(
          currentMembership
            ? {
                role: currentMembership.role,
                status: currentMembership.status,
              }
            : null,
        );

        if (!currentMembership || currentMembership.status !== 'ACTIVE') {
          setDiscoveries([]);
          setSelected(null);
          return;
        }

        const result = await getCommunityMapDiscoveries(token, communityId);
        setDiscoveries(result);

        setSelected((current) => {
          if (!current) {
            return null;
          }

          return result.find((item) => item.id === current.id) ?? null;
        });

        const first = result[0];

        if (first) {
          mapRef.current?.animateToRegion(
            {
              latitude: Number(first.latitude),
              longitude: Number(first.longitude),
              latitudeDelta: 0.025,
              longitudeDelta: 0.025,
            },
            350,
          );
        }
      } catch (caughtError) {
        setError(
          caughtError instanceof Error ? caughtError.message : 'Community Map could not be loaded.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [communityId, communitySlug],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const beginDrop = () => {
    setDropping(true);
    setSelected(null);
    setDraftCoordinate(null);
    setTitle('');
    setDescription('');
    setCategory('OTHER');
    setType('LANDMARK');
  };

  const cancelDrop = () => {
    setDropping(false);
    setDraftCoordinate(null);
    setTitle('');
    setDescription('');
    setCategory('OTHER');
    setType('LANDMARK');
  };

  const saveDiscovery = async () => {
    if (!activeMember || !draftCoordinate || !title.trim() || saving) {
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
        scope: 'COMMUNITY',
        communityId,
        type,
        category,
        title: title.trim(),
        description: description.trim(),
        latitude: draftCoordinate.latitude,
        longitude: draftCoordinate.longitude,
        visibility: 'COMMUNITY',
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
          : 'Neighbour could not save this Community Map discovery.',
      );
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (item: MapDiscovery) => {
    if (item.creatorId !== user?.id) return;

    setDropping(false);
    setDraftCoordinate(null);
    setEditingId(item.id);
    setSelected(item);
    setTitle(item.title);
    setDescription(item.description);
    setCategory(item.category);
    setType(item.type);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setCategory('OTHER');
    setType('LANDMARK');
  };

  const saveEdit = async (item: MapDiscovery) => {
    if (item.creatorId !== user?.id || editingId !== item.id || saving) return;

    if (!title.trim()) {
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
        title: title.trim(),
        description: description.trim(),
        visibility: 'COMMUNITY',
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
          : 'Neighbour could not update this Community Map discovery.',
      );
    } finally {
      setSaving(false);
    }
  };

  const submitDiscoveryReport = async (item: MapDiscovery, reason: string) => {
    if (item.creatorId === user?.id || reportingId) return;

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
        description: `Community Map discovery: ${item.title}`,
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
    const ownDiscovery = item.creatorId === user?.id;

    if (!ownDiscovery && !canModerate) {
      return;
    }

    Alert.alert('Remove discovery?', 'This discovery will be removed from the Community Map.', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          const token = getSessionAccessToken();

          if (!token) {
            Alert.alert('Session expired', 'Please sign in again.');
            return;
          }

          void (async () => {
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
            }
          })();
        },
      },
    ]);
  };

  const initialRegion = useMemo(() => {
    const first = discoveries[0];

    if (first) {
      return {
        latitude: Number(first.latitude),
        longitude: Number(first.longitude),
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      };
    }

    if (latitude !== null && longitude !== null) {
      return {
        latitude,
        longitude,
        latitudeDelta: 0.045,
        longitudeDelta: 0.045,
      };
    }

    return FALLBACK_REGION;
  }, [discoveries, latitude, longitude]);

  if (loading) {
    return (
      <Screen contentStyle={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <AppText tone="secondary">Opening Community Map…</AppText>
      </Screen>
    );
  }

  if (!activeMember) {
    return (
      <Screen contentStyle={styles.screen}>
        <Button
          label="Back to community"
          onPress={() => {
            navigation.goBack();
          }}
          variant="ghost"
        />

        <Card variant="muted" style={styles.card}>
          <AppText variant="overline" tone="brand">
            COMMUNITY MAP
          </AppText>

          <AppText variant="title">{communityName}</AppText>

          <AppText tone="secondary">
            Community Map discoveries are available to active members of this community.
          </AppText>

          {error ? <AppText tone="secondary">{error}</AppText> : null}
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      contentStyle={styles.screen}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load(true);
          }}
        />
      }
    >
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <AppText variant="overline" tone="brand">
            COMMUNITY MAP
          </AppText>

          <AppText variant="title">{communityName}</AppText>

          <AppText tone="secondary">
            Places, landmarks and moments shared by this community.
          </AppText>
        </View>

        <View style={styles.headerActions}>
          <Button
            label="Trails ↝"
            onPress={() => {
              navigation.navigate('Trails', {
                mode: 'COMMUNITY',
                communityId,
                communitySlug,
                communityName,
                latitude,
                longitude,
              });
            }}
            variant="secondary"
          />
          <Button
            label={dropping ? 'Cancel' : 'Drop a pin'}
            onPress={dropping ? cancelDrop : beginDrop}
            variant={dropping ? 'secondary' : 'primary'}
          />
        </View>
      </View>

      <Card variant="muted" style={styles.card}>
        <AppText tone="secondary">
          Community Map discoveries stay inside this community. Saving a pin here never
          automatically publishes it to Neighbour&apos;s main Nearby map.
        </AppText>
      </Card>

      {error ? (
        <Card variant="muted" style={styles.card}>
          <AppText tone="secondary">{error}</AppText>
        </Card>
      ) : null}

      <View
        style={[
          styles.mapFrame,
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

            setDraftCoordinate(event.nativeEvent.coordinate);
            setSelected(null);
          }}
          style={styles.map}
        >
          {discoveries.map((item) => (
            <Marker
              coordinate={{
                latitude: Number(item.latitude),
                longitude: Number(item.longitude),
              }}
              key={item.id}
              onPress={() => {
                setSelected(item);
              }}
              title={item.title}
            />
          ))}

          {draftCoordinate ? (
            <Marker
              coordinate={draftCoordinate}
              pinColor={theme.colors.primary}
              title="New discovery"
            />
          ) : null}
        </MapView>
      </View>

      {dropping ? (
        <Card style={styles.card}>
          <AppText variant="subheading">Add a Community Map discovery</AppText>

          <AppText tone="secondary">
            Tap the exact place on the map, then describe what your community should know about it.
          </AppText>

          <TextInput
            accessibilityLabel="Discovery title"
            onChangeText={setTitle}
            placeholder="What is this place called?"
            placeholderTextColor={theme.colors.textSecondary}
            style={[
              styles.input,
              {
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                color: theme.colors.text,
              },
            ]}
            value={title}
          />

          <TextInput
            accessibilityLabel="Discovery description"
            multiline
            onChangeText={setDescription}
            placeholder="Tell the community what makes this place useful or interesting."
            placeholderTextColor={theme.colors.textSecondary}
            style={[
              styles.input,
              styles.textArea,
              {
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                color: theme.colors.text,
              },
            ]}
            value={description}
          />

          <AppText variant="label">Category</AppText>

          <View style={styles.choiceWrap}>
            {CATEGORIES.map((item) => {
              const selectedCategory = category === item.id;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={item.id}
                  onPress={() => {
                    setCategory(item.id);
                  }}
                  style={[
                    styles.choice,
                    {
                      backgroundColor: selectedCategory
                        ? theme.colors.primary
                        : theme.colors.surface,
                      borderColor: selectedCategory ? theme.colors.primary : theme.colors.border,
                      borderRadius: theme.radius.pill,
                    },
                  ]}
                >
                  <AppText tone={selectedCategory ? 'inverse' : 'primary'}>
                    {item.symbol} {item.label}
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <AppText variant="label">Lifecycle</AppText>

          <View style={styles.choiceWrap}>
            {TYPES.map((item) => {
              const selectedType = type === item.id;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={item.id}
                  onPress={() => {
                    setType(item.id);
                  }}
                  style={[
                    styles.choice,
                    {
                      backgroundColor: selectedType ? theme.colors.primary : theme.colors.surface,
                      borderColor: selectedType ? theme.colors.primary : theme.colors.border,
                      borderRadius: theme.radius.pill,
                    },
                  ]}
                >
                  <AppText tone={selectedType ? 'inverse' : 'primary'}>{item.label}</AppText>
                </Pressable>
              );
            })}
          </View>

          {draftCoordinate ? (
            <AppText variant="caption" tone="secondary">
              {draftCoordinate.latitude.toFixed(6)}, {draftCoordinate.longitude.toFixed(6)}
            </AppText>
          ) : (
            <AppText variant="caption" tone="secondary">
              Tap the map to choose the exact coordinate.
            </AppText>
          )}

          <Button
            disabled={!draftCoordinate || !title.trim() || saving}
            label={saving ? 'Saving…' : 'Save discovery'}
            loading={saving}
            onPress={() => {
              void saveDiscovery();
            }}
          />
        </Card>
      ) : null}

      {selected ? (
        <Card style={styles.card}>
          <AppText variant="overline" tone="brand">
            {selected.category.replaceAll('_', ' ')}
          </AppText>

          <AppText variant="subheading">{selected.title}</AppText>

          {selected.description ? <AppText tone="secondary">{selected.description}</AppText> : null}

          <AppText variant="caption" tone="secondary">
            {selected.type.replaceAll('_', ' ')}
          </AppText>

          {selected.creatorId === user?.id ? (
            editingId === selected.id ? (
              <>
                <TextInput
                  accessibilityLabel="Discovery title"
                  onChangeText={setTitle}
                  placeholder="What is this place called?"
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[
                    styles.input,
                    {
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.md,
                      color: theme.colors.text,
                    },
                  ]}
                  value={title}
                />
                <TextInput
                  accessibilityLabel="Discovery description"
                  multiline
                  onChangeText={setDescription}
                  placeholder="Tell the community what makes this place useful or interesting."
                  placeholderTextColor={theme.colors.textSecondary}
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.md,
                      color: theme.colors.text,
                    },
                  ]}
                  value={description}
                />

                <AppText variant="label">Category</AppText>
                <View style={styles.choiceWrap}>
                  {CATEGORIES.map((item) => {
                    const active = category === item.id;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={item.id}
                        onPress={() => setCategory(item.id)}
                        style={[
                          styles.choice,
                          {
                            backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                            borderColor: active ? theme.colors.primary : theme.colors.border,
                            borderRadius: theme.radius.pill,
                          },
                        ]}
                      >
                        <AppText tone={active ? 'inverse' : 'primary'}>
                          {item.symbol} {item.label}
                        </AppText>
                      </Pressable>
                    );
                  })}
                </View>

                <AppText variant="label">Lifecycle</AppText>
                <View style={styles.choiceWrap}>
                  {TYPES.map((item) => {
                    const active = type === item.id;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={item.id}
                        onPress={() => setType(item.id)}
                        style={[
                          styles.choice,
                          {
                            backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                            borderColor: active ? theme.colors.primary : theme.colors.border,
                            borderRadius: theme.radius.pill,
                          },
                        ]}
                      >
                        <AppText tone={active ? 'inverse' : 'primary'}>{item.label}</AppText>
                      </Pressable>
                    );
                  })}
                </View>

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
                  label="Remove"
                  onPress={() => void removeDiscovery(selected)}
                  variant="ghost"
                />
              </>
            )
          ) : (
            <>
              <Button
                disabled={reportingId === selected.id}
                label={reportingId === selected.id ? 'Reporting…' : 'Report discovery'}
                onPress={() => openReportMenu(selected)}
                variant="ghost"
              />
              {canModerate ? (
                <Button
                  label="Remove"
                  onPress={() => void removeDiscovery(selected)}
                  variant="ghost"
                />
              ) : null}
            </>
          )}
        </Card>
      ) : null}

      <View style={styles.sectionHeading}>
        <AppText variant="subheading">Community discoveries</AppText>
        <AppText variant="caption" tone="secondary">
          {discoveries.length} {discoveries.length === 1 ? 'place' : 'places'}
        </AppText>
      </View>

      {discoveries.length === 0 ? (
        <Card variant="muted" style={styles.card}>
          <AppText variant="subheading">No discoveries yet</AppText>
          <AppText tone="secondary">
            Drop the first pin to start building {communityName}&apos;s Community Map.
          </AppText>
        </Card>
      ) : (
        discoveries.map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item.id}
            onPress={() => {
              setSelected(item);
              mapRef.current?.animateToRegion(
                {
                  latitude: Number(item.latitude),
                  longitude: Number(item.longitude),
                  latitudeDelta: 0.018,
                  longitudeDelta: 0.018,
                },
                300,
              );
            }}
            style={({ pressed }) => ({
              opacity: pressed ? 0.78 : 1,
            })}
          >
            <Card style={styles.card}>
              <AppText variant="overline" tone="brand">
                {categorySymbol(item.category)} {item.category.replaceAll('_', ' ')}
              </AppText>

              <AppText variant="subheading">{item.title}</AppText>

              {item.description ? <AppText tone="secondary">{item.description}</AppText> : null}

              <AppText variant="caption" tone="secondary">
                {item.type.replaceAll('_', ' ')}
              </AppText>
            </Card>
          </Pressable>
        ))
      )}

      <Button
        label="Back to community"
        onPress={() => {
          navigation.goBack();
        }}
        variant="ghost"
      />
    </Screen>
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
  screen: {
    gap: 18,
    paddingBottom: 42,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  headerRow: {
    gap: 14,
  },
  headerCopy: {
    gap: 6,
  },
  mapFrame: {
    borderWidth: 1,
    height: 380,
    overflow: 'hidden',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
