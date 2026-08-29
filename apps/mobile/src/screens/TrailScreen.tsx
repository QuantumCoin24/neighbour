import {
  createTrail,
  getCommunityTrails,
  getMyCommunities,
  getMyTrails,
  getPublicProfileTrails,
  removeTrail,
  updateTrail,
  type Trail,
  type TrailCategory,
  type TrailCheckpointInput,
  type TrailVisibility,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/auth-context';
import { getSessionAccessToken } from '../auth/session';
import { AppText, Button, Card } from '../components';
import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Trails'>;

const FALLBACK_REGION = {
  latitude: 53.4808,
  longitude: -2.2426,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const CATEGORIES: Array<{ id: TrailCategory; label: string }> = [
  { id: 'WALKING', label: 'Walking' },
  { id: 'RUNNING', label: 'Running' },
  { id: 'CYCLING', label: 'Cycling' },
  { id: 'FAMILY', label: 'Family' },
  { id: 'NATURE', label: 'Nature' },
  { id: 'HISTORY', label: 'History' },
  { id: 'PHOTOGRAPHY', label: 'Photography' },
  { id: 'FOOD', label: 'Food' },
  { id: 'DOG_WALKING', label: 'Dog walking' },
  { id: 'ACCESSIBLE', label: 'Accessible' },
  { id: 'COMMUNITY', label: 'Community' },
  { id: 'OTHER', label: 'Other' },
];

function categoryLabel(category: TrailCategory) {
  return CATEGORIES.find((item) => item.id === category)?.label ?? 'Trail';
}

export default function TrailScreen({ navigation, route }: Props) {
  const { theme } = useNeighbourTheme();
  const { user } = useAuth();
  const params = route.params;
  const personal = params.mode === 'PERSONAL';
  const owner = personal ? params.owner : true;

  const [trails, setTrails] = useState<Trail[]>([]);
  const [selected, setSelected] = useState<Trail | null>(null);
  const [communityModerator, setCommunityModerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TrailCategory>('WALKING');
  const [visibility, setVisibility] = useState<TrailVisibility>(personal ? 'PRIVATE' : 'COMMUNITY');
  const [minutes, setMinutes] = useState('');
  const [checkpoints, setCheckpoints] = useState<TrailCheckpointInput[]>([]);

  const mapRef = useRef<MapView | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);

      try {
        const token = await getSessionAccessToken();

        if (personal) {
          if (params.owner) {
            if (!token) throw new Error('Please sign in again to open your trails.');
            const result = await getMyTrails(token);
            setTrails(result.filter((trail) => trail.scope === 'PERSONAL'));
          } else {
            setTrails(await getPublicProfileTrails(params.username));
          }
        } else {
          if (!token) throw new Error('Please sign in again to open community trails.');

          const [communityTrails, memberships] = await Promise.all([
            getCommunityTrails(token, params.communityId),
            getMyCommunities(token),
          ]);

          const membership =
            memberships.find(
              (item) =>
                item.community.id === params.communityId ||
                item.community.slug === params.communitySlug,
            ) ?? null;

          setCommunityModerator(
            Boolean(
              membership &&
              membership.status === 'ACTIVE' &&
              ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role),
            ),
          );

          setTrails(communityTrails);
        }
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Neighbour could not load these trails.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [params, personal],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const visibleCheckpoints = useMemo(() => {
    if (editor) return checkpoints;

    return selected
      ? [...selected.checkpoints]
          .sort((a, b) => a.position - b.position)
          .map((checkpoint, index) => ({
            mapDiscoveryId: checkpoint.mapDiscoveryId ?? undefined,
            position: index,
            title: checkpoint.title ?? undefined,
            instruction: checkpoint.instruction ?? undefined,
            latitude: Number(checkpoint.latitude),
            longitude: Number(checkpoint.longitude),
          }))
      : [];
  }, [checkpoints, editor, selected]);

  const initialRegion = useMemo(() => {
    const first = visibleCheckpoints[0];

    if (first) {
      return {
        latitude: first.latitude,
        longitude: first.longitude,
        latitudeDelta: 0.035,
        longitudeDelta: 0.035,
      };
    }

    if (!personal && params.latitude !== null && params.longitude !== null) {
      return {
        latitude: params.latitude,
        longitude: params.longitude,
        latitudeDelta: 0.045,
        longitudeDelta: 0.045,
      };
    }

    return FALLBACK_REGION;
  }, [params, personal, visibleCheckpoints]);

  function resetEditor() {
    setEditor(false);
    setEditing(false);
    setTitle('');
    setDescription('');
    setCategory('WALKING');
    setVisibility(personal ? 'PRIVATE' : 'COMMUNITY');
    setMinutes('');
    setCheckpoints([]);
  }

  function beginCreate() {
    setSelected(null);
    resetEditor();
    setEditor(true);
  }

  function beginEdit(trail: Trail) {
    setSelected(trail);
    setEditing(true);
    setEditor(true);
    setTitle(trail.title);
    setDescription(trail.description);
    setCategory(trail.category);
    setVisibility(trail.visibility);
    setMinutes(trail.estimatedMinutes?.toString() ?? '');
    setCheckpoints(
      [...trail.checkpoints]
        .sort((a, b) => a.position - b.position)
        .map((checkpoint, index) => ({
          mapDiscoveryId: checkpoint.mapDiscoveryId ?? undefined,
          position: index,
          title: checkpoint.title ?? undefined,
          instruction: checkpoint.instruction ?? undefined,
          latitude: Number(checkpoint.latitude),
          longitude: Number(checkpoint.longitude),
        })),
    );
  }

  function addCheckpoint(latitude: number, longitude: number) {
    setCheckpoints((current) => [
      ...current,
      {
        position: current.length,
        latitude,
        longitude,
        title: `Checkpoint ${current.length + 1}`,
      },
    ]);
  }

  function removeCheckpoint(position: number) {
    setCheckpoints((current) =>
      current
        .filter((checkpoint) => checkpoint.position !== position)
        .map((checkpoint, index) => ({ ...checkpoint, position: index })),
    );
  }

  async function saveTrail() {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Trail details required', 'Add a trail name and description.');
      return;
    }

    if (checkpoints.length < 2) {
      Alert.alert('Add another checkpoint', 'A trail needs at least two checkpoints.');
      return;
    }

    const token = await getSessionAccessToken();
    if (!token) {
      Alert.alert('Sign in required', 'Please sign in again to save this trail.');
      return;
    }

    setSaving(true);

    try {
      const parsedMinutes = minutes.trim() ? Number.parseInt(minutes, 10) : undefined;
      let saved: Trail;

      if (editing && selected) {
        saved = await updateTrail(token, selected.id, {
          title: title.trim(),
          description: description.trim(),
          category,
          visibility,
          estimatedMinutes:
            parsedMinutes && Number.isFinite(parsedMinutes) && parsedMinutes > 0
              ? parsedMinutes
              : undefined,
          checkpoints,
        });
      } else {
        saved = await createTrail(token, {
          scope: params.mode,
          communityId: personal ? undefined : params.communityId,
          title: title.trim(),
          description: description.trim(),
          category,
          visibility,
          estimatedMinutes:
            parsedMinutes && Number.isFinite(parsedMinutes) && parsedMinutes > 0
              ? parsedMinutes
              : undefined,
          checkpoints,
        });
      }

      resetEditor();
      await load(true);
      setSelected(saved);
    } catch (caughtError) {
      Alert.alert(
        'Trail not saved',
        caughtError instanceof Error ? caughtError.message : 'Neighbour could not save this trail.',
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmRemove(trail: Trail) {
    Alert.alert('Remove trail?', `"${trail.title}" will be removed from this map.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const token = await getSessionAccessToken();
            if (!token) return;

            try {
              await removeTrail(token, trail.id);
              setSelected(null);
              resetEditor();
              await load(true);
            } catch (caughtError) {
              Alert.alert(
                'Trail not removed',
                caughtError instanceof Error
                  ? caughtError.message
                  : 'Neighbour could not remove this trail.',
              );
            }
          })();
        },
      },
    ]);
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <AppText tone="secondary">Opening Trails…</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const canCreate = personal ? owner : true;
  const selectedIsMine = Boolean(selected && user?.id && selected.creatorId === user.id);
  const canRemoveSelected = Boolean(
    selected && (selectedIsMine || (!personal && communityModerator)),
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel="Back to map"
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
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
            {personal
              ? owner
                ? 'Your Trails'
                : `${params.displayName ?? params.username}'s Trails`
              : `${params.communityName} Trails`}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {trails.length} {trails.length === 1 ? 'trail' : 'trails'}
          </AppText>
        </View>

        {canCreate && !editor ? (
          <Pressable
            accessibilityLabel="Create trail"
            accessibilityRole="button"
            onPress={beginCreate}
            style={[
              styles.createButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="label" tone="inverse">
              + Trail
            </AppText>
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load(true);
            }}
          />
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card variant="muted" style={styles.card}>
          <AppText variant="overline" tone="brand">
            {personal ? 'PERSONAL MAP · TRAILS' : 'COMMUNITY MAP · TRAILS'}
          </AppText>
          <AppText tone="secondary">
            Trail lines connect ordered checkpoints. They are not turn-by-turn navigation.
          </AppText>
        </Card>

        {error ? (
          <Pressable onPress={() => void load()} accessibilityRole="button">
            <Card variant="muted" style={styles.card}>
              <AppText variant="bodyStrong">Trails unavailable</AppText>
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
              if (!editor) return;
              addCheckpoint(
                event.nativeEvent.coordinate.latitude,
                event.nativeEvent.coordinate.longitude,
              );
            }}
            style={styles.map}
          >
            {visibleCheckpoints.length > 1 ? (
              <Polyline
                coordinates={visibleCheckpoints.map((checkpoint) => ({
                  latitude: checkpoint.latitude,
                  longitude: checkpoint.longitude,
                }))}
                strokeColor={theme.colors.primaryStrong}
                strokeWidth={5}
              />
            ) : null}

            {visibleCheckpoints.map((checkpoint, index) => (
              <Marker
                coordinate={{
                  latitude: checkpoint.latitude,
                  longitude: checkpoint.longitude,
                }}
                key={`${checkpoint.latitude}-${checkpoint.longitude}-${index}`}
                title={checkpoint.title ?? `Checkpoint ${index + 1}`}
              >
                <View
                  style={[
                    styles.marker,
                    {
                      backgroundColor: theme.colors.primaryStrong,
                      borderColor: theme.colors.surface,
                    },
                  ]}
                >
                  <AppText variant="label" tone="inverse">
                    {index + 1}
                  </AppText>
                </View>
              </Marker>
            ))}
          </MapView>

          {editor ? (
            <View
              style={[
                styles.mapInstruction,
                {
                  backgroundColor: theme.colors.text,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <AppText variant="caption" tone="inverse">
                Tap map to add checkpoint {checkpoints.length + 1}
              </AppText>
            </View>
          ) : null}
        </View>

        {editor ? (
          <Card style={styles.card}>
            <AppText variant="subheading">{editing ? 'Edit trail' : 'Create a Trail'}</AppText>

            <View style={styles.field}>
              <AppText variant="label">Name</AppText>
              <TextInput
                maxLength={120}
                onChangeText={setTitle}
                placeholder="Sunday woodland loop"
                placeholderTextColor={theme.colors.textMuted}
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
            </View>

            <View style={styles.field}>
              <AppText variant="label">Description</AppText>
              <TextInput
                maxLength={2000}
                multiline
                onChangeText={setDescription}
                placeholder="What should someone know before following this trail?"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  styles.multilineInput,
                  {
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    color: theme.colors.text,
                  },
                ]}
                value={description}
              />
            </View>

            <View style={styles.field}>
              <AppText variant="label">Category</AppText>
              <View style={styles.chips}>
                {CATEGORIES.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setCategory(item.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          category === item.id ? theme.colors.primary : theme.colors.surfaceMuted,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.pill,
                      },
                    ]}
                  >
                    <AppText variant="caption" tone={category === item.id ? 'inverse' : 'primary'}>
                      {item.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <AppText variant="label">Visibility</AppText>
              <View style={styles.chips}>
                {(personal
                  ? (['PRIVATE', 'PUBLIC'] as TrailVisibility[])
                  : (['PRIVATE', 'COMMUNITY'] as TrailVisibility[])
                ).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setVisibility(item)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          visibility === item ? theme.colors.primary : theme.colors.surfaceMuted,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.pill,
                      },
                    ]}
                  >
                    <AppText variant="caption" tone={visibility === item ? 'inverse' : 'primary'}>
                      {item.charAt(0) + item.slice(1).toLowerCase()}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <AppText variant="label">Estimated time · minutes</AppText>
              <TextInput
                keyboardType="number-pad"
                onChangeText={setMinutes}
                placeholder="45"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    color: theme.colors.text,
                  },
                ]}
                value={minutes}
              />
            </View>

            <View style={styles.checkpointHeader}>
              <AppText variant="bodyStrong">Ordered checkpoints</AppText>
              <AppText variant="caption" tone="secondary">
                {checkpoints.length}
              </AppText>
            </View>

            {checkpoints.map((checkpoint, index) => (
              <View style={styles.checkpointEditor} key={`${index}-${checkpoint.latitude}`}>
                <View
                  style={[styles.checkpointNumber, { backgroundColor: theme.colors.primaryStrong }]}
                >
                  <AppText variant="label" tone="inverse">
                    {index + 1}
                  </AppText>
                </View>

                <View style={styles.checkpointCopy}>
                  <TextInput
                    maxLength={120}
                    onChangeText={(value) =>
                      setCheckpoints((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, title: value } : item,
                        ),
                      )
                    }
                    placeholder={`Checkpoint ${index + 1}`}
                    placeholderTextColor={theme.colors.textMuted}
                    style={[
                      styles.smallInput,
                      {
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.md,
                        color: theme.colors.text,
                      },
                    ]}
                    value={checkpoint.title ?? ''}
                  />
                  <TextInput
                    maxLength={500}
                    onChangeText={(value) =>
                      setCheckpoints((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, instruction: value } : item,
                        ),
                      )
                    }
                    placeholder="Optional instruction"
                    placeholderTextColor={theme.colors.textMuted}
                    style={[
                      styles.smallInput,
                      {
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.md,
                        color: theme.colors.text,
                      },
                    ]}
                    value={checkpoint.instruction ?? ''}
                  />
                </View>

                <Pressable
                  accessibilityLabel={`Remove checkpoint ${index + 1}`}
                  onPress={() => removeCheckpoint(checkpoint.position)}
                >
                  <AppText variant="caption" tone="secondary">
                    Remove
                  </AppText>
                </Pressable>
              </View>
            ))}

            <View style={styles.actions}>
              <Button label="Cancel" onPress={() => resetEditor()} variant="secondary" />
              <Button
                disabled={saving || !title.trim() || !description.trim() || checkpoints.length < 2}
                label={saving ? 'Saving…' : editing ? 'Save changes' : 'Create trail'}
                onPress={() => void saveTrail()}
                variant="primary"
              />
            </View>
          </Card>
        ) : selected ? (
          <Card style={styles.card}>
            <AppText variant="overline" tone="brand">
              {categoryLabel(selected.category).toUpperCase()}
            </AppText>
            <AppText variant="title">{selected.title}</AppText>
            <AppText tone="secondary">{selected.description}</AppText>

            <View style={styles.metaRow}>
              <AppText variant="caption" tone="secondary">
                {selected.checkpoints.length} checkpoints
              </AppText>
              {selected.estimatedMinutes ? (
                <AppText variant="caption" tone="secondary">
                  About {selected.estimatedMinutes} min
                </AppText>
              ) : null}
              <AppText variant="caption" tone="secondary">
                {selected.visibility}
              </AppText>
            </View>

            {[...selected.checkpoints]
              .sort((a, b) => a.position - b.position)
              .map((checkpoint, index) => (
                <View style={styles.checkpointDetail} key={checkpoint.id}>
                  <View
                    style={[
                      styles.checkpointNumber,
                      { backgroundColor: theme.colors.primaryStrong },
                    ]}
                  >
                    <AppText variant="label" tone="inverse">
                      {index + 1}
                    </AppText>
                  </View>
                  <View style={styles.checkpointCopy}>
                    <AppText variant="bodyStrong">
                      {checkpoint.title ?? `Checkpoint ${index + 1}`}
                    </AppText>
                    {checkpoint.instruction ? (
                      <AppText tone="secondary">{checkpoint.instruction}</AppText>
                    ) : null}
                  </View>
                </View>
              ))}

            {selectedIsMine || canRemoveSelected ? (
              <View style={styles.actions}>
                {selectedIsMine ? (
                  <Button
                    label="Edit trail"
                    onPress={() => beginEdit(selected)}
                    variant="secondary"
                  />
                ) : null}
                {canRemoveSelected ? (
                  <Button
                    label="Remove trail"
                    onPress={() => confirmRemove(selected)}
                    variant="ghost"
                  />
                ) : null}
              </View>
            ) : null}
          </Card>
        ) : null}

        <View style={styles.listHeading}>
          <AppText variant="subheading">Trails</AppText>
          <AppText variant="caption" tone="secondary">
            {trails.length}
          </AppText>
        </View>

        {trails.length === 0 ? (
          <Card variant="muted" style={styles.card}>
            <AppText variant="subheading">No trails yet</AppText>
            <AppText tone="secondary">
              {canCreate
                ? 'Create the first Trail by placing at least two checkpoints.'
                : 'No public Trails have been shared here yet.'}
            </AppText>
            {canCreate ? (
              <Button label="Create first trail" onPress={beginCreate} variant="primary" />
            ) : null}
          </Card>
        ) : (
          trails.map((trail) => (
            <Pressable
              accessibilityRole="button"
              key={trail.id}
              onPress={() => {
                resetEditor();
                setSelected(trail);
              }}
              style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}
            >
              <Card style={styles.card}>
                <AppText variant="overline" tone="brand">
                  ↝ {categoryLabel(trail.category).toUpperCase()}
                </AppText>
                <AppText variant="subheading">{trail.title}</AppText>
                <AppText tone="secondary" numberOfLines={2}>
                  {trail.description}
                </AppText>
                <AppText variant="caption" tone="secondary">
                  {trail.checkpoints.length} checkpoints
                  {trail.estimatedMinutes ? ` · about ${trail.estimatedMinutes} min` : ''}
                </AppText>
              </Card>
            </Pressable>
          ))
        )}

        <Card variant="muted" style={styles.card}>
          <AppText variant="caption" tone="secondary">
            {personal
              ? 'Personal Trails stay separate from Nearby.'
              : 'Community Trails stay inside this community and do not automatically enter Nearby.'}
          </AppText>
        </Card>

        <Button label="Back to map" onPress={() => navigation.goBack()} variant="ghost" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  createButton: {
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
  card: {
    gap: 12,
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
  checkpointHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkpointEditor: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  checkpointDetail: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  checkpointNumber: {
    alignItems: 'center',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  checkpointCopy: {
    flex: 1,
    gap: 7,
  },
  smallInput: {
    borderWidth: 1,
    minHeight: 42,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  listHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
