import { StyleSheet, View } from 'react-native';

import { AppText, Card } from '../../../components';

interface ProfileStatsProps {
  communities: number;
  businesses: number;
  completion: number;
  reputation: number;
}

export function ProfileStats({
  communities,
  businesses,
  completion,
  reputation,
}: ProfileStatsProps) {
  const items = [
    ['Communities', communities],
    ['Businesses', businesses],
    ['Profile', `${completion}%`],
    ['Reputation', reputation],
  ];

  return (
    <View style={styles.grid}>
      {items.map(([label, value]) => (
        <Card key={String(label)} variant="muted" style={styles.card}>
          <AppText variant="subheading">{value}</AppText>

          <AppText variant="caption" tone="secondary">
            {label}
          </AppText>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    flexBasis: '46%',
    flexGrow: 1,
    gap: 4,
  },
});
