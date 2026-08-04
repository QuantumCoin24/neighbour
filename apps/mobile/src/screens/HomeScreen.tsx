import { StyleSheet, View } from 'react-native';

import { AppText, Card, Screen } from '../components';

export default function HomeScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="overline" tone="brand">
          Neighbour™
        </AppText>

        <AppText variant="title">Your community starts here.</AppText>

        <AppText variant="bodyLarge" tone="secondary">
          Local updates, trusted people and useful places will come together here.
        </AppText>
      </View>

      <Card variant="muted" style={styles.card}>
        <AppText variant="subheading">Home foundation ready</AppText>

        <AppText tone="secondary">
          The real neighbourhood dashboard will be composed from the new shared design system.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 12,
  },
  card: {
    gap: 10,
    marginTop: 32,
  },
});
