import {
  ApiClientError,
  createCommunity,
  type CommunityCategory,
  type CommunityJoinPolicy,
  type CommunityVisibility,
  type CreateCommunityRequest,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Card } from '../components';
import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateCommunity'>;

type WizardStep = 'identity' | 'purpose' | 'location' | 'settings' | 'review';

interface CommunityDraft {
  name: string;
  handle: string;
  shortDescription: string;
  description: string;
  category: CommunityCategory;
  tags: string;
  city: string;
  postcode: string;
  visibility: CommunityVisibility;
  joinPolicy: CommunityJoinPolicy;
  welcomeMessage: string;
  rules: string;
  allowMemberPosts: boolean;
  allowBusinesses: boolean;
  allowMarketplace: boolean;
  allowEvents: boolean;
}

const STEPS: Array<{
  id: WizardStep;
  label: string;
  number: number;
}> = [
  {
    id: 'identity',
    label: 'Identity',
    number: 1,
  },
  {
    id: 'purpose',
    label: 'Purpose',
    number: 2,
  },
  {
    id: 'location',
    label: 'Location',
    number: 3,
  },
  {
    id: 'settings',
    label: 'Settings',
    number: 4,
  },
  {
    id: 'review',
    label: 'Review',
    number: 5,
  },
];

const CATEGORIES: Array<{
  id: CommunityCategory;
  label: string;
  symbol: string;
}> = [
  {
    id: 'LOCAL_AREA',
    label: 'Local area',
    symbol: '⌖',
  },
  {
    id: 'STREET',
    label: 'Street',
    symbol: '↔',
  },
  {
    id: 'ESTATE',
    label: 'Estate',
    symbol: '▦',
  },
  {
    id: 'VILLAGE',
    label: 'Village',
    symbol: '⌂',
  },
  {
    id: 'TOWN',
    label: 'Town',
    symbol: '◎',
  },
  {
    id: 'CITY',
    label: 'City',
    symbol: '▥',
  },
  {
    id: 'SCHOOL',
    label: 'School',
    symbol: '◇',
  },
  {
    id: 'PARENTS',
    label: 'Parents',
    symbol: '◉',
  },
  {
    id: 'SPORTS',
    label: 'Sports',
    symbol: '●',
  },
  {
    id: 'CHARITY',
    label: 'Charity',
    symbol: '♡',
  },
  {
    id: 'BUSINESS_NETWORK',
    label: 'Business',
    symbol: '▣',
  },
  {
    id: 'HOBBY',
    label: 'Hobby',
    symbol: '✦',
  },
  {
    id: 'FAITH',
    label: 'Faith',
    symbol: '✧',
  },
  {
    id: 'OTHER',
    label: 'Other',
    symbol: '○',
  },
];

const INITIAL_DRAFT: CommunityDraft = {
  name: '',
  handle: '',
  shortDescription: '',
  description: '',
  category: 'LOCAL_AREA',
  tags: '',
  city: '',
  postcode: '',
  visibility: 'PUBLIC',
  joinPolicy: 'OPEN',
  welcomeMessage: '',
  rules: '',
  allowMemberPosts: true,
  allowBusinesses: true,
  allowMarketplace: true,
  allowEvents: true,
};

function normaliseHandle(value: string): string {
  return value
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 40);
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  autoCapitalize = 'sentences',
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
}) {
  const { theme } = useNeighbourTheme();

  return (
    <View style={styles.field}>
      <View style={styles.fieldHeading}>
        <AppText variant="label">{label}</AppText>

        {maxLength ? (
          <AppText variant="caption" tone="muted">
            {value.length}/{maxLength}
          </AppText>
        ) : null}
      </View>

      <TextInput
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCapitalize !== 'none'}
        maxLength={maxLength}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.primary}
        style={[
          styles.input,
          multiline && styles.multiline,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.borderStrong,
            borderRadius: theme.radius.lg,
            color: theme.colors.text,
          },
        ]}
        textAlignVertical={multiline ? 'top' : 'center'}
        value={value}
      />
    </View>
  );
}

