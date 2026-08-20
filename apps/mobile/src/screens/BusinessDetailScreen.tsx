import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ApiClientError,
  reviewMarketplaceBusinessVerification,
  submitMarketplaceBusinessVerification,
} from '@neighbour/api-client';

import { useAuth } from '../auth/auth-context';
import { AppText, Card } from '../components';
import {
  MarketplaceEventCard,
  MarketplaceOfferCard,
  useBusinessDetail,
} from '../features/marketplace';
import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type BusinessDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'BusinessDetail'>;

type BusinessSection = 'about' | 'offers' | 'events' | 'insights';

const SECTIONS: {
  id: BusinessSection;
  label: string;
}[] = [
  { id: 'about', label: 'About' },
  { id: 'offers', label: 'Offers' },
  { id: 'events', label: 'Events' },
  { id: 'insights', label: 'Insights' },
];

export default function BusinessDetailScreen({ navigation, route }: BusinessDetailScreenProps) {
  const { theme } = useNeighbourTheme();
  const { user } = useAuth();
  const detail = useBusinessDetail(route.params.business);
  const [section, setSection] = useState<BusinessSection>('about');

  const business = detail.dashboard?.business ?? route.params.business;
  const verification = detail.dashboard?.verification ?? null;
  const canManageBusiness = Boolean(user && business.ownerId === user.id);
  const canReviewVerification = Boolean(
    user &&
    ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role) &&
    verification?.status === 'PENDING',
  );

  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationBusy, setVerificationBusy] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const hasFocusedRef = useRef(false);

  const getVerificationError = (error: unknown): string => {
    if (error instanceof ApiClientError) {
      if (error.status === 400) {
        return 'Check the verification details and try again.';
      }

      if (error.status === 403) {
        return 'You do not have permission to perform this verification action.';
      }

      if (error.status === 404) {
        return 'This business verification could not be found.';
      }

      if (error.status === 409) {
        return 'This verification is no longer awaiting that action.';
      }

      return `Verification request failed (HTTP ${error.status}).`;
    }

    if (error instanceof TypeError) {
      return 'Neighbour could not reach the verification service.';
    }

    return 'Something went wrong while processing verification.';
  };

  const submitVerification = async () => {
    if (verificationBusy) {
      return;
    }

    setVerificationBusy(true);
    setVerificationError(null);

    try {
      await submitMarketplaceBusinessVerification(business.id, verificationNotes);

      setVerificationNotes('');
      await detail.refresh();
    } catch (error) {
      setVerificationError(getVerificationError(error));
    } finally {
      setVerificationBusy(false);
    }
  };

  const reviewVerification = async (status: 'APPROVED' | 'REJECTED') => {
    if (verificationBusy) {
      return;
    }

    const normalizedNotes = verificationNotes.trim();

    if (status === 'REJECTED' && !normalizedNotes) {
      setVerificationError('Add a reason before rejecting this verification.');
      return;
    }

    setVerificationBusy(true);
    setVerificationError(null);

    try {
      await reviewMarketplaceBusinessVerification(business.id, {
        status,
        ...(normalizedNotes ? { notes: normalizedNotes } : {}),
      });

      setVerificationNotes('');
      await detail.refresh();
    } catch (error) {
      setVerificationError(getVerificationError(error));
    } finally {
      setVerificationBusy(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedRef.current) {
        void detail.refresh();
      } else {
        hasFocusedRef.current = true;
      }
    }, [detail.refresh]),
  );

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
            {business.name}
          </AppText>

          <AppText variant="caption" tone="secondary">
            {business.category}
          </AppText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={detail.refreshing}
            onRefresh={() => {
              void detail.refresh();
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
              ▣
            </AppText>
          </View>

          <AppText variant="heading" tone="inverse">
            {business.name}
          </AppText>

          <AppText tone="inverse">{business.description}</AppText>

          <View style={styles.badges}>
            <View style={styles.badge}>
              <AppText variant="caption" tone="inverse">
                {business.category}
              </AppText>
            </View>

            {business.verified ? (
              <View style={styles.badge}>
                <AppText variant="caption" tone="inverse">
                  Verified ✓
                </AppText>
              </View>
            ) : null}
          </View>
        </Card>

        {canManageBusiness ? (
          <Card style={styles.verificationCard}>
            <AppText variant="subheading">Business verification</AppText>

            <AppText tone="secondary">
              {verification?.status === 'PENDING'
                ? 'Your verification is awaiting review.'
                : verification?.status === 'APPROVED'
                  ? 'This business has been verified.'
                  : verification?.status === 'REJECTED'
                    ? 'Your verification was rejected. You can update the information and submit again.'
                    : 'Submit this business for verification to request a verified profile.'}
            </AppText>

            {verification?.notes ? (
              <View style={styles.verificationMessage}>
                <AppText variant="label">
                  {verification.status === 'REJECTED' ? 'Review reason' : 'Verification notes'}
                </AppText>

                <AppText tone="secondary">{verification.notes}</AppText>
              </View>
            ) : null}

            {verification?.status !== 'PENDING' && verification?.status !== 'APPROVED' ? (
              <>
                <TextInput
                  accessibilityLabel="Business verification notes"
                  editable={!verificationBusy}
                  multiline
                  onChangeText={setVerificationNotes}
                  placeholder="Add information for the verification reviewer"
                  placeholderTextColor={theme.colors.textMuted}
                  style={[
                    styles.verificationInput,
                    {
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                  value={verificationNotes}
                />

                <Pressable
                  accessibilityRole="button"
                  disabled={verificationBusy}
                  onPress={() => {
                    void submitVerification();
                  }}
                  style={[
                    styles.verificationPrimaryButton,
                    {
                      backgroundColor: theme.colors.primary,
                      borderRadius: theme.radius.lg,
                      opacity: verificationBusy ? 0.65 : 1,
                    },
                  ]}
                >
                  {verificationBusy ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <AppText variant="bodyStrong" tone="inverse">
                      {verification?.status === 'REJECTED'
                        ? 'Resubmit verification'
                        : 'Submit for verification'}
                    </AppText>
                  )}
                </Pressable>
              </>
            ) : null}

            {verificationError ? (
              <AppText
                style={{
                  color: theme.colors.danger,
                }}
              >
                {verificationError}
              </AppText>
            ) : null}
          </Card>
        ) : null}

        {canReviewVerification ? (
          <Card style={styles.verificationCard}>
            <AppText variant="subheading">Review business verification</AppText>

            <AppText tone="secondary">
              Review the submitted business information before approving or rejecting it.
            </AppText>

            {verification?.notes ? (
              <View style={styles.verificationMessage}>
                <AppText variant="label">Owner submission</AppText>
                <AppText tone="secondary">{verification.notes}</AppText>
              </View>
            ) : null}

            <TextInput
              accessibilityLabel="Verification review notes"
              editable={!verificationBusy}
              multiline
              onChangeText={setVerificationNotes}
              placeholder="Add review notes or a rejection reason"
              placeholderTextColor={theme.colors.textMuted}
              style={[
                styles.verificationInput,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  backgroundColor: theme.colors.surface,
                },
              ]}
              value={verificationNotes}
            />

            <View style={styles.verificationActions}>
              <Pressable
                accessibilityRole="button"
                disabled={verificationBusy}
                onPress={() => {
                  void reviewVerification('APPROVED');
                }}
                style={[
                  styles.verificationActionButton,
                  {
                    backgroundColor: theme.colors.primary,
                    borderRadius: theme.radius.lg,
                    opacity: verificationBusy ? 0.65 : 1,
                  },
                ]}
              >
                <AppText variant="bodyStrong" tone="inverse">
                  Approve
                </AppText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                disabled={verificationBusy}
                onPress={() => {
                  Alert.alert(
                    'Reject verification?',
                    'The owner will be able to see your reason and submit again.',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Reject',
                        style: 'destructive',
                        onPress: () => {
                          void reviewVerification('REJECTED');
                        },
                      },
                    ],
                  );
                }}
                style={[
                  styles.verificationActionButton,
                  {
                    borderColor: theme.colors.danger,
                    borderRadius: theme.radius.lg,
                    borderWidth: 1,
                    opacity: verificationBusy ? 0.65 : 1,
                  },
                ]}
              >
                <AppText
                  variant="bodyStrong"
                  style={{
                    color: theme.colors.danger,
                  }}
                >
                  Reject
                </AppText>
              </Pressable>
            </View>

            {verificationError ? (
              <AppText
                style={{
                  color: theme.colors.danger,
                }}
              >
                {verificationError}
              </AppText>
            ) : null}
          </Card>
        ) : null}

        {canManageBusiness ? (
          <Pressable
            accessibilityLabel="Manage business"
            accessibilityRole="button"
            onPress={() => {
              navigation.navigate('EditBusiness', {
                business,
              });
            }}
            style={[
              styles.manageButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.radius.lg,
              },
            ]}
          >
            <View style={styles.manageCopy}>
              <AppText variant="bodyStrong" tone="inverse">
                Manage business
              </AppText>

              <AppText variant="caption" tone="inverse">
                Edit profile details or delete this business
              </AppText>
            </View>

            <AppText variant="heading" tone="inverse">
              ›
            </AppText>
          </Pressable>
        ) : null}

        {detail.loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.primary} size="large" />

            <AppText tone="secondary">Loading business details…</AppText>
          </View>
        ) : null}

        {detail.error ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void detail.retry();
            }}
          >
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
                {detail.error}
              </AppText>

              <AppText variant="label" tone="brand">
                Tap to retry
              </AppText>
            </Card>
          </Pressable>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.tabs}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {SECTIONS.map((item) => {
            const selected = section === item.id;

            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityState={{
                  selected,
                }}
                onPress={() => {
                  setSection(item.id);
                }}
                style={[
                  styles.tab,
                  {
                    backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                <AppText variant="label" tone={selected ? 'inverse' : 'secondary'}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>

        {section === 'about' ? (
          <Card style={styles.section}>
            <AppText variant="subheading">About</AppText>

            <AppText tone="secondary">{business.description}</AppText>

            <View style={styles.row}>
              <AppText tone="secondary">Category</AppText>

              <AppText variant="bodyStrong">{business.category}</AppText>
            </View>

            <View style={styles.row}>
              <AppText tone="secondary">Verification</AppText>

              <AppText variant="bodyStrong">
                {detail.dashboard?.verification?.status ??
                  (business.verified ? 'APPROVED' : 'NOT SUBMITTED')}
              </AppText>
            </View>
          </Card>
        ) : null}

        {section === 'offers' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="subheading">Offers</AppText>

              <AppText variant="caption" tone="secondary">
                {detail.dashboard?.offers.length ?? 0}
              </AppText>
            </View>

            {detail.dashboard?.offers.length ? (
              <View style={styles.cards}>
                {detail.dashboard.offers.map((offer) => (
                  <MarketplaceOfferCard key={offer.id} offer={offer} />
                ))}
              </View>
            ) : (
              <Card variant="muted" style={styles.empty}>
                <AppText variant="subheading">No active offers</AppText>

                <AppText tone="secondary">New promotions will appear here.</AppText>
              </Card>
            )}
          </View>
        ) : null}

        {section === 'events' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="subheading">Business Events</AppText>

              <AppText variant="caption" tone="secondary">
                {detail.dashboard?.events.length ?? 0}
              </AppText>
            </View>

            {detail.dashboard?.events.length ? (
              <View style={styles.cards}>
                {detail.dashboard.events.map((event) => (
                  <MarketplaceEventCard key={event.id} event={event} />
                ))}
              </View>
            ) : (
              <Card variant="muted" style={styles.empty}>
                <AppText variant="subheading">No upcoming events</AppText>

                <AppText tone="secondary">Business events will appear here.</AppText>
              </Card>
            )}
          </View>
        ) : null}

        {section === 'insights' ? (
          detail.analytics ? (
            <Card style={styles.section}>
              <AppText variant="subheading">Reach and engagement</AppText>

              {[
                ['Profile views', detail.analytics.profileViews],
                ['Offer views', detail.analytics.offerViews],
                ['Event views', detail.analytics.eventViews],
                ['Total reach', detail.analytics.totalReach],
              ].map(([label, value]) => (
                <View key={String(label)} style={styles.row}>
                  <AppText tone="secondary">{label}</AppText>

                  <AppText variant="bodyStrong">{value}</AppText>
                </View>
              ))}
            </Card>
          ) : (
            <Card variant="muted" style={styles.section}>
              <AppText variant="subheading">Neighbour Business analytics</AppText>

              <AppText tone="secondary">
                Upgrade to Neighbour Business to unlock private profile views, offer views, event
                views and total reach analytics.
              </AppText>
            </Card>
          )
        ) : null}
      </ScrollView>
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
  hero: {
    gap: 12,
  },
  heroIcon: {
    alignItems: 'center',
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  heroSymbol: {
    fontSize: 31,
    lineHeight: 36,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  verificationCard: {
    gap: 12,
  },
  verificationMessage: {
    gap: 4,
  },
  verificationInput: {
    borderWidth: 1,
    minHeight: 96,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  verificationPrimaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  verificationActions: {
    flexDirection: 'row',
    gap: 10,
  },
  verificationActionButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  manageButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  manageCopy: {
    flex: 1,
    gap: 3,
  },
  loading: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 35,
  },
  errorCard: {
    gap: 8,
  },
  tabs: {
    gap: 8,
  },
  tab: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  section: {
    gap: 13,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cards: {
    gap: 11,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  empty: {
    gap: 8,
  },
});
