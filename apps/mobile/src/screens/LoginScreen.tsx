import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Screen, TextField } from '../components';
import { useNeighbourTheme } from '../theme';

export default function LoginScreen() {
  const { theme } = useNeighbourTheme();

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.hero}>
        <View
          style={[
            styles.mark,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.xl,
            },
            theme.shadows.floating,
          ]}
        >
          <AppText variant="heading" tone="inverse" style={styles.markText}>
            N
          </AppText>
        </View>

        <View style={styles.introduction}>
          <AppText variant="overline" tone="brand">
            Your local community
          </AppText>

          <AppText variant="display">Welcome home.</AppText>

          <AppText variant="bodyLarge" tone="secondary">
            Discover what is happening nearby, connect with trusted neighbours and take part in the
            place you call home.
          </AppText>
        </View>
      </View>

      <Card variant="glass" style={styles.formCard}>
        <View style={styles.formHeader}>
          <AppText variant="heading">Sign in</AppText>

          <AppText tone="secondary">Continue to your Neighbour™ community.</AppText>
        </View>

        <View style={styles.fields}>
          <TextField
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="Email address"
            placeholder="you@example.com"
            textContentType="emailAddress"
          />

          <TextField
            autoCapitalize="none"
            autoComplete="current-password"
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            textContentType="password"
          />
        </View>

        <Button label="Continue" disabled />

        <AppText variant="caption" tone="muted" style={styles.foundationNotice}>
          Secure account access will connect to the existing Neighbour authentication service in the
          API integration phase.
        </AppText>
      </Card>

      <View style={styles.footer}>
        <AppText variant="caption" tone="muted">
          Stronger communities. Better connections.
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'space-between',
  },
  hero: {
    gap: 28,
    paddingTop: 22,
  },
  mark: {
    alignItems: 'center',
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  markText: {
    fontSize: 30,
    lineHeight: 34,
  },
  introduction: {
    gap: 12,
  },
  formCard: {
    gap: 24,
    marginTop: 38,
  },
  formHeader: {
    gap: 6,
  },
  fields: {
    gap: 18,
  },
  foundationNotice: {
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 32,
  },
});
