import { StyleSheet, View } from 'react-native';

import { AppText, Card, Screen } from '../components';
import { useNeighbourTheme } from '../theme';

export default function CommunitiesScreen() {
  const { theme } = useNeighbourTheme();

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="overline" tone="brand">
          Local connections
        </AppText>

        <AppText variant="title">Communities</AppText>

        <AppText variant="bodyLarge" tone="secondary">
          Discover trusted groups built around the places and interests that matter to you.
        </AppText>
      </View>

      <Card variant="muted" style={styles.card}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: theme.colors.primarySoft,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText
            style={{
              color: theme.colors.primary,
              fontSize: 24,
            }}
          >
            ◎
          </AppText>
        </View>

        <View style={styles.copy}>
          <AppText variant="subheading">Find your community</AppText>

          <AppText tone="secondary">
            Local community discovery will connect here to the existing Neighbour community service.
          </AppText>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 10,
  },
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    marginTop: 32,
  },
  icon: {
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
});
