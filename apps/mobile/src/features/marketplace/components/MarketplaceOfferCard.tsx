import type { MarketplaceOffer } from '@neighbour/api-client';
import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';
import { useNeighbourTheme } from '../../../theme';

function formatExpiry(value: string | null): string {
  if (!value) {
    return 'No expiry date';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Expiry unavailable';
  }

  return `Ends ${new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
  }).format(date)}`;
}

export function MarketplaceOfferCard({ offer }: { offer: MarketplaceOffer }) {
  const { theme } = useNeighbourTheme();

  return (
    <Card variant="muted" style={styles.card}>
      <View
        style={[
          styles.icon,
          {
            backgroundColor: theme.colors.primarySoft,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <AppText tone="brand" style={styles.symbol}>
          %
        </AppText>
      </View>

      <View style={styles.copy}>
        <View style={styles.heading}>
          <AppText variant="bodyStrong" style={styles.title}>
            {offer.title}
          </AppText>

          <AppText variant="caption" tone={offer.active ? 'brand' : 'muted'}>
            {offer.active ? 'Active' : 'Inactive'}
          </AppText>
        </View>

        <AppText variant="caption" tone="secondary">
          {offer.description}
        </AppText>

        <AppText variant="caption" tone="muted">
          {formatExpiry(offer.endsAt)}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  icon: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  symbol: {
    fontSize: 20,
    fontWeight: '700',
  },
  copy: {
    flex: 1,
    gap: 5,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    flex: 1,
  },
});
