import {
  getMyProfile,
  getNeighbourhoods,
  updateMyProfile,
  type Neighbourhood,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { AppText, Button, Card, Screen } from '../components';
import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LocalArea'>;

export default function LocalAreaScreen({ navigation }: Props) {
  const { theme } = useNeighbourTheme();

  const [areas, setAreas] = useState<Neighbourhood[]>([]);
  const [currentArea, setCurrentArea] = useState('');
  const [query, setQuery] = useState('');
  const [manualArea, setManualArea] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [profile, neighbourhoods] = await Promise.all([getMyProfile(), getNeighbourhoods()]);

      const savedArea = profile.localArea?.trim() ?? '';

      setCurrentArea(savedArea);
      setManualArea(savedArea);
      setAreas(neighbourhoods);
    } catch {
      setError('Your local-area information could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredAreas = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return areas;
    }

    return areas.filter((area) => {
      return (
        area.name.toLowerCase().includes(value) || area.localArea?.toLowerCase().includes(value)
      );
    });
  }, [areas, query]);

  const saveArea = useCallback(async (value: string) => {
    const localArea = value.trim();

    if (!localArea) {
      setError('Enter or choose a local area first.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const profile = await updateMyProfile({
        localArea,
      });

      const saved = profile.localArea?.trim() || localArea;

      setCurrentArea(saved);
      setManualArea(saved);
      setSuccess(`${saved} is now your local area.`);
    } catch {
      setError('Neighbour could not save your local area. Please try again.');
    } finally {
      setSaving(false);
    }
  }, []);

  if (loading) {
    return (
      <Screen scroll={false} contentStyle={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} />

        <AppText variant="subheading">Opening your local area</AppText>

        <AppText variant="caption" tone="secondary">
          Connecting your profile with Neighbour™ locality services.
        </AppText>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      contentStyle={styles.screen}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void load(true);
          }}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => {
            navigation.goBack();
          }}
          style={({ pressed }) => [
            styles.back,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.pill,
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <AppText variant="bodyStrong">←</AppText>
        </Pressable>

        <View style={styles.headerCopy}>
          <AppText variant="overline" tone="brand">
            NEIGHBOUR™ LOCALITY
          </AppText>

          <AppText variant="heading">Your local area</AppText>
        </View>
      </View>

      <Card
        style={[
          styles.hero,
          {
            backgroundColor: theme.colors.primaryStrong,
          },
        ]}
      >
        <AppText variant="overline" tone="inverse">
          HOME AREA
        </AppText>

        <AppText variant="heading" tone="inverse">
          {currentArea || 'Not set yet'}
        </AppText>

        <AppText tone="inverse">
          Your local area helps Neighbour connect your profile with nearby communities, events,
          businesses and local activity.
        </AppText>
      </Card>

      {error ? (
        <Card variant="muted" style={styles.notice}>
          <AppText variant="bodyStrong">{error}</AppText>
        </Card>
      ) : null}

      {success ? (
        <Card variant="muted" style={styles.notice}>
          <AppText variant="bodyStrong">{success}</AppText>
        </Card>
      ) : null}

      <View style={styles.section}>
        <AppText variant="subheading">Find an existing area</AppText>

        <AppText variant="caption" tone="secondary">
          Choose from locality records already registered with Neighbour.
        </AppText>

        <TextInput
          autoCapitalize="words"
          placeholder="Search area or neighbourhood"
          placeholderTextColor={theme.colors.textMuted}
          value={query}
          onChangeText={setQuery}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              color: theme.colors.text,
            },
          ]}
        />

        <View style={styles.areaList}>
          {filteredAreas.length ? (
            filteredAreas.map((area) => {
              const value = area.localArea?.trim() || area.name;
              const selected = value.toLowerCase() === currentArea.trim().toLowerCase();

              return (
                <Pressable
                  accessibilityRole="button"
                  key={area.id}
                  disabled={saving}
                  onPress={() => {
                    void saveArea(value);
                  }}
                  style={({ pressed }) => [
                    styles.area,
                    {
                      backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
                      borderColor: selected ? theme.colors.primary : theme.colors.border,
                      borderRadius: theme.radius.lg,
                      opacity: pressed ? 0.78 : 1,
                    },
                  ]}
                >
                  <View style={styles.areaCopy}>
                    <AppText variant="bodyStrong">{area.name}</AppText>

                    {area.localArea && area.localArea !== area.name ? (
                      <AppText variant="caption" tone="secondary">
                        {area.localArea}
                      </AppText>
                    ) : null}
                  </View>

                  <AppText variant="label" tone={selected ? 'brand' : 'secondary'}>
                    {selected ? 'Current' : 'Choose'}
                  </AppText>
                </Pressable>
              );
            })
          ) : (
            <Card variant="muted">
              <AppText variant="bodyStrong">No matching registered areas</AppText>

              <AppText variant="caption" tone="secondary">
                You can still enter your local area manually below.
              </AppText>
            </Card>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="subheading">Enter an area manually</AppText>

        <AppText variant="caption" tone="secondary">
          You can use a neighbourhood, district, town or postcode area.
        </AppText>

        <TextInput
          autoCapitalize="words"
          placeholder="e.g. Blackley or M9"
          placeholderTextColor={theme.colors.textMuted}
          value={manualArea}
          onChangeText={setManualArea}
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              color: theme.colors.text,
            },
          ]}
        />

        <Button
          disabled={saving || !manualArea.trim()}
          label={saving ? 'Saving…' : 'Save local area'}
          onPress={() => {
            void saveArea(manualArea);
          }}
        />
      </View>

      <View style={styles.section}>
        <AppText variant="subheading">Explore from your location</AppText>

        <AppText variant="caption" tone="secondary">
          Nearby can use your iPhone location to discover real places around you without changing
          your saved home area.
        </AppText>

        <Button
          label="Open Explore Nearby"
          variant="secondary"
          onPress={() => {
            navigation.navigate('App', {
              screen: 'Maps',
            });
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 22,
    paddingBottom: 48,
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  back: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  hero: {
    gap: 8,
    paddingVertical: 22,
  },
  notice: {
    gap: 6,
  },
  section: {
    gap: 12,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  areaList: {
    gap: 10,
  },
  area: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 66,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  areaCopy: {
    flex: 1,
    gap: 3,
  },
});