function ToggleRow({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { theme } = useNeighbourTheme();

  return (
    <View
      style={[
        styles.toggleRow,
        {
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.toggleCopy}>
        <AppText variant="bodyStrong">{title}</AppText>

        <AppText variant="caption" tone="secondary">
          {description}
        </AppText>
      </View>

      <Switch
        onValueChange={onValueChange}
        trackColor={{
          false: theme.colors.borderStrong,
          true: theme.colors.primarySoft,
        }}
        thumbColor={value ? theme.colors.primary : theme.colors.textMuted}
        value={value}
      />
    </View>
  );
}

export default function CreateCommunityScreen({ navigation }: Props) {
  const { theme } = useNeighbourTheme();

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<CommunityDraft>(INITIAL_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = STEPS[stepIndex];

  const update = <Key extends keyof CommunityDraft>(key: Key, value: CommunityDraft[Key]) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const validationMessage = useMemo(() => {
    if (currentStep.id === 'identity') {
      if (draft.name.trim().length < 3) {
        return 'Enter a community name of at least three characters.';
      }

      if (draft.handle && draft.handle.trim().length < 3) {
        return 'The community handle must contain at least three characters.';
      }
    }

    if (currentStep.id === 'purpose') {
      if (draft.shortDescription.trim().length < 10) {
        return 'Add a short description so neighbours understand the community.';
      }

      if (draft.description.trim().length < 20) {
        return 'Add a fuller description of at least twenty characters.';
      }
    }

    if (currentStep.id === 'location') {
      if (draft.city.trim().length < 2) {
        return 'Enter the town or city served by this community.';
      }

      if (draft.postcode.trim().length < 5) {
        return 'Enter a valid UK postcode.';
      }
    }

    return null;
  }, [currentStep.id, draft]);

  const next = () => {
    setError(null);

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const previous = () => {
    setError(null);

    if (stepIndex === 0) {
      navigation.goBack();
      return;
    }

    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const submit = async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const data: CreateCommunityRequest = {
      name: draft.name.trim(),
      ...(draft.handle.trim()
        ? {
            handle: normaliseHandle(draft.handle.trim()),
          }
        : {}),
      shortDescription: draft.shortDescription.trim(),
      description: draft.description.trim(),
      category: draft.category,
      tags: draft.tags
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      city: draft.city.trim(),
      postcode: draft.postcode.trim().toUpperCase(),
      visibility: draft.visibility,
      joinPolicy: draft.joinPolicy,
      approvalRequired: draft.joinPolicy === 'APPROVAL',
      welcomeMessage: draft.welcomeMessage.trim() || `Welcome to ${draft.name.trim()}.`,
      rules: draft.rules
        .split('\n')
        .map((rule) => rule.trim())
        .filter(Boolean),
      allowMemberPosts: draft.allowMemberPosts,
      allowBusinesses: draft.allowBusinesses,
      allowMarketplace: draft.allowMarketplace,
      allowEvents: draft.allowEvents,
      discoverable: draft.visibility === 'PUBLIC',
      locationVisibility: 'PUBLIC',
    };

    try {
      const community = await createCommunity(data);

      navigation.replace('CommunityDetail', {
        slug: community.slug,
      });
    } catch (caughtError) {
      if (caughtError instanceof ApiClientError) {
        setError(caughtError.message || 'The community could not be created.');
      } else {
        setError('The community could not be created. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep.id) {
      case 'identity':
        return (
          <>
            <View style={styles.sectionHeading}>
              <AppText variant="heading">Name your community</AppText>

              <AppText tone="secondary">
                Create a clear identity that neighbours can recognise and search for.
              </AppText>
            </View>

            <Field
              label="Community name"
              maxLength={100}
              onChangeText={(value) => update('name', value)}
              placeholder="Blackley Residents"
              value={draft.name}
            />

            <Field
              autoCapitalize="none"
              label="Community handle"
              maxLength={40}
              onChangeText={(value) => update('handle', normaliseHandle(value))}
              placeholder="blackley.residents"
              value={draft.handle}
            />

            <Card variant="muted" style={styles.tipCard}>
              <AppText variant="bodyStrong" tone="brand">
                Your public identity
              </AppText>

              <AppText variant="caption" tone="secondary">
                {draft.handle
                  ? `@${draft.handle}`
                  : 'A unique handle will be generated automatically if you leave this blank.'}
              </AppText>
            </Card>
          </>
        );

      case 'purpose':
        return (
          <>
            <View style={styles.sectionHeading}>
              <AppText variant="heading">Define its purpose</AppText>

              <AppText tone="secondary">
                Explain what the community is for and who it serves.
              </AppText>
            </View>

            <View style={styles.categoryGrid}>
              {CATEGORIES.map((category) => {
                const selected = draft.category === category.id;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={category.id}
                    onPress={() => update('category', category.id)}
                    style={[
                      styles.category,
                      {
                        backgroundColor: selected ? theme.colors.primarySoft : theme.colors.surface,
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                        borderRadius: theme.radius.lg,
                      },
                    ]}
                  >
                    <AppText
                      style={{
                        color: selected ? theme.colors.primary : theme.colors.textMuted,
                        fontSize: 22,
                      }}
                    >
                      {category.symbol}
                    </AppText>

                    <AppText
                      variant="caption"
                      style={{
                        color: selected ? theme.colors.primary : theme.colors.text,
                        fontWeight: '700',
                      }}
                    >
                      {category.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <Field
              label="Short description"
              maxLength={160}
              onChangeText={(value) => update('shortDescription', value)}
              placeholder="A trusted local space for people living in Blackley."
              value={draft.shortDescription}
            />

            <Field
              label="Full description"
              maxLength={3000}
              multiline
              onChangeText={(value) => update('description', value)}
              placeholder="Tell neighbours what they can discuss, share and achieve together."
              value={draft.description}
            />

            <Field
              autoCapitalize="none"
              label="Search tags"
              onChangeText={(value) => update('tags', value)}
              placeholder="blackley, residents, manchester, local"
              value={draft.tags}
            />
          </>
        );

      case 'location':
        return (
          <>
            <View style={styles.sectionHeading}>
              <AppText variant="heading">Set the local area</AppText>

              <AppText tone="secondary">
                This helps nearby neighbours discover the right community.
              </AppText>
            </View>

            <Field
              autoCapitalize="words"
              label="Town or city"
              maxLength={100}
              onChangeText={(value) => update('city', value)}
              placeholder="Manchester"
              value={draft.city}
            />

            <Field
              autoCapitalize="characters"
              label="Postcode"
              maxLength={12}
              onChangeText={(value) => update('postcode', value.toUpperCase())}
              placeholder="M9 8AB"
              value={draft.postcode}
            />

            <Card variant="muted" style={styles.locationCard}>
              <View
                style={[
                  styles.locationIcon,
                  {
                    backgroundColor: theme.colors.primarySoft,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText
                  style={{
                    color: theme.colors.primary,
                    fontSize: 28,
                  }}
                >
                  ⌖
                </AppText>
              </View>

              <View style={styles.locationCopy}>
                <AppText variant="bodyStrong">Nearby discovery ready</AppText>

                <AppText variant="caption" tone="secondary">
                  Exact map coordinates can be added through the community settings after creation.
                </AppText>
              </View>
            </Card>
          </>
        );

      case 'settings':
        return (
          <>
            <View style={styles.sectionHeading}>
              <AppText variant="heading">Choose how it operates</AppText>

              <AppText tone="secondary">
                Control visibility, joining and the tools available to members.
              </AppText>
            </View>

            <AppText variant="label">Visibility</AppText>

            <View style={styles.optionRow}>
              {(
                [
                  ['PUBLIC', 'Public'],
                  ['PRIVATE', 'Private'],
                  ['INVITE_ONLY', 'Invite only'],
                ] as Array<[CommunityVisibility, string]>
              ).map(([value, label]) => {
                const selected = draft.visibility === value;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={value}
                    onPress={() => update('visibility', value)}
                    style={[
                      styles.option,
                      {
                        backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                        borderRadius: theme.radius.pill,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      style={{
                        color: selected ? theme.colors.inverseText : theme.colors.text,
                        fontWeight: '700',
                      }}
                    >
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <AppText variant="label">Joining policy</AppText>

            <View style={styles.optionRow}>
              {(
                [
                  ['OPEN', 'Open'],
                  ['APPROVAL', 'Approval'],
                  ['INVITE_ONLY', 'Invite'],
                ] as Array<[CommunityJoinPolicy, string]>
              ).map(([value, label]) => {
                const selected = draft.joinPolicy === value;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={value}
                    onPress={() => update('joinPolicy', value)}
                    style={[
                      styles.option,
                      {
                        backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                        borderColor: selected ? theme.colors.primary : theme.colors.border,
                        borderRadius: theme.radius.pill,
                      },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      style={{
                        color: selected ? theme.colors.inverseText : theme.colors.text,
                        fontWeight: '700',
                      }}
                    >
                      {label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <Card style={styles.settingsCard}>
              <ToggleRow
                description="Members can create posts in the community feed."
                onValueChange={(value) => update('allowMemberPosts', value)}
                title="Member posts"
                value={draft.allowMemberPosts}
              />

              <ToggleRow
                description="Local businesses can be connected to this community."
                onValueChange={(value) => update('allowBusinesses', value)}
                title="Businesses"
                value={draft.allowBusinesses}
              />

              <ToggleRow
                description="Members can buy, sell and share local listings."
                onValueChange={(value) => update('allowMarketplace', value)}
                title="Marketplace"
                value={draft.allowMarketplace}
              />

              <ToggleRow
                description="Organisers can publish community events."
                onValueChange={(value) => update('allowEvents', value)}
                title="Events"
                value={draft.allowEvents}
              />
            </Card>

            <Field
              label="Welcome message"
              maxLength={500}
              multiline
              onChangeText={(value) => update('welcomeMessage', value)}
              placeholder="Welcome new members and explain what happens next."
              value={draft.welcomeMessage}
            />

            <Field
              label="Community rules"
              multiline
              onChangeText={(value) => update('rules', value)}
              placeholder={'Be respectful\nProtect privacy\nKeep posts relevant'}
              value={draft.rules}
            />
          </>
        );

      case 'review':
        return (
          <>
            <View style={styles.sectionHeading}>
              <AppText variant="heading">Ready to launch</AppText>

              <AppText tone="secondary">
                Review the new community before publishing it to Neighbour.
              </AppText>
            </View>

            <Card style={styles.previewCard}>
              <View
                style={[
                  styles.previewMark,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.radius.xl,
                  },
                ]}
              >
                <AppText variant="heading" tone="inverse">
                  {draft.name.trim().charAt(0) || 'N'}
                </AppText>
              </View>

              <View style={styles.previewCopy}>
                <AppText variant="heading">{draft.name.trim()}</AppText>

                <AppText variant="caption" tone="brand">
                  @{draft.handle || 'generated-on-publish'}
                </AppText>

                <AppText tone="secondary">{draft.shortDescription.trim()}</AppText>
              </View>
            </Card>

            <View style={styles.reviewGrid}>
              <Card variant="muted" style={styles.reviewItem}>
                <AppText variant="caption" tone="muted">
                  Category
                </AppText>

                <AppText variant="bodyStrong">
                  {CATEGORIES.find((item) => item.id === draft.category)?.label}
                </AppText>
              </Card>

              <Card variant="muted" style={styles.reviewItem}>
                <AppText variant="caption" tone="muted">
                  Location
                </AppText>

                <AppText variant="bodyStrong">
                  {draft.city}, {draft.postcode}
                </AppText>
              </Card>

              <Card variant="muted" style={styles.reviewItem}>
                <AppText variant="caption" tone="muted">
                  Visibility
                </AppText>

                <AppText variant="bodyStrong">{draft.visibility}</AppText>
              </Card>

              <Card variant="muted" style={styles.reviewItem}>
                <AppText variant="caption" tone="muted">
                  Joining
                </AppText>

                <AppText variant="bodyStrong">{draft.joinPolicy}</AppText>
              </Card>
            </View>

            <Card variant="muted" style={styles.ownerCard}>
              <AppText variant="bodyStrong" tone="brand">
                You become the community owner
              </AppText>

              <AppText variant="caption" tone="secondary">
                You will receive owner permissions and an active membership automatically.
              </AppText>
            </Card>
          </>
        );
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
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={previous}
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
            <AppText variant="bodyStrong">Create Community</AppText>

            <AppText variant="caption" tone="secondary">
              Step {currentStep.number} of {STEPS.length}
            </AppText>
          </View>
        </View>

        <View style={styles.progress}>
          {STEPS.map((step, index) => (
            <View
              key={step.id}
              style={[
                styles.progressSegment,
                {
                  backgroundColor: index <= stepIndex ? theme.colors.primary : theme.colors.border,
                  borderRadius: theme.radius.pill,
                },
              ]}
            />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}

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
                Check this step
              </AppText>

              <AppText tone="secondary">{error}</AppText>
            </Card>
          ) : null}
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            onPress={previous}
            style={[
              styles.footerButton,
              {
                borderColor: theme.colors.borderStrong,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="label">{stepIndex === 0 ? 'Cancel' : 'Back'}</AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            onPress={() => {
              if (currentStep.id === 'review') {
                void submit();
              } else {
                next();
              }
            }}
            style={[
              styles.footerButton,
              styles.primaryButton,
              {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.primary,
                borderRadius: theme.radius.pill,
                opacity: submitting ? 0.65 : 1,
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={theme.colors.inverseText} size="small" />
            ) : (
              <AppText variant="label" tone="inverse">
                {currentStep.id === 'review' ? 'Create Community' : 'Continue'}
              </AppText>
            )}
          </Pressable>
        </View>
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
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  topCopy: {
    flex: 1,
    gap: 2,
  },
  progress: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  progressSegment: {
    flex: 1,
    height: 4,
  },
  content: {
    gap: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeading: {
    gap: 8,
  },
  field: {
    gap: 8,
  },
  fieldHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: 1,
    fontSize: 16,
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  multiline: {
    minHeight: 120,
  },
  tipCard: {
    gap: 5,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  category: {
    alignItems: 'center',
    borderWidth: 1,
    gap: 6,
    justifyContent: 'center',
    minHeight: 78,
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: '30%',
  },
  locationCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  locationIcon: {
    alignItems: 'center',
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  locationCopy: {
    flex: 1,
    gap: 4,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  option: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  settingsCard: {
    paddingBottom: 0,
    paddingTop: 0,
  },
  toggleRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 18,
    paddingVertical: 15,
  },
  toggleCopy: {
    flex: 1,
    gap: 3,
  },
  previewCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  previewMark: {
    alignItems: 'center',
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  previewCopy: {
    flex: 1,
    gap: 5,
  },
  reviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  reviewItem: {
    gap: 5,
    width: '48%',
  },
  ownerCard: {
    gap: 5,
  },
  errorCard: {
    gap: 5,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  footerButton: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 18,
  },
  primaryButton: {
    flex: 1.35,
  },
});
