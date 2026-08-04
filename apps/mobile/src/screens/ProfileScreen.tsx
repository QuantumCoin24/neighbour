import { StyleSheet, View } from 'react-native';

import { AppText, Card, Screen } from '../components';

export default function ProfileScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="overline" tone="brand">
          Identity
        </AppText>

        <AppText variant="title">My profile</AppText>

        <AppText tone="secondary">
          Your trusted identity, neighbourhood and community activity.
        </AppText>
      </View>

      <Card style={styles.card}>
        <AppText variant="subheading">Profile foundation ready</AppText>

        <AppText tone="secondary">
          Profile data will be connected to the existing API service during product integration.
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
  card: {
    gap: 10,
    marginTop: 32,
  },
});
