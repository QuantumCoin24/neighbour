import type { MarketplacePeerOffer } from '@neighbour/api-client';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';

interface MarketplaceOfferCardProps {
  offer: MarketplacePeerOffer;
  perspective: 'BUYER' | 'SELLER';
  onPress: () => void;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(value / 100);
}

export function MarketplaceOfferCard({ offer, perspective, onPress }: MarketplaceOfferCardProps) {
  const otherParty = perspective === 'BUYER' ? offer.seller : offer.buyer;

  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.heading}>
            <AppText variant="subheading">{offer.listing.title}</AppText>

            <AppText tone="secondary">
              {perspective === 'BUYER'
                ? `Seller: ${otherParty.displayName}`
                : `Buyer: ${otherParty.displayName}`}
            </AppText>
          </View>

          <AppText variant="label" tone="brand">
            {formatPrice(offer.amountPence)}
          </AppText>
        </View>

        <View style={styles.footer}>
          <AppText variant="caption" tone="secondary">
            {offer.status
              .replaceAll('_', ' ')
              .toLowerCase()
              .replace(/^./, (value) => value.toUpperCase())}
          </AppText>

          <AppText variant="caption" tone="secondary">
            {new Date(offer.createdAt).toLocaleDateString('en-GB')}
          </AppText>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  heading: {
    flex: 1,
    gap: 4,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
