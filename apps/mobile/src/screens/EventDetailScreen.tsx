import {
  ApiClientError,
  attendEvent,
  getEvent,
  getEventAttendance,
  leaveEvent,
  type EventAttendance,
  type EventItem,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../auth/auth-context';
import { getSession } from '../auth/session';
import { AppText, Card } from '../components';
import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type EventDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'EventDetail'>;

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 404) {
      return 'This event could not be found.';
    }

    if (error.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }

    if (error.status >= 500) {
      return 'Neighbour is temporarily unavailable. Please try again shortly.';
    }

    return `Neighbour could not complete the request (HTTP ${error.status}).`;
  }

  if (error instanceof TypeError) {
    return 'The Neighbour service could not be reached. Check your connection and try again.';
  }

  return 'Something went wrong. Please try again.';
}

export default function EventDetailScreen({ navigation, route }: EventDetailScreenProps) {
  const { theme } = useNeighbourTheme();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [attendance, setAttendance] = useState<EventAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [changingAttendance, setChangingAttendance] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [eventResult, attendanceResult] = await Promise.all([
      getEvent(route.params.eventId),
      getEventAttendance(route.params.eventId),
    ]);

    setEvent(eventResult);
    setAttendance(attendanceResult);
  }, [route.params.eventId]);

  const initialLoad = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await load();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    void initialLoad();
  }, [initialLoad]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      await load();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const isGoing = useMemo(
    () => Boolean(user && attendance.some((item) => item.userId === user.id)),
    [attendance, user],
  );

  const attendanceCount = attendance.length;

  const changeAttendance = useCallback(async () => {
    if (changingAttendance) {
      return;
    }

    const session = getSession();

    if (!session) {
      setError('Your session is unavailable. Please sign in again.');
      return;
    }

    setChangingAttendance(true);
    setError(null);

    try {
      if (isGoing) {
        await leaveEvent(session.accessToken, route.params.eventId);
      } else {
        await attendEvent(session.accessToken, route.params.eventId);
      }

      const updatedAttendance = await getEventAttendance(route.params.eventId);
      setAttendance(updatedAttendance);

      const updatedEvent = await getEvent(route.params.eventId);
      setEvent(updatedEvent);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setChangingAttendance(false);
    }
  }, [changingAttendance, isGoing, route.params.eventId]);

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
          accessibilityLabel="Go back"
          onPress={() => {
            navigation.goBack();
          }}
          style={[
            styles.back,
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
            Event
          </AppText>

          <AppText variant="caption" tone="secondary">
            Community event
          </AppText>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <AppText tone="secondary">Opening event…</AppText>
        </View>
      ) : null}

      {!loading && !event ? (
        <View style={styles.failure}>
          <AppText variant="heading">Event unavailable</AppText>

          <AppText tone="secondary">{error ?? 'This event could not be loaded.'}</AppText>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void initialLoad();
            }}
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.lg,
              },
            ]}
          >
            <AppText variant="bodyStrong" tone="inverse">
              Try again
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {event ? (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void refresh();
              }}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <Card
            style={[
              styles.hero,
              {
                backgroundColor: theme.colors.primaryStrong,
              },
            ]}
          >
            <View
              style={[
                styles.heroIcon,
                {
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  borderRadius: theme.radius.xxl,
                },
              ]}
            >
              <AppText tone="inverse" style={styles.heroSymbol}>
                ◇
              </AppText>
            </View>

            <AppText variant="heading" tone="inverse">
              {event.title}
            </AppText>

            <AppText tone="inverse">{event.description}</AppText>

            <View style={styles.heroMeta}>
              <AppText variant="caption" tone="inverse">
                {attendanceCount} {attendanceCount === 1 ? 'neighbour going' : 'neighbours going'}
              </AppText>
            </View>
          </Card>

          {error ? (
            <Card
              variant="muted"
              style={[
                styles.errorCard,
                {
                  borderColor: theme.colors.danger,
                },
              ]}
            >
              <AppText
                style={{
                  color: theme.colors.danger,
                }}
              >
                {error}
              </AppText>
            </Card>
          ) : null}

          <Card style={styles.section}>
            <AppText variant="subheading">When</AppText>

            <View style={styles.detailRow}>
              <AppText tone="secondary">Starts</AppText>
              <AppText variant="bodyStrong">{formatDate(event.startsAt)}</AppText>
            </View>

            <View style={styles.detailRow}>
              <AppText tone="secondary">Ends</AppText>
              <AppText variant="bodyStrong">{formatDate(event.endsAt)}</AppText>
            </View>
          </Card>

          <Card style={styles.section}>
            <AppText variant="subheading">About this event</AppText>

            <AppText tone="secondary">{event.description}</AppText>

            {event.community?.name ? (
              <View style={styles.detailRow}>
                <AppText tone="secondary">Community</AppText>
                <AppText variant="bodyStrong">{event.community.name}</AppText>
              </View>
            ) : null}

            {event.creator?.displayName ? (
              <View style={styles.detailRow}>
                <AppText tone="secondary">Created by</AppText>
                <AppText variant="bodyStrong">{event.creator.displayName}</AppText>
              </View>
            ) : null}
          </Card>

          <Card style={styles.section}>
            <View style={styles.attendanceHeader}>
              <View style={styles.attendanceCopy}>
                <AppText variant="subheading">Attendance</AppText>

                <AppText tone="secondary">
                  {attendanceCount === 0
                    ? 'Be the first neighbour to attend.'
                    : `${attendanceCount} ${
                        attendanceCount === 1 ? 'neighbour is' : 'neighbours are'
                      } going.`}
                </AppText>
              </View>

              {isGoing ? (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: `${theme.colors.primary}18`,
                      borderRadius: theme.radius.pill,
                    },
                  ]}
                >
                  <AppText variant="caption" tone="brand">
                    ✓ Going
                  </AppText>
                </View>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isGoing ? 'Leave event' : 'Attend event'}
              disabled={changingAttendance}
              onPress={() => {
                void changeAttendance();
              }}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: isGoing ? theme.colors.surfaceMuted : theme.colors.primary,
                  borderRadius: theme.radius.lg,
                  opacity: changingAttendance ? 0.65 : 1,
                },
              ]}
            >
              {changingAttendance ? (
                <ActivityIndicator
                  color={isGoing ? theme.colors.primary : '#ffffff'}
                  size="small"
                />
              ) : (
                <AppText variant="bodyStrong" tone={isGoing ? 'brand' : 'inverse'}>
                  {isGoing ? '✓ You’re going — Leave event' : 'I’m going'}
                </AppText>
              )}
            </Pressable>
          </Card>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  back: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },

  topCopy: {
    flex: 1,
    gap: 2,
  },

  loading: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    padding: 24,
  },

  failure: {
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },

  content: {
    gap: 16,
    padding: 20,
    paddingBottom: 48,
  },

  hero: {
    gap: 14,
    padding: 22,
  },

  heroIcon: {
    alignItems: 'center',
    height: 60,
    justifyContent: 'center',
    width: 60,
  },

  heroSymbol: {
    fontSize: 30,
  },

  heroMeta: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  errorCard: {
    borderWidth: 1,
  },

  section: {
    gap: 16,
  },

  detailRow: {
    gap: 5,
  },

  attendanceHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },

  attendanceCopy: {
    flex: 1,
    gap: 5,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
});
