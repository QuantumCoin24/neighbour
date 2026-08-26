import {
  acceptConnection,
  getPublicProfile,
  getRelationshipStatus,
  sendConnectionRequest,
  type PublicProfile,
  type RelationshipStatusResponse,
} from '@neighbour/api-client';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, View } from 'react-native';

import { getSessionAccessToken } from '../auth/session';
import { useAuth } from '../auth/auth-context';
import { AppText, Card, Screen } from '../components';
import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PublicProfile'>;

export default function PublicProfileScreen({ route }: Props) {
  const { theme } = useNeighbourTheme();
  const { user } = useAuth();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [relationship, setRelationship] = useState<RelationshipStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getPublicProfile(route.params.username);

      setProfile(result);

      const token = getSessionAccessToken();

      if (token && result.userId !== user?.id) {
        setRelationship(await getRelationshipStatus(token, result.userId));
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'This neighbour profile could not be loaded.',
      );
    } finally {
      setLoading(false);
    }
  }, [route.params.username, user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const connect = async () => {
    if (!profile || profile.userId === user?.id || connecting) {
      return;
    }

    const token = getSessionAccessToken();

    if (!token) {
      Alert.alert('Session expired', 'Please sign in again.');
      return;
    }

    setConnecting(true);

    try {
      if (relationship?.status === 'INCOMING_REQUEST' && relationship.connectionId) {
        await acceptConnection(token, relationship.connectionId);
      } else {
        await sendConnectionRequest(token, profile.userId);
      }

      setRelationship(await getRelationshipStatus(token, profile.userId));
    } catch (caughtError) {
      Alert.alert(
        'Connection not sent',
        caughtError instanceof Error
          ? caughtError.message
          : 'Neighbour could not send the connection request.',
      );
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <Screen contentStyle={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
        <AppText tone="secondary">Opening neighbour profile…</AppText>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen contentStyle={styles.screen}>
        <Card variant="muted" style={styles.card}>
          <AppText variant="subheading">Profile unavailable</AppText>
          <AppText tone="secondary">
            {error ?? 'This neighbour profile could not be found.'}
          </AppText>
        </Card>
      </Screen>
    );
  }

  const relationshipLabel =
    relationship?.status === 'CONNECTED'
      ? 'Connected'
      : relationship?.status === 'OUTGOING_REQUEST'
        ? 'Request sent'
        : relationship?.status === 'INCOMING_REQUEST'
          ? connecting
            ? 'Accepting…'
            : 'Accept request'
          : relationship?.status === 'BLOCKED_BY_ME'
            ? 'Blocked'
            : relationship?.status === 'BLOCKED_ME'
              ? 'Unavailable'
              : connecting
                ? 'Sending…'
                : 'Add Neighbour';

  const connectionDisabled =
    profile.userId === user?.id ||
    connecting ||
    relationship?.status === 'CONNECTED' ||
    relationship?.status === 'OUTGOING_REQUEST' ||
    relationship?.status === 'BLOCKED_BY_ME' ||
    relationship?.status === 'BLOCKED_ME';

  return (
    <Screen contentStyle={styles.screen}>
      <View
        style={[
          styles.hero,
          {
            backgroundColor: theme.colors.primaryStrong,
            borderRadius: theme.radius.xl,
          },
          theme.shadows.card,
        ]}
      >
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: 'rgba(255,255,255,0.16)',
              borderRadius: theme.radius.xl,
            },
          ]}
        >
          {profile.avatarUrl ? (
            <Image
              accessibilityLabel={`${profile.displayName} profile photo`}
              source={{ uri: profile.avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <AppText variant="title" tone="inverse">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </AppText>
          )}
        </View>

        <View style={styles.heroCopy}>
          <AppText variant="overline" tone="inverse">
            NEIGHBOUR PROFILE
          </AppText>

          <AppText variant="title" tone="inverse">
            {profile.displayName}
          </AppText>

          <AppText tone="inverse">@{profile.username}</AppText>
        </View>
      </View>

      {profile.userId !== user?.id ? (
        <Pressable
          accessibilityRole="button"
          disabled={connectionDisabled}
          onPress={() => {
            void connect();
          }}
          style={[
            styles.connectButton,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.pill,
              opacity: connectionDisabled ? 0.55 : 1,
            },
          ]}
        >
          <AppText variant="label" tone="inverse">
            {relationshipLabel}
          </AppText>
        </Pressable>
      ) : null}

      <Card style={styles.card}>
        <AppText variant="overline" tone="brand">
          ABOUT
        </AppText>

        <AppText variant="subheading">{profile.displayName}</AppText>

        <AppText tone="secondary">
          {profile.bio?.trim() || 'This neighbour has not added a bio yet.'}
        </AppText>

        <View style={styles.detail}>
          <AppText variant="caption" tone="secondary">
            Local area
          </AppText>

          <AppText variant="bodyStrong">{profile.localArea ?? 'Location hidden'}</AppText>
        </View>

        <View style={styles.detail}>
          <AppText variant="caption" tone="secondary">
            Neighbour since
          </AppText>

          <AppText variant="bodyStrong">
            {new Date(profile.createdAt).toLocaleDateString('en-GB')}
          </AppText>
        </View>
      </Card>

      <Card variant="muted" style={styles.card}>
        <AppText variant="subheading">Connection</AppText>

        <AppText tone="secondary">
          {profile.userId === user?.id
            ? 'This is your public Neighbour profile.'
            : `Relationship status: ${relationship?.status ?? 'NONE'}`}
        </AppText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 18,
    paddingBottom: 42,
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 18,
    padding: 22,
  },
  avatar: {
    alignItems: 'center',
    height: 82,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 82,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  heroCopy: {
    flex: 1,
    gap: 5,
  },
  connectButton: {
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    gap: 12,
  },
  detail: {
    gap: 3,
    paddingTop: 8,
  },
});
