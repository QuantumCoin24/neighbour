import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Card } from '../components';
import { usePremium } from '../features/premium';
import {
  APPLE_PRODUCT_LABELS,
  APPLE_SUBSCRIPTION_PRODUCT_IDS,
  type AppleSubscriptionProductId,
  useStoreKitSubscriptions,
} from '../features/storekit';
import { submitPrioritySupportRequest } from '@neighbour/api-client';
import { useState } from 'react';

import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type PremiumScreenProps = NativeStackScreenProps<RootStackParamList, 'Premium'>;

function formatCustomerStatus(value: string): string {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function displayStorePrice(
  productId: AppleSubscriptionProductId,
  products: Array<{
    id: string;
    displayPrice?: string | null;
    localizedPrice?: string | null;
  }>,
): string {
  const product = products.find((candidate) => candidate.id === productId);

  return (
    product?.displayPrice ??
    product?.localizedPrice ??
    APPLE_PRODUCT_LABELS[productId].fallbackPrice
  );
}

export default function PremiumScreen({ navigation }: PremiumScreenProps) {
  const { theme } = useNeighbourTheme();
  const premium = usePremium();
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportBusy, setSupportBusy] = useState(false);

  const storeKit = useStoreKitSubscriptions(async () => {
    await premium.refresh();
  });

  async function submitPrioritySupport(): Promise<void> {
    const subject = supportSubject.trim();
    const message = supportMessage.trim();

    if (!subject || !message || supportBusy) {
      return;
    }

    setSupportBusy(true);

    try {
      const request = await submitPrioritySupportRequest({
        subject,
        message,
      });

      setSupportSubject('');
      setSupportMessage('');

      Alert.alert(
        'Priority support sent',
        `Your priority support request ${request.id.slice(0, 8)} has been opened.`,
      );
    } catch {
      Alert.alert('Support request not sent', 'Please check the details and try again.');
    } finally {
      setSupportBusy(false);
    }
  }

  async function manageSubscription(): Promise<void> {
    const url = 'https://apps.apple.com/account/subscriptions';

    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert('Manage subscription', 'Open Apple ID settings and choose Subscriptions.');
      return;
    }

    await Linking.openURL(url);
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
          <AppText variant="bodyStrong">Neighbour Premium</AppText>

          <AppText variant="caption" tone="secondary">
            Membership & benefits
          </AppText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={premium.refreshing || storeKit.loadingProducts}
            onRefresh={() => {
              void Promise.all([premium.refresh(), storeKit.reloadProducts()]);
            }}
            tintColor={theme.colors.primary}
          />
        }
      >
        <Card
          style={[
            styles.hero,
            {
              backgroundColor: theme.colors.primaryStrong,
            },
          ]}
        >
          <AppText variant="overline" tone="inverse">
            Neighbour Premium™
          </AppText>

          <AppText variant="heading" tone="inverse">
            More from your neighbourhood
          </AppText>

          <AppText tone="inverse">
            Unlock more ways to discover, connect and grow while the essential Neighbour experience
            stays free for everyone.
          </AppText>
        </Card>

        {premium.loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.primary} size="large" />

            <AppText tone="secondary">Checking your membership…</AppText>
          </View>
        ) : null}

        {premium.overview ? (
          <Card variant="muted" style={styles.summary}>
            <View style={styles.row}>
              <AppText tone="secondary">Current plan</AppText>

              <AppText variant="bodyStrong">{premium.overview.plan.name}</AppText>
            </View>

            <View style={styles.row}>
              <AppText tone="secondary">Status</AppText>

              <AppText variant="bodyStrong">
                {formatCustomerStatus(premium.overview.subscription.status)}
              </AppText>
            </View>

            <View style={styles.row}>
              <AppText tone="secondary">Provider</AppText>

              <AppText variant="bodyStrong">{premium.overview.subscription.provider}</AppText>
            </View>
          </Card>
        ) : null}

        {!storeKit.connected ? (
          <Card variant="muted" style={styles.notice}>
            <AppText variant="bodyStrong">Getting subscriptions ready</AppText>

            <AppText variant="caption" tone="secondary">
              Your subscription options will appear as soon as the App Store is ready.
            </AppText>
          </Card>
        ) : null}

        {storeKit.error || premium.error ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              storeKit.clearMessages();
              void premium.retry();
            }}
          >
            <Card
              variant="muted"
              style={[
                styles.notice,
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
                {storeKit.error ?? premium.error}
              </AppText>

              <AppText variant="label" tone="brand">
                Tap to retry
              </AppText>
            </Card>
          </Pressable>
        ) : null}

        {storeKit.successMessage ? (
          <Card variant="muted" style={styles.success}>
            <AppText variant="bodyStrong">Membership updated</AppText>

            <AppText variant="caption" tone="secondary">
              {storeKit.successMessage}
            </AppText>
          </Card>
        ) : null}

        <View style={styles.plans}>
          {APPLE_SUBSCRIPTION_PRODUCT_IDS.map((productId) => {
            const details = APPLE_PRODUCT_LABELS[productId];
            const isPurchasing = storeKit.purchasingProductId === productId;
            const isCurrent = premium.overview?.subscription.plan === details.plan;

            return (
              <Card key={productId} style={styles.planCard}>
                <View style={styles.planHeader}>
                  <View style={styles.planCopy}>
                    <AppText variant="bodyStrong">{details.title}</AppText>

                    <AppText variant="heading" tone="brand">
                      {displayStorePrice(productId, storeKit.products)}
                    </AppText>
                  </View>

                  {isCurrent ? (
                    <View
                      style={[
                        styles.currentBadge,
                        {
                          backgroundColor: theme.colors.primary,
                          borderRadius: theme.radius.pill,
                        },
                      ]}
                    >
                      <AppText variant="caption" tone="inverse">
                        Current
                      </AppText>
                    </View>
                  ) : null}
                </View>

                <AppText tone="secondary">
                  {details.plan === 'BUSINESS'
                    ? 'Grow your local presence with business insights, marketplace boosts, scheduled offers and priority support.'
                    : 'Discover more nearby with enhanced search, profile tools, additional storage and community boosts.'}
                </AppText>

                <Pressable
                  accessibilityRole="button"
                  disabled={!storeKit.connected || isPurchasing || storeKit.restoring || isCurrent}
                  onPress={() => {
                    void storeKit.purchase(productId);
                  }}
                  style={[
                    styles.primaryButton,
                    {
                      backgroundColor: theme.colors.primary,
                      borderRadius: theme.radius.lg,
                      opacity:
                        !storeKit.connected || isPurchasing || storeKit.restoring || isCurrent
                          ? 0.55
                          : 1,
                    },
                  ]}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color={theme.colors.inverseText} size="small" />
                  ) : (
                    <AppText variant="label" tone="inverse">
                      {isCurrent ? 'Your plan' : 'Choose this plan'}
                    </AppText>
                  )}
                </Pressable>
              </Card>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={storeKit.restoring}
          onPress={() => {
            void storeKit.restore();
          }}
          style={[
            styles.secondaryButton,
            {
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          {storeKit.restoring ? (
            <ActivityIndicator color={theme.colors.primary} size="small" />
          ) : (
            <AppText variant="label" tone="brand">
              Restore purchases
            </AppText>
          )}
        </Pressable>

        {Platform.OS === 'ios' ? (
          <Pressable
            accessibilityRole="link"
            onPress={() => {
              void manageSubscription();
            }}
            style={styles.manageButton}
          >
            <AppText variant="label" tone="brand">
              Manage subscription
            </AppText>
          </Pressable>
        ) : null}

        {premium.overview ? (
          <Card style={styles.notice}>
            <AppText variant="subheading">Your active Premium benefits</AppText>

            {[
              ['Premium profile', premium.overview.entitlements.premiumProfile],
              [
                'Advanced search — up to 50 results per category',
                premium.overview.entitlements.advancedSearch,
              ],
              ['Enhanced storage — up to 1 GB', premium.overview.entitlements.enhancedStorage],
              ['Community discovery boosts', premium.overview.entitlements.communityBoosts],
              ['Marketplace boosts', premium.overview.entitlements.marketplaceBoosts],
              ['Business analytics', premium.overview.entitlements.businessAnalytics],
              ['Scheduled business offers', premium.overview.entitlements.scheduledOffers],
              ['Priority support', premium.overview.entitlements.prioritySupport],
            ]
              .filter(([, enabled]) => enabled)
              .map(([label]) => (
                <AppText key={String(label)} tone="secondary">
                  ✓ {String(label)}
                </AppText>
              ))}

            {premium.overview.subscription.plan === 'FREE' ? (
              <AppText tone="secondary">
                Upgrade to Plus or Business to activate additional Premium benefits.
              </AppText>
            ) : null}
          </Card>
        ) : null}

        {premium.overview?.entitlements.prioritySupport ? (
          <Card style={styles.notice}>
            <AppText variant="subheading">Priority support</AppText>

            <AppText variant="caption" tone="secondary">
              Plus and Business requests enter the Premium support queue.
            </AppText>

            <TextInput
              placeholder="What do you need help with?"
              placeholderTextColor={theme.colors.textMuted}
              value={supportSubject}
              onChangeText={setSupportSubject}
              style={[
                styles.supportInput,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  borderRadius: theme.radius.lg,
                },
              ]}
            />

            <TextInput
              multiline
              placeholder="Tell us what happened"
              placeholderTextColor={theme.colors.textMuted}
              value={supportMessage}
              onChangeText={setSupportMessage}
              style={[
                styles.supportMessage,
                {
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  borderRadius: theme.radius.lg,
                },
              ]}
            />

            <Pressable
              accessibilityRole="button"
              disabled={supportBusy || !supportSubject.trim() || !supportMessage.trim()}
              onPress={() => {
                void submitPrioritySupport();
              }}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.radius.lg,
                  opacity:
                    supportBusy || !supportSubject.trim() || !supportMessage.trim() ? 0.55 : 1,
                },
              ]}
            >
              {supportBusy ? (
                <ActivityIndicator color={theme.colors.inverseText} size="small" />
              ) : (
                <AppText variant="label" tone="inverse">
                  Send priority request
                </AppText>
              )}
            </Pressable>
          </Card>
        ) : null}

        <Card variant="muted" style={styles.notice}>
          <AppText variant="bodyStrong">Secure billing</AppText>

          <AppText variant="caption" tone="secondary">
            Subscriptions are securely processed by Apple. You can restore purchases or manage your
            subscription at any time.
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
    gap: 2,
  },
  content: {
    gap: 18,
    paddingBottom: 52,
    paddingHorizontal: 18,
  },
  hero: {
    gap: 10,
  },
  loading: {
    alignItems: 'center',
    gap: 13,
    paddingVertical: 40,
  },
  summary: {
    gap: 12,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  plans: {
    gap: 14,
  },
  planCard: {
    gap: 16,
  },
  planHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  planCopy: {
    flex: 1,
    gap: 5,
  },
  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  primaryButton: {
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secondaryButton: {
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  manageButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  notice: {
    gap: 7,
  },
  success: {
    gap: 7,
  },
  supportInput: {
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  supportMessage: {
    borderWidth: 1,
    minHeight: 110,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
});
