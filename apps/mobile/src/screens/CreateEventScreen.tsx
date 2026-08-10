import { ApiClientError, createEvent } from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSessionAccessToken } from '../auth/session';
import { AppText, Button, Card, TextField } from '../components';
import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateEvent'>;

interface EventDraft {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

const INITIAL_DRAFT: EventDraft = {
  title: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
};

function parseLocalDateTime(date: string, time: string): Date | null {
  const dateMatch = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const timeMatch = time.trim().match(/^(\d{1,2}):(\d{2})$/);

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);

  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const value = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    value.getFullYear() !== year ||
    value.getMonth() !== month - 1 ||
    value.getDate() !== day ||
    value.getHours() !== hour ||
    value.getMinutes() !== minute
  ) {
    return null;
  }

  return value;
}

function todayString(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default function CreateEventScreen({ navigation, route }: Props) {
  const { theme } = useNeighbourTheme();

  const [draft, setDraft] = useState<EventDraft>(() => ({
    ...INITIAL_DRAFT,
    startDate: todayString(),
    endDate: todayString(),
  }));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useMemo(
    () => parseLocalDateTime(draft.startDate, draft.startTime),
    [draft.startDate, draft.startTime],
  );

  const end = useMemo(
    () => parseLocalDateTime(draft.endDate, draft.endTime),
    [draft.endDate, draft.endTime],
  );

  const update = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));

    if (error) {
      setError(null);
    }
  };

  const submit = async () => {
    if (submitting) {
      return;
    }

    const title = draft.title.trim();
    const description = draft.description.trim();

    if (title.length < 3) {
      setError('Give the event a title of at least 3 characters.');
      return;
    }

    if (!description) {
      setError('Add a short description so neighbours know what the event is about.');
      return;
    }

    if (!start) {
      setError('Enter a valid start date and time.');
      return;
    }

    if (!end) {
      setError('Enter a valid end date and time.');
      return;
    }

    if (end.getTime() <= start.getTime()) {
      setError('The event must finish after it starts.');
      return;
    }

    const token = getSessionAccessToken();

    if (!token) {
      setError('Your session has expired. Please sign in again.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createEvent(token, {
        communityId: route.params.communityId,
        title,
        description,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
      });

      navigation.goBack();
    } catch (caughtError) {
      if (caughtError instanceof ApiClientError) {
        if (caughtError.status === 400) {
          setError('Check the event details and try again.');
        } else if (caughtError.status === 401) {
          setError('Your session has expired. Please sign in again.');
        } else if (caughtError.status === 403) {
          setError('You do not have permission to create events in this community.');
        } else {
          setError('The event could not be created. Please try again.');
        }
      } else {
        setError('The event could not be created. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Cancel event creation"
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
            <AppText variant="heading">‹</AppText>
          </Pressable>

          <View style={styles.topCopy}>
            <AppText variant="bodyStrong">Create event</AppText>

            <AppText variant="caption" tone="secondary" numberOfLines={1}>
              {route.params.communityName}
            </AppText>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <AppText variant="heading">Bring neighbours together</AppText>

            <AppText tone="secondary">
              Publish an event directly to {route.params.communityName}.
            </AppText>
          </View>

          <Card style={styles.formCard}>
            <TextField
              autoCapitalize="sentences"
              label="Event title"
              maxLength={120}
              onChangeText={(value) => {
                update('title', value);
              }}
              placeholder="Community clean-up"
              value={draft.title}
            />

            <View style={styles.field}>
              <View style={styles.fieldHeading}>
                <AppText variant="label">Description</AppText>

                <AppText variant="caption" tone="muted">
                  {draft.description.length}/1000
                </AppText>
              </View>

              <TextInput
                maxLength={1000}
                multiline
                onChangeText={(value) => {
                  update('description', value);
                }}
                placeholder="Tell neighbours what is happening, where to meet and what to bring."
                placeholderTextColor={theme.colors.textMuted}
                selectionColor={theme.colors.primary}
                style={[
                  styles.descriptionInput,
                  {
                    backgroundColor: theme.colors.inputBackground,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.lg,
                    color: theme.colors.text,
                  },
                ]}
                textAlignVertical="top"
                value={draft.description}
              />
            </View>
          </Card>

          <Card style={styles.formCard}>
            <View style={styles.sectionHeading}>
              <AppText variant="subheading">Starts</AppText>

              <AppText variant="caption" tone="secondary">
                Local time
              </AppText>
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateColumn}>
                <TextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="numbers-and-punctuation"
                  label="Date"
                  onChangeText={(value) => {
                    update('startDate', value);
                  }}
                  placeholder="2026-08-15"
                  value={draft.startDate}
                />
              </View>

              <View style={styles.timeColumn}>
                <TextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="numbers-and-punctuation"
                  label="Time"
                  onChangeText={(value) => {
                    update('startTime', value);
                  }}
                  placeholder="14:00"
                  value={draft.startTime}
                />
              </View>
            </View>

            <View style={styles.sectionHeading}>
              <AppText variant="subheading">Ends</AppText>

              <AppText variant="caption" tone="secondary">
                Local time
              </AppText>
            </View>

            <View style={styles.dateRow}>
              <View style={styles.dateColumn}>
                <TextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="numbers-and-punctuation"
                  label="Date"
                  onChangeText={(value) => {
                    update('endDate', value);
                  }}
                  placeholder="2026-08-15"
                  value={draft.endDate}
                />
              </View>

              <View style={styles.timeColumn}>
                <TextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="numbers-and-punctuation"
                  label="Time"
                  onChangeText={(value) => {
                    update('endTime', value);
                  }}
                  placeholder="16:00"
                  value={draft.endTime}
                />
              </View>
            </View>
          </Card>

          <Card variant="muted" style={styles.infoCard}>
            <AppText variant="bodyStrong" tone="brand">
              Community event
            </AppText>

            <AppText variant="caption" tone="secondary">
              Once published, this event will appear in the community Events section for neighbours.
            </AppText>
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
                variant="bodyStrong"
                style={{
                  color: theme.colors.danger,
                }}
              >
                Event not published
              </AppText>

              <AppText tone="secondary">{error}</AppText>
            </Card>
          ) : null}

          <View style={styles.actions}>
            <Button
              disabled={submitting}
              label="Cancel"
              onPress={() => {
                navigation.goBack();
              }}
              variant="secondary"
            />

            <Button
              label="Publish event"
              loading={submitting}
              onPress={() => {
                void submit();
              }}
            />
          </View>
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
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  topCopy: {
    flex: 1,
    gap: 2,
  },
  content: {
    gap: 18,
    padding: 20,
    paddingBottom: 48,
  },
  intro: {
    gap: 8,
    paddingVertical: 4,
  },
  formCard: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  fieldHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  descriptionInput: {
    borderWidth: 1,
    fontSize: 16,
    minHeight: 140,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateColumn: {
    flex: 1.4,
  },
  timeColumn: {
    flex: 0.8,
  },
  infoCard: {
    gap: 6,
  },
  errorCard: {
    borderWidth: 1,
    gap: 6,
  },
  actions: {
    gap: 12,
  },
});
