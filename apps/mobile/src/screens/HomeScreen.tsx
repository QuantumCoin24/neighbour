import { StyleSheet, View } from 'react-native';

import { useAuth } from '../auth/auth-context';
import { AppText, Button, Card, Screen } from '../components';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  const firstName = user?.displayName.trim().split(/\s+/)[0] ?? 'Neighbour';

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="overline" tone="brand">
          Neighbour™
        </AppText>

        <AppText variant="title">Welcome home, {firstName}.</AppText>

        <AppText variant="bodyLarge" tone="secondary">
          Your secure Neighbour account is connected. Your local dashboard is the next product
          layer.
        </AppText>
      </View>

      <Card variant="muted" style={styles.card}>
        <AppText variant="subheading">Account connected</AppText>

        <AppText tone="secondary">Signed in as {user?.email ?? 'your Neighbour account'}.</AppText>
      </Card>

      <Button
        label="Sign out"
        onPress={() => {
          void logout();
        }}
        style={styles.logoutButton}
        variant="secondary"
      />
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
  logoutButton: {
    marginTop: 24,
  },
});
