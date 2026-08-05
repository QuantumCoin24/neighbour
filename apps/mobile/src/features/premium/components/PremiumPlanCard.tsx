import type { PremiumPlan, PremiumPlanId } from '@neighbour/api-client';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

interface PremiumPlanCardProps {
  plan: PremiumPlan;
  currentPlan: PremiumPlanId;
  activating: boolean;
  onActivate: () => void;
}

function formatPrice(pence: number): string {
  if (pence === 0) {
    return 'Free';
  }

  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(pence / 100);
}

export function PremiumPlanCard({
  plan,
  currentPlan,
  activating,
  onActivate,
}: PremiumPlanCardProps) {
  const { theme } = useNeighbourTheme();
  const current = currentPlan === plan.id;

  return (
    <Card
      style={[
        styles.card,
        plan.recommended
          ? {
              borderColor: theme.colors.primary,
            }
          : undefined,
      ]}
    >
      <View style={styles.heading}>
        <View style={styles.copy}>
          <AppText variant="subheading">{plan.name}</AppText>

          <AppText tone="secondary">{plan.description}</AppText>
        </View>

        {plan.recommended ? (
          <View
            style={[
              styles.recommended,
              {
                backgroundColor: theme.colors.primarySoft,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="caption" tone="brand">
              Recommended
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.price}>
        <AppText variant="heading">{formatPrice(plan.monthlyPricePence)}</AppText>

        {plan.monthlyPricePence > 0 ? <AppText tone="secondary">per month</AppText> : null}
      </View>

      <View style={styles.features}>
        {plan.features.map((feature) => (
          <View key={feature} style={styles.feature}>
            <AppText tone="brand">✓</AppText>

            <AppText tone="secondary" style={styles.featureText}>
              {feature}
            </AppText>
          </View>
        ))}
      </View>

      {current ? (
        <View
          style={[
            styles.current,
            {
              backgroundColor: theme.colors.primarySoft,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="label" tone="brand">
            Current plan
          </AppText>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          disabled={activating}
          onPress={onActivate}
          style={[
            styles.action,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.pill,
              opacity: activating ? 0.65 : 1,
            },
          ]}
        >
          {activating ? (
            <ActivityIndicator color={theme.colors.inverseText} size="small" />
          ) : (
            <AppText variant="label" tone="inverse">
              Select {plan.name}
            </AppText>
          )}
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 18,
  },
  heading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  recommended: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  price: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 7,
  },
  features: {
    gap: 9,
  },
  feature: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 9,
  },
  featureText: {
    flex: 1,
  },
  current: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  action: {
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
