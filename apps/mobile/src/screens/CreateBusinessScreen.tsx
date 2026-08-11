import { ApiClientError, createMarketplaceBusiness } from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Card, TextField } from '../components';
import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateBusiness'>;

interface BusinessDraft {
  name: string;
  category: string;
  description: string;
}

const INITIAL_DRAFT: BusinessDraft = {
  name: '',
  category: '',
  description: '',
};

export default function CreateBusinessScreen({ navigation, route }: Props) {
  const { theme } = useNeighbourTheme();

  const [draft, setDraft] = useState<BusinessDraft>(INITIAL_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof BusinessDraft>(key: K, value: BusinessDraft[K]) => {
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

    const name = draft.name.trim();
    const category = draft.category.trim();
    const description = draft.description.trim();

    if (name.length < 3) {
      setError('Enter a business name of at least 3 characters.');
      return;
    }

    if (category.length < 2) {
      setError('Enter a business category.');
      return;
    }

    if (description.length < 10) {
      setError('Add a description of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const business = await createMarketplaceBusiness({
        communityId: route.params.communityId,
        name,
        category,
        description,
      });

      navigation.replace('BusinessDetail', {
        business,
      });
    } catch (caughtError) {
      if (caughtError instanceof ApiClientError) {
        if (caughtError.status === 400) {
          setError('Check the business details and try again.');
        } else if (caughtError.status === 401) {
          setError('Your session has expired. Please sign in again.');
        } else if (caughtError.status === 403) {
          setError(
            'Business listings are unavailable or you are not an active member of this community.',
          );
        } else if (caughtError.status === 404) {
          setError('This community could not be found.');
        } else {
          setError(caughtError.message || 'The business could not be created.');
        }
      } else {
        setError('The business could not be created. Please try again.');
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
            accessibilityLabel="Cancel business creation"
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
            <AppText variant="bodyStrong">Create business</AppText>

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
            <AppText variant="heading">List a local business</AppText>

            <AppText tone="secondary">
              Create a business profile connected directly to {route.params.communityName}.
            </AppText>
          </View>

          <Card style={styles.formCard}>
            <TextField
              autoCapitalize="words"
              label="Business name"
              maxLength={120}
              onChangeText={(value) => {
                update('name', value);
              }}
              placeholder="Blackley Coffee House"
              value={draft.name}
            />

            <TextField
              autoCapitalize="words"
              label="Category"
              maxLength={80}
              onChangeText={(value) => {
                update('category', value);
              }}
              placeholder="Cafe"
              value={draft.category}
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
                placeholder="Tell neighbours what the business offers and why they should visit."
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

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create business"
            disabled={submitting}
            onPress={() => {
              void submit();
            }}
            style={[
              styles.submitButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.lg,
                opacity: submitting ? 0.65 : 1,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={theme.colors.inverseText} size="small" />
            ) : (
              <AppText variant="bodyStrong" tone="inverse">
                Create business
              </AppText>
            )}
          </Pressable>

          <AppText variant="caption" tone="muted" style={styles.footnote}>
            Your Neighbour account becomes the owner of this business profile.
          </AppText>
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
    gap: 12,
    paddingHorizontal: 16,
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
    gap: 1,
  },
  content: {
    gap: 20,
    paddingBottom: 50,
    paddingHorizontal: 18,
  },
  intro: {
    gap: 8,
    paddingTop: 8,
  },
  formCard: {
    gap: 18,
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
    lineHeight: 22,
    minHeight: 140,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  errorCard: {
    borderWidth: 1,
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  footnote: {
    textAlign: 'center',
  },
});
