import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText, Card } from '../components';
import { PremiumPlanCard, usePremium } from '../features/premium';
import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type PremiumScreenProps = NativeStackScreenProps<RootStackParamList, 'Premium'>;

export default function PremiumScreen({ navigation }: PremiumScreenProps) {
  const { theme } = useNeighbourTheme();
  const premium = usePremium();

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
            Plans and entitlements
          </AppText>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={premium.refreshing}
            onRefresh={() => {
              void premium.refresh();
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
            More power for your local world
          </AppText>

          <AppText tone="inverse">
            Upgrade your personal or business experience while keeping the complete core platform
            free.
          </AppText>
        </Card>

        {premium.loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.primary} size="large" />

            <AppText tone="secondary">Loading premium plans…</AppText>
          </View>
        ) : null}

        {premium.error ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void premium.retry();
            }}
          >
            <Card
              variant="muted"
              style={[
                styles.error,
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
                {premium.error}
              </AppText>

              <AppText variant="label" tone="brand">
                Tap to retry
              </AppText>
            </Card>
          </Pressable>
        ) : null}

        {premium.overview ? (
          <Card variant="muted" style={styles.summary}>
            <View style={styles.row}>
              <AppText tone="secondary">Current plan</AppText>

              <AppText variant="bodyStrong">{premium.overview.plan.name}</AppText>
            </View>

            <View style={styles.row}>
              <AppText tone="secondary">Status</AppText>

              <AppText variant="bodyStrong">{premium.overview.subscription.status}</AppText>
            </View>

            <View style={styles.row}>
              <AppText tone="secondary">Provider</AppText>

              <AppText variant="bodyStrong">{premium.overview.subscription.provider}</AppText>
            </View>
          </Card>
        ) : null}

        <View style={styles.plans}>
          {premium.plans.map((plan) => (
            <PremiumPlanCard
              key={plan.id}
              activating={premium.activating === plan.id}
              currentPlan={premium.overview?.subscription.plan ?? 'FREE'}
              onActivate={() => {
                void premium.activate(plan.id);
              }}
              plan={plan}
            />
          ))}
        </View>

        <Card variant="muted" style={styles.notice}>
          <AppText variant="bodyStrong">Development subscription mode</AppText>

          <AppText variant="caption" tone="secondary">
            These internal plan controls validate the subscription and entitlement architecture.
            Store purchases will replace internal activation after the App Store products and server
            verification credentials are configured.
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
  error: {
    gap: 8,
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
  notice: {
    gap: 7,
  },
});
