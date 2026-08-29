import {
  completeAdventureStage,
  createAdventure,
  getAdventureProgress,
  getCommunityAdventures,
  getCommunityTrails,
  getMyAdventures,
  getMyCommunities,
  getMyTrails,
  getPublicProfileAdventures,
  getPublicProfileTrails,
  removeAdventure,
  startAdventure,
  updateAdventure,
  type Adventure,
  type AdventureCategory,
  type AdventureProgress,
  type AdventureStageInput,
  type AdventureStageType,
  type AdventureVisibility,
  type Trail,
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

type Props = NativeStackScreenProps<RootStackParamList, 'Adventures'>;

type DraftStage = {
  type: AdventureStageType;
  title: string;
  description: string;
  latitude: string;
  longitude: string;
};

const FALLBACK_REGION = {
  latitude: 53.4808,
  longitude: -2.2426,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const CATEGORIES: AdventureCategory[] = [
  'FAMILY',
  'NATURE',
  'HISTORY',
  'PHOTOGRAPHY',
  'FITNESS',
  'EXPLORATION',
  'FOOD',
  'COMMUNITY',
  'SEASONAL',
  'OTHER',
];

const STAGE_TYPES: AdventureStageType[] = [
  'CHECKPOINT',
  'TASK',
  'CLUE',
  'ACTIVITY',
  'PHOTO',
  'INFORMATION',
];

function nice(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function blankStage(): DraftStage {
  return {
    type: 'CHECKPOINT',
    title: '',
    description: '',
    latitude: '',
    longitude: '',
  };
}

export default function AdventureScreen({ navigation, route }: Props) {
  const { theme } = useNeighbourTheme();
  const { user } = useAuth();
  const params = route.params;
  const personal = params.mode === 'PERSONAL';
  const owner = personal ? params.owner : true;

  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [selected, setSelected] = useState<Adventure | null>(null);
  const [progress, setProgress] = useState<AdventureProgress | null>(null);
  const [communityModerator, setCommunityModerator] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<AdventureCategory>('EXPLORATION');
  const [visibility, setVisibility] = useState<AdventureVisibility>(
    personal ? 'PRIVATE' : 'COMMUNITY',
  );
  const [minutes, setMinutes] = useState('');
  const [trailId, setTrailId] = useState('');
  const [stages, setStages] = useState<DraftStage[]>([blankStage()]);

  const mapRef = useRef<MapView | null>(null);

  const canCreate = personal ? owner : true;
  const selectedIsMine = Boolean(selected && user?.id && selected.creatorId === user.id);
  const canRemoveSelected = Boolean(
    selected && (selectedIsMine || (!personal && communityModerator)),
  );

  const linkedTrail = useMemo(
    () =>
      selected?.trailId ? (trails.find((trail) => trail.id === selected.trailId) ?? null) : null,
    [selected?.trailId, trails],
  );

  const trailCoordinates = useMemo(
    () =>
      linkedTrail
        ? [...linkedTrail.checkpoints]
            .sort((a, b) => a.position - b.position)
            .map((checkpoint) => ({
              latitude: checkpoint.latitude,
              longitude: checkpoint.longitude,
            }))
        : [],
    [linkedTrail],
  );

  const stageCoordinates = useMemo(
    () =>
      selected
        ? [...selected.stages]
            .sort((a, b) => a.position - b.position)
            .filter((stage) => stage.latitude !== null && stage.longitude !== null)
            .map((stage) => ({
              stage,
              coordinate: {
                latitude: Number(stage.latitude),
                longitude: Number(stage.longitude),
              },
            }))
        : [],
    [selected],
  );

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);

      try {
        const token = await getSessionAccessToken();

        let result: Adventure[] = [];
        let availableTrails: Trail[] = [];

        if (personal) {
          if (params.owner) {
            if (!token) {
              throw new Error('Please sign in again to open your Adventures.');
            }

            result = (await getMyAdventures(token)).filter((item) => item.scope === 'PERSONAL');
            availableTrails = (await getMyTrails(token)).filter(
              (trail) => trail.scope === 'PERSONAL',
            );
          } else {
            result = await getPublicProfileAdventures(params.username);
            availableTrails = await getPublicProfileTrails(params.username);
          }
        } else {
          if (!token) {
            throw new Error('Please sign in again to open community Adventures.');
          }

          const [communityAdventures, communityTrails, memberships] = await Promise.all([
            getCommunityAdventures(token, params.communityId),
            getCommunityTrails(token, params.communityId),
            getMyCommunities(token),
          ]);

          const membership =
            memberships.find(
              (item) =>
                item.community.id === params.communityId ||
                item.community.slug === params.communitySlug,
            ) ?? null;

          const active = membership?.role === 'OWNER' || membership?.status === 'ACTIVE';

          if (!active) {
            throw new Error('Active community membership is required.');
          }

          setCommunityModerator(['OWNER', 'ADMIN', 'MODERATOR'].includes(membership?.role ?? ''));

          result = communityAdventures;
          availableTrails = communityTrails;
        }

        setAdventures(result);
        setTrails(availableTrails);
        setSelected((current) =>
          current
            ? (result.find((item) => item.id === current.id) ?? result[0] ?? null)
            : (result[0] ?? null),
        );
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Adventures could not be loaded.');
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

  useEffect(() => {
    if (!selected) {
      setProgress(null);
      return;
    }

    void (async () => {
      const token = await getSessionAccessToken();

      if (!token) {
        setProgress(null);
        return;
      }

      try {
        setProgress(await getAdventureProgress(token, selected.id));
      } catch {
        setProgress(null);
      }
    })();
  }, [selected?.id]);

  useEffect(() => {
    const points = [...trailCoordinates, ...stageCoordinates.map((item) => item.coordinate)];

    if (!points.length) return;

    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(points, {
        animated: true,
        edgePadding: {
          top: 60,
          right: 60,
          bottom: 60,
          left: 60,
        },
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [trailCoordinates, stageCoordinates]);

  function resetEditor() {
    setEditor(false);
    setEditing(false);
    setTitle('');
    setDescription('');
    setCategory('EXPLORATION');
    setVisibility(personal ? 'PRIVATE' : 'COMMUNITY');
    setMinutes('');
    setTrailId('');
    setStages([blankStage()]);
  }

  function beginCreate() {
    resetEditor();
    setEditor(true);
  }

  function beginEdit(item: Adventure) {
    if (item.creatorId !== user?.id) return;

    setSelected(item);
    setEditing(true);
    setEditor(true);
    setTitle(item.title);
    setDescription(item.description);
    setCategory(item.category);
    setVisibility(item.visibility);
    setMinutes(item.estimatedMinutes ? String(item.estimatedMinutes) : '');
    setTrailId(item.trailId ?? '');
    setStages(
      item.stages.map((stage) => ({
        type: stage.type,
        title: stage.title,
        description: stage.description ?? '',
        latitude: stage.latitude === null ? '' : String(stage.latitude),
        longitude: stage.longitude === null ? '' : String(stage.longitude),
      })),
    );
  }

  function updateDraftStage(index: number, patch: Partial<DraftStage>) {
    setStages((current) =>
      current.map((stage, position) => (position === index ? { ...stage, ...patch } : stage)),
    );
  }

  function stagePayload(): AdventureStageInput[] {
    return stages.map((stage, position) => {
      const latitude = stage.latitude.trim();
      const longitude = stage.longitude.trim();

      if (!stage.title.trim()) {
        throw new Error(`Stage ${position + 1} needs a title.`);
      }

      if ((latitude && !longitude) || (!latitude && longitude)) {
        throw new Error(`Stage ${position + 1} needs both latitude and longitude.`);
      }

      return {
        position,
        type: stage.type,
        title: stage.title.trim(),
        description: stage.description.trim() || undefined,
        ...(latitude && longitude
          ? {
              latitude: Number(latitude),
              longitude: Number(longitude),
            }
          : {}),
      };
    });
  }

  async function save() {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Adventure details', 'Add a title and description before saving.');
      return;
    }

    setSaving(true);

    try {
      const token = await getSessionAccessToken();

      if (!token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const input = {
        category,
        title: title.trim(),
        description: description.trim(),
        visibility,
        trailId: trailId || undefined,
        estimatedMinutes: minutes ? Number(minutes) : undefined,
        stages: stagePayload(),
      };

      let saved: Adventure;

      if (editing && selected) {
        saved = await updateAdventure(token, selected.id, input);
      } else {
        saved = await createAdventure(token, {
          ...input,
          scope: personal ? 'PERSONAL' : 'COMMUNITY',
          communityId: personal ? undefined : params.communityId,
        });
      }

      resetEditor();
      await load(true);
      setSelected(saved);
      setProgress(null);
    } catch (reason) {
      Alert.alert(
        'Adventure not saved',
        reason instanceof Error ? reason.message : 'Please try again.',
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmRemove(item: Adventure) {
    Alert.alert('Remove Adventure?', item.title, [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            const token = await getSessionAccessToken();
            if (!token) return;

            try {
              await removeAdventure(token, item.id);
              setSelected(null);
              setProgress(null);
              await load(true);
            } catch (reason) {
              Alert.alert(
                'Could not remove Adventure',
                reason instanceof Error ? reason.message : 'Please try again.',
              );
            }
          })();
        },
      },
    ]);
  }

  async function beginAdventure() {
    if (!selected) return;

    const token = await getSessionAccessToken();

    if (!token) {
      Alert.alert('Sign in required', 'Please sign in to start an Adventure.');
      return;
    }

    try {
      setProgress(await startAdventure(token, selected.id));
    } catch (reason) {
      Alert.alert(
        'Could not start Adventure',
        reason instanceof Error ? reason.message : 'Please try again.',
      );
    }
  }

  async function completeStage(position: number) {
    if (!selected) return;

    const token = await getSessionAccessToken();
    if (!token) return;

    try {
      const next = await completeAdventureStage(token, selected.id, position);

      setProgress(next);

      if (next.completedAt) {
        Alert.alert('Adventure complete', 'You completed every stage.');
      }
    } catch (reason) {
      Alert.alert(
        'Stage not completed',
        reason instanceof Error ? reason.message : 'Please try again.',
      );
    }
  }

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
          <AppText tone="secondary">Opening Adventures…</AppText>
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
          accessibilityRole="button"
          accessibilityLabel="Back to map"
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
          <AppText variant="bodyStrong">
            {personal ? 'Personal Adventures' : params.communityName}
          </AppText>
          <AppText variant="caption" tone="secondary">
            {adventures.length} {adventures.length === 1 ? 'adventure' : 'adventures'}
          </AppText>
        </View>

        {canCreate ? (
          <Button label="Create" onPress={beginCreate} variant="secondary" />
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
        showsVerticalScrollIndicator={false}
      >
        {error ? (
          <Card variant="muted" style={styles.card}>
            <AppText variant="bodyStrong">Adventures unavailable</AppText>
            <AppText tone="secondary">{error}</AppText>
          </Card>
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
          <MapView ref={mapRef} initialRegion={FALLBACK_REGION} style={StyleSheet.absoluteFill}>
            {trailCoordinates.length > 1 ? (
              <Polyline
                coordinates={trailCoordinates}
                strokeWidth={4}
                strokeColor={theme.colors.primary}
              />
            ) : null}

            {trailCoordinates.map((coordinate, index) => (
              <Marker
                key={`trail-${index}`}
                coordinate={coordinate}
                title={`Trail checkpoint ${index + 1}`}
              />
            ))}

            {stageCoordinates.map(({ stage, coordinate }) => (
              <Marker
                key={stage.id}
                coordinate={coordinate}
                title={`${stage.position + 1}. ${stage.title}`}
                description={nice(stage.type)}
              />
            ))}
          </MapView>
        </View>

        {selected ? (
          <Card style={styles.card}>
            <AppText variant="overline" tone="brand">
              {nice(selected.category).toUpperCase()}
            </AppText>

            <AppText variant="heading">{selected.title}</AppText>

            <AppText tone="secondary">{selected.description}</AppText>

            <AppText variant="caption" tone="secondary">
              {selected.visibility} · {selected.stages.length} stages
              {selected.estimatedMinutes ? ` · about ${selected.estimatedMinutes} min` : ''}
              {selected.trailId ? ' · linked Trail' : ''}
            </AppText>

            {!progress ? (
              <Button
                label="Start Adventure"
                onPress={() => {
                  void beginAdventure();
                }}
                variant="primary"
              />
            ) : progress.completedAt ? (
              <View style={styles.completeBox}>
                <AppText variant="bodyStrong">Adventure complete ✓</AppText>
                <Button
                  label="Start again"
                  onPress={() => {
                    void beginAdventure();
                  }}
                  variant="secondary"
                />
              </View>
            ) : (
              <AppText variant="bodyStrong">
                {progress.completedStages.length} / {selected.stages.length} stages complete
              </AppText>
            )}

            <View style={styles.stageList}>
              {[...selected.stages]
                .sort((a, b) => a.position - b.position)
                .map((stage) => {
                  const done = progress?.completedStages.includes(stage.position) ?? false;

                  const current = progress?.currentStagePosition === stage.position;

                  return (
                    <View
                      key={stage.id}
                      style={[
                        styles.stageCard,
                        {
                          borderColor: current ? theme.colors.primary : theme.colors.border,
                          backgroundColor: done ? theme.colors.surfaceMuted : theme.colors.surface,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.stageNumber,
                          {
                            backgroundColor: theme.colors.primaryStrong,
                          },
                        ]}
                      >
                        <AppText tone="inverse">{done ? '✓' : String(stage.position + 1)}</AppText>
                      </View>

                      <View style={styles.stageCopy}>
                        <AppText variant="caption" tone="brand">
                          {nice(stage.type)}
                        </AppText>

                        <AppText variant="bodyStrong">{stage.title}</AppText>

                        {stage.description ? (
                          <AppText tone="secondary">{stage.description}</AppText>
                        ) : null}

                        {progress && !progress.completedAt && current && !done ? (
                          <Button
                            label="Complete stage"
                            onPress={() => {
                              void completeStage(stage.position);
                            }}
                            variant="primary"
                          />
                        ) : null}
                      </View>
                    </View>
                  );
                })}
            </View>

            {selectedIsMine || canRemoveSelected ? (
              <View style={styles.actions}>
                {selectedIsMine ? (
                  <Button
                    label="Edit Adventure"
                    onPress={() => beginEdit(selected)}
                    variant="secondary"
                  />
                ) : null}

                {canRemoveSelected ? (
                  <Button
                    label="Remove Adventure"
                    onPress={() => confirmRemove(selected)}
                    variant="ghost"
                  />
                ) : null}
              </View>
            ) : null}
          </Card>
        ) : null}

        <View style={styles.listHeading}>
          <AppText variant="subheading">Adventures</AppText>
          <AppText variant="caption" tone="secondary">
            {adventures.length}
          </AppText>
        </View>

        {adventures.length === 0 ? (
          <Card variant="muted" style={styles.card}>
            <AppText variant="subheading">No Adventures yet</AppText>

            <AppText tone="secondary">
              {canCreate
                ? 'Create the first Adventure and build its stages.'
                : 'No public Adventures have been shared here yet.'}
            </AppText>

            {canCreate ? (
              <Button label="Create first Adventure" onPress={beginCreate} variant="primary" />
            ) : null}
          </Card>
        ) : (
          adventures.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item.id}
              onPress={() => {
                resetEditor();
                setSelected(item);
              }}
              style={({ pressed }) => ({
                opacity: pressed ? 0.78 : 1,
              })}
            >
              <Card style={styles.card}>
                <AppText variant="overline" tone="brand">
                  ◇ {nice(item.category).toUpperCase()}
                </AppText>

                <AppText variant="subheading">{item.title}</AppText>

                <AppText tone="secondary" numberOfLines={2}>
                  {item.description}
                </AppText>

                <AppText variant="caption" tone="secondary">
                  {item.stages.length} stages
                  {item.estimatedMinutes ? ` · about ${item.estimatedMinutes} min` : ''}
                </AppText>
              </Card>
            </Pressable>
          ))
        )}

        {editor ? (
          <Card style={styles.card}>
            <AppText variant="heading">{editing ? 'Edit Adventure' : 'Create Adventure'}</AppText>

            {editing ? (
              <AppText variant="caption" tone="secondary">
                Changing stages resets saved participant progress.
              </AppText>
            ) : null}

            <TextInput
              placeholder="Adventure title"
              placeholderTextColor={theme.colors.textMuted}
              value={title}
              onChangeText={setTitle}
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
            />

            <TextInput
              placeholder="Description"
              placeholderTextColor={theme.colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              style={[
                styles.input,
                styles.textArea,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
            />

            <AppText variant="bodyStrong">Category</AppText>

            <View style={styles.choiceWrap}>
              {CATEGORIES.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[
                    styles.choice,
                    {
                      borderColor: category === item ? theme.colors.primary : theme.colors.border,
                      borderRadius: theme.radius.pill,
                    },
                  ]}
                >
                  <AppText variant="caption">{nice(item)}</AppText>
                </Pressable>
              ))}
            </View>

            <AppText variant="bodyStrong">Visibility</AppText>

            <View style={styles.choiceWrap}>
              {(personal ? ['PRIVATE', 'PUBLIC'] : ['PRIVATE', 'COMMUNITY']).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setVisibility(item as AdventureVisibility)}
                  style={[
                    styles.choice,
                    {
                      borderColor: visibility === item ? theme.colors.primary : theme.colors.border,
                      borderRadius: theme.radius.pill,
                    },
                  ]}
                >
                  <AppText variant="caption">{nice(item)}</AppText>
                </Pressable>
              ))}
            </View>

            <TextInput
              placeholder="Estimated minutes"
              keyboardType="number-pad"
              placeholderTextColor={theme.colors.textMuted}
              value={minutes}
              onChangeText={setMinutes}
              style={[
                styles.input,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
              ]}
            />

            <AppText variant="bodyStrong">Linked Trail</AppText>

            <View style={styles.choiceWrap}>
              <Pressable
                onPress={() => setTrailId('')}
                style={[
                  styles.choice,
                  {
                    borderColor: !trailId ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText variant="caption">None</AppText>
              </Pressable>

              {trails.map((trail) => (
                <Pressable
                  key={trail.id}
                  onPress={() => setTrailId(trail.id)}
                  style={[
                    styles.choice,
                    {
                      borderColor:
                        trailId === trail.id ? theme.colors.primary : theme.colors.border,
                      borderRadius: theme.radius.pill,
                    },
                  ]}
                >
                  <AppText variant="caption">{trail.title}</AppText>
                </Pressable>
              ))}
            </View>

            <View style={styles.listHeading}>
              <AppText variant="subheading">Stages</AppText>

              <Button
                label="Add stage"
                onPress={() => setStages((current) => [...current, blankStage()])}
                variant="secondary"
              />
            </View>

            {stages.map((stage, index) => (
              <View
                key={index}
                style={[
                  styles.stageEditor,
                  {
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.lg,
                  },
                ]}
              >
                <AppText variant="bodyStrong">Stage {index + 1}</AppText>

                <View style={styles.choiceWrap}>
                  {STAGE_TYPES.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() =>
                        updateDraftStage(index, {
                          type: item,
                        })
                      }
                      style={[
                        styles.choice,
                        {
                          borderColor:
                            stage.type === item ? theme.colors.primary : theme.colors.border,
                          borderRadius: theme.radius.pill,
                        },
                      ]}
                    >
                      <AppText variant="caption">{nice(item)}</AppText>
                    </Pressable>
                  ))}
                </View>

                <TextInput
                  placeholder="Stage title"
                  placeholderTextColor={theme.colors.textMuted}
                  value={stage.title}
                  onChangeText={(value) =>
                    updateDraftStage(index, {
                      title: value,
                    })
                  }
                  style={[
                    styles.input,
                    {
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                />

                <TextInput
                  placeholder="Instructions, clue or information"
                  placeholderTextColor={theme.colors.textMuted}
                  value={stage.description}
                  onChangeText={(value) =>
                    updateDraftStage(index, {
                      description: value,
                    })
                  }
                  multiline
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                />

                <TextInput
                  placeholder="Latitude (optional)"
                  keyboardType="numbers-and-punctuation"
                  placeholderTextColor={theme.colors.textMuted}
                  value={stage.latitude}
                  onChangeText={(value) =>
                    updateDraftStage(index, {
                      latitude: value,
                    })
                  }
                  style={[
                    styles.input,
                    {
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                />

                <TextInput
                  placeholder="Longitude (optional)"
                  keyboardType="numbers-and-punctuation"
                  placeholderTextColor={theme.colors.textMuted}
                  value={stage.longitude}
                  onChangeText={(value) =>
                    updateDraftStage(index, {
                      longitude: value,
                    })
                  }
                  style={[
                    styles.input,
                    {
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                    },
                  ]}
                />

                {stages.length > 1 ? (
                  <Button
                    label="Remove stage"
                    onPress={() =>
                      setStages((current) => current.filter((_, position) => position !== index))
                    }
                    variant="ghost"
                  />
                ) : null}
              </View>
            ))}

            <View style={styles.actions}>
              <Button
                label={saving ? 'Saving…' : editing ? 'Save Adventure' : 'Create Adventure'}
                onPress={() => {
                  void save();
                }}
                disabled={saving}
                variant="primary"
              />

              <Button label="Cancel" onPress={resetEditor} variant="ghost" />
            </View>
          </Card>
        ) : null}

        <Card variant="muted" style={styles.card}>
          <AppText variant="caption" tone="secondary">
            Adventures remain inside their Personal or Community Map context and do not
            automatically enter Nearby.
          </AppText>
        </Card>
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
    gap: 12,
    justifyContent: 'center',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  headerSpacer: {
    width: 64,
  },
  content: {
    gap: 14,
    padding: 16,
    paddingBottom: 48,
  },
  mapShell: {
    borderWidth: 1,
    height: 330,
    overflow: 'hidden',
  },
  card: {
    gap: 12,
  },
  completeBox: {
    gap: 10,
  },
  stageList: {
    gap: 10,
  },
  stageCard: {
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  stageNumber: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stageCopy: {
    flex: 1,
    gap: 5,
  },
  actions: {
    gap: 8,
  },
  listHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  choiceWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  stageEditor: {
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
});
