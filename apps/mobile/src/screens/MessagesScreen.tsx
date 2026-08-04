import { StyleSheet, View } from 'react-native';

import { AppText, Card, Screen } from '../components';
import { useNeighbourTheme } from '../theme';

export default function MessagesScreen() {
  const { theme } = useNeighbourTheme();

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="overline" tone="brand">
          Private conversations
        </AppText>

        <AppText variant="title">Messages</AppText>

        <AppText variant="bodyLarge" tone="secondary">
          Stay connected with neighbours, communities and trusted local organisations.
        </AppText>
      </View>

      <Card variant="muted" style={styles.card}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: `${theme.colors.information}18`,
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText
            style={{
              color: theme.colors.information,
              fontSize: 24,
            }}
          >
            ◌
          </AppText>
        </View>

        <View style={styles.copy}>
          <AppText variant="subheading">No conversations yet</AppText>

          <AppText tone="secondary">Your secure Neighbour conversations will appear here.</AppText>
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
