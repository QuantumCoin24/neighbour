import { StyleSheet, View } from 'react-native';

import { useAuth } from '../auth/auth-context';
import { AppText, Button, Card, Screen } from '../components';
import { useNeighbourTheme } from '../theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme } = useNeighbourTheme();

  const initials =
    user?.displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.slice(0, 1).toUpperCase())
      .join('') ?? 'N';

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="overline" tone="brand">
          Your identity
        </AppText>

        <AppText variant="title">Profile</AppText>

        <AppText variant="bodyLarge" tone="secondary">
          Manage your trusted Neighbour identity and local presence.
        </AppText>
      </View>

      <Card style={styles.profileCard}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: theme.colors.primarySoft,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText variant="heading" tone="brand">
            {initials}
          </AppText>
        </View>

        <View style={styles.identity}>
          <AppText variant="subheading">{user?.displayName ?? 'Neighbour member'}</AppText>

          <AppText tone="secondary">{user?.email ?? 'No email available'}</AppText>

          <View
            style={[
              styles.status,
              {
                backgroundColor: `${theme.colors.success}18`,
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText
              variant="caption"
              style={{
                color: theme.colors.success,
              }}
            >
              Account connected
            </AppText>
          </View>
        </View>
      </Card>

      <Card variant="muted" style={styles.localCard}>
        <View style={styles.localCopy}>
          <AppText variant="bodyStrong">Complete your local profile</AppText>

          <AppText variant="caption" tone="secondary">
            Add your username, neighbourhood and profile details to unlock your full community
            experience.
          </AppText>
        </View>
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
    gap: 10,
  },
  profileCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 18,
    marginTop: 32,
  },
  avatar: {
    alignItems: 'center',
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  identity: {
    flex: 1,
    gap: 5,
  },
  status: {
    alignSelf: 'flex-start',
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  localCard: {
    marginTop: 18,
  },
  localCopy: {
    gap: 6,
  },
  logoutButton: {
    marginTop: 24,
  },
});
