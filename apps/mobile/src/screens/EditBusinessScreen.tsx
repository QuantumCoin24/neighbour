import {
  ApiClientError,
  deleteMarketplaceBusiness,
  updateMarketplaceBusiness,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Card, TextField } from '../components';
import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EditBusiness'>;

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.status === 400) {
      return 'Check the business details and try again.';
    }

    if (error.status === 401) {
      return 'Your session has expired. Please sign in again.';
    }

    if (error.status === 403) {
      return 'You do not have permission to manage this business.';
    }

    if (error.status === 404) {
      return 'This business could not be found.';
    }

    return error.message || 'The business could not be updated.';
  }

  if (error instanceof TypeError) {
    return 'The Neighbour service could not be reached. Check your connection and try again.';
  }

  return 'Something went wrong. Please try again.';
}

export default function EditBusinessScreen({ navigation, route }: Props) {
  const { theme } = useNeighbourTheme();
  const business = route.params.business;

  const [name, setName] = useState(business.name);
  const [category, setCategory] = useState(business.category);
  const [description, setDescription] = useState(business.description);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (saving || deleting) {
      return;
    }

    const normalizedName = name.trim();
    const normalizedCategory = category.trim();
    const normalizedDescription = description.trim();

    if (normalizedName.length < 3) {
      setError('Enter a business name of at least 3 characters.');
      return;
    }

    if (normalizedCategory.length < 2) {
      setError('Enter a business category.');
      return;
    }

    if (normalizedDescription.length < 10) {
      setError('Add a description of at least 10 characters.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateMarketplaceBusiness(business.id, {
        name: normalizedName,
        category: normalizedCategory,
        description: normalizedDescription,
      });

      navigation.goBack();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
      setSaving(false);
    }
  };

  const performDelete = async () => {
    if (deleting || saving) {
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteMarketplaceBusiness(business.id);

      // Remove both EditBusiness and the now-deleted BusinessDetail
      // from the native stack. CommunityDetail is directly underneath
      // and refreshes automatically when it regains focus.
      navigation.pop(2);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (deleting || saving) {
      return;
    }

    Alert.alert(
      'Delete business?',
      'This permanently removes the business profile, verification record, offers and business events. This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete business',
          style: 'destructive',
          onPress: () => {
            void performDelete();
          },
        },
      ],
    );
  };

  const busy = saving || deleting;

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
            accessibilityLabel="Go back"
            accessibilityRole="button"
            disabled={busy}
            onPress={() => {
              navigation.goBack();
            }}
            style={[
              styles.back,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderRadius: theme.radius.pill,
                opacity: busy ? 0.5 : 1,
              },
            ]}
          >
            <AppText variant="heading">‹</AppText>
          </Pressable>

          <View style={styles.topCopy}>
            <AppText variant="bodyStrong">Manage business</AppText>

            <AppText variant="caption" tone="secondary" numberOfLines={1}>
              {business.name}
            </AppText>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <AppText variant="heading">Edit business profile</AppText>

            <AppText tone="secondary">
              Keep the information neighbours see about your business accurate and up to date.
            </AppText>
          </View>

          <Card style={styles.form}>
            <TextField
              autoCapitalize="words"
              label="Business name"
              maxLength={120}
              onChangeText={(value) => {
                setName(value);
                setError(null);
              }}
              value={name}
            />

            <TextField
              autoCapitalize="words"
              label="Category"
              maxLength={80}
              onChangeText={(value) => {
                setCategory(value);
                setError(null);
              }}
              value={category}
            />

            <View style={styles.field}>
              <View style={styles.fieldHeading}>
                <AppText variant="label">Description</AppText>

                <AppText variant="caption" tone="muted">
                  {description.length}/1000
                </AppText>
              </View>

              <TextInput
                editable={!busy}
                maxLength={1000}
                multiline
                onChangeText={(value) => {
                  setDescription(value);
                  setError(null);
                }}
                placeholder="Tell neighbours about your business."
                placeholderTextColor={theme.colors.textMuted}
                selectionColor={theme.colors.primary}
                style={[
                  styles.description,
                  {
                    backgroundColor: theme.colors.inputBackground,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.lg,
                    color: theme.colors.text,
                  },
                ]}
                textAlignVertical="top"
                value={description}
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
            accessibilityLabel="Save business changes"
            accessibilityRole="button"
            disabled={busy}
            onPress={() => {
              void save();
            }}
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.lg,
                opacity: busy ? 0.65 : 1,
              },
            ]}
          >
            {saving ? (
              <ActivityIndicator color={theme.colors.inverseText} size="small" />
            ) : (
              <AppText variant="bodyStrong" tone="inverse">
                Save changes
              </AppText>
            )}
          </Pressable>

          <Card
            variant="muted"
            style={[
              styles.dangerZone,
              {
                borderColor: theme.colors.danger,
              },
            ]}
          >
            <View style={styles.dangerCopy}>
              <AppText variant="subheading">Delete business</AppText>

              <AppText tone="secondary">
                Permanently remove this business profile from Neighbour.
              </AppText>
            </View>

            <Pressable
              accessibilityLabel="Delete business"
              accessibilityRole="button"
              disabled={busy}
              onPress={confirmDelete}
              style={[
                styles.deleteButton,
                {
                  borderColor: theme.colors.danger,
                  borderRadius: theme.radius.lg,
                  opacity: busy ? 0.5 : 1,
                },
              ]}
            >
              {deleting ? (
                <ActivityIndicator color={theme.colors.danger} size="small" />
              ) : (
                <AppText
                  variant="bodyStrong"
                  style={{
                    color: theme.colors.danger,
                  }}
                >
                  Delete business
                </AppText>
              )}
            </Pressable>
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
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  back: {
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
  form: {
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
  description: {
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
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  dangerZone: {
    borderWidth: 1,
    gap: 16,
  },
  dangerCopy: {
    gap: 6,
  },
  deleteButton: {
    alignItems: 'center',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 50,
    paddingHorizontal: 16,
  },
});
