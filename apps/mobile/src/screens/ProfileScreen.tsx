import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';

import { useAuth } from '../auth/auth-context';
import { AppText, Button, Card, Screen } from '../components';
import { useMediaPicker, useMediaUpload } from '../features/media';
import { ProfileStats, useProfileHub, type ProfileSection } from '../features/profile';
import type { RootStackParamList } from '../navigation/routes';
import { useNeighbourTheme } from '../theme';

const SECTIONS: {
  id: ProfileSection;
  label: string;
}[] = [
  {
    id: 'overview',
    label: 'Overview',
  },
  {
    id: 'communities',
    label: 'Communities',
  },
  {
    id: 'business',
    label: 'Business',
  },
  {
    id: 'trust',
    label: 'Trust',
  },
  {
    id: 'settings',
    label: 'Settings',
  },
];

function formatCustomerStatus(value: string): string {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useNeighbourTheme();
  const profile = useProfileHub();
  const mediaPicker = useMediaPicker();
  const mediaUpload = useMediaUpload();

  useEffect(() => {
    if (__DEV__ && profile.error) {
      console.warn('[Neighbour/Profile] load error:', profile.error);
    }
  }, [profile.error]);

  const [section, setSection] = useState<ProfileSection>('overview');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [localArea, setLocalArea] = useState('');
  const [showLocalArea, setShowLocalArea] = useState(false);

  useEffect(() => {
    setUsername(profile.profile?.username ?? '');
    setBio(profile.profile?.bio ?? '');
    setAvatarUrl(profile.profile?.avatarUrl ?? '');
    setLocalArea(profile.profile?.localArea ?? '');
    setShowLocalArea(profile.profile?.showLocalArea ?? false);
  }, [profile.profile]);

  const trustScore = profile.trustIntelligence?.score ?? 0;

  if (profile.loading) {
    return (
      <Screen contentStyle={styles.loading}>
        <ActivityIndicator color={theme.colors.primary} size="large" />

        <AppText tone="secondary">Opening your profile…</AppText>
      </Screen>
    );
  }

  return (
    <Screen
      contentStyle={styles.screen}
      refreshControl={
        <RefreshControl
          refreshing={profile.refreshing}
          onRefresh={() => {
            void profile.refresh();
          }}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View
        style={[
          styles.identityHeader,
          {
            backgroundColor: theme.colors.primaryStrong,
            borderRadius: theme.radius.xl,
          },
          theme.shadows.card,
        ]}
      >
        <View
          style={[
            styles.identityMark,
            {
              backgroundColor: 'rgba(255,255,255,0.14)',
              borderRadius: theme.radius.pill,
            },
          ]}
        >
          <AppText tone="inverse" style={styles.identityMarkText}>
            {user?.displayName?.slice(0, 1).toUpperCase() ?? 'N'}
          </AppText>
        </View>

        <View style={styles.identityCopy}>
          <AppText
            variant="overline"
            style={{
              color: theme.colors.inverseText,
              opacity: 0.7,
            }}
          >
            YOUR NEIGHBOUR PROFILE
          </AppText>

          <AppText variant="title" tone="inverse">
            Profile
          </AppText>

          <AppText
            variant="caption"
            style={{
              color: theme.colors.inverseText,
              opacity: 0.82,
            }}
          >
            Your identity, local connections and community standing.
          </AppText>
        </View>

        <View
          style={[
            styles.trustBadge,
            {
              backgroundColor: theme.colors.inverseText,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          <AppText variant="overline" tone="brand">
            TRUST
          </AppText>

          <AppText variant="heading" tone="brand">
            {trustScore}
          </AppText>
        </View>
      </View>

      <ProfileStats
        businesses={profile.business ? 1 : 0}
        communities={profile.memberships.length}
        completion={profile.completionScore}
        reputation={profile.trustProfile?.reputation?.score ?? 0}
      />

      {profile.error ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void profile.retry();
          }}
          style={({ pressed }) => ({
            opacity: pressed ? 0.74 : 1,
          })}
        >
          <Card variant="muted" style={styles.error}>
            <View style={styles.errorRow}>
              <View
                style={[
                  styles.errorDot,
                  {
                    backgroundColor: theme.colors.warning,
                  },
                ]}
              />

              <View style={styles.errorCopy}>
                <AppText variant="bodyStrong">Profile is reconnecting</AppText>

                <AppText variant="caption" tone="secondary">
                  Live profile information is temporarily unavailable.
                </AppText>
              </View>

              <AppText variant="label" tone="brand">
                Retry
              </AppText>
            </View>
          </Card>
        </Pressable>
      ) : null}

      <View style={styles.tabs}>
        {SECTIONS.map((item) => {
          const selected = section === item.id;

          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{
                selected,
              }}
              onPress={() => {
                setSection(item.id);
              }}
              style={[
                styles.tab,
                {
                  backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                  borderRadius: theme.radius.pill,
                },
              ]}
            >
              <AppText variant="label" tone={selected ? 'inverse' : 'secondary'}>
                {item.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {section === 'overview' ? (
        <View style={styles.section}>
          <Card style={styles.card}>
            <AppText variant="subheading">About</AppText>

            <AppText tone="secondary">
              {profile.profile?.bio ??
                'Add a short introduction to help your neighbours get to know you.'}
            </AppText>
          </Card>

          <Card variant="muted" style={styles.card}>
            <AppText variant="subheading">Profile status</AppText>

            <View style={styles.row}>
              <AppText tone="secondary">Account</AppText>

              <AppText variant="bodyStrong">Connected</AppText>
            </View>

            <View style={styles.row}>
              <AppText tone="secondary">Profile completion</AppText>

              <AppText variant="bodyStrong">{profile.completionScore}%</AppText>
            </View>

            <View style={styles.row}>
              <AppText tone="secondary">Member since</AppText>

              <AppText variant="bodyStrong">
                {profile.profile?.createdAt
                  ? new Date(profile.profile.createdAt).getFullYear()
                  : '—'}
              </AppText>
            </View>
          </Card>
        </View>
      ) : null}

      {section === 'communities' ? (
        <View style={styles.section}>
          {profile.memberships.length ? (
            profile.memberships.map((membership) => (
              <Card key={membership.id} variant="muted" style={styles.card}>
                <View style={styles.row}>
                  <View style={styles.copy}>
                    <AppText variant="bodyStrong">{membership.community.name}</AppText>

                    <AppText variant="caption" tone="secondary">
                      {membership.community.memberCount} members
                    </AppText>
                  </View>

                  <AppText variant="caption" tone="brand">
                    {membership.role}
                  </AppText>
                </View>
              </Card>
            ))
          ) : (
            <Card variant="muted" style={styles.card}>
              <AppText variant="subheading">Your communities</AppText>

              <AppText tone="secondary">
                Communities you join will appear here, keeping your local connections in one place.
              </AppText>
            </Card>
          )}
        </View>
      ) : null}

      {section === 'business' ? (
        <View style={styles.section}>
          {profile.business ? (
            <Card style={styles.card}>
              <View style={styles.row}>
                <View style={styles.copy}>
                  <AppText variant="subheading">{profile.business.name}</AppText>

                  <AppText variant="caption" tone="brand">
                    {profile.business.category}
                  </AppText>
                </View>

                <AppText variant="caption" tone={profile.business.verified ? 'brand' : 'secondary'}>
                  {profile.business.verified ? 'Verified ✓' : 'Not verified'}
                </AppText>
              </View>

              <AppText tone="secondary">{profile.business.description}</AppText>
            </Card>
          ) : (
            <Card variant="muted" style={styles.card}>
              <AppText variant="subheading">Your business</AppText>

              <AppText tone="secondary">
                If you create or manage a local business profile, it will appear here.
              </AppText>
            </Card>
          )}
        </View>
      ) : null}

      {section === 'trust' ? (
        <View style={styles.section}>
          <Card style={styles.card}>
            <AppText variant="subheading">Neighbour standing</AppText>

            <View style={styles.row}>
              <AppText tone="secondary">Trust level</AppText>

              <AppText variant="bodyStrong">{profile.trustIntelligence?.level ?? 'LOW'}</AppText>
            </View>

            <View style={styles.row}>
              <AppText tone="secondary">Trust score</AppText>

              <AppText variant="bodyStrong">{trustScore}</AppText>
            </View>

            <View style={styles.row}>
              <AppText tone="secondary">Reputation</AppText>

              <AppText variant="bodyStrong">
                {profile.trustIntelligence?.signals.reputation ?? 0}
              </AppText>
            </View>

            <View style={styles.row}>
              <AppText tone="secondary">Verification</AppText>

              <AppText variant="bodyStrong">
                {profile.trustIntelligence?.signals.verified ? 'Verified' : 'Not verified'}
              </AppText>
            </View>
          </Card>

          <Card variant="muted" style={styles.card}>
            <AppText variant="subheading">Verification</AppText>

            {profile.trustProfile?.verification.length ? (
              profile.trustProfile.verification.map((verification) => (
                <View key={verification.id} style={styles.row}>
                  <AppText tone="secondary">{verification.subjectType}</AppText>

                  <AppText variant="bodyStrong">
                    {formatCustomerStatus(verification.status)}
                  </AppText>
                </View>
              ))
            ) : (
              <AppText tone="secondary">You do not have any verification records yet.</AppText>
            )}
          </Card>
        </View>
      ) : null}

      {section === 'settings' ? (
        <View style={styles.section}>
          <Card style={styles.form}>
            <AppText variant="subheading">Profile details</AppText>

            {[
              {
                label: 'Username',
                value: username,
                setter: setUsername,
                placeholder: 'your.username',
              },
              {
                label: 'Bio',
                value: bio,
                setter: setBio,
                placeholder: 'A little about you and your connection to the area',
              },
              {
                label: 'Local area',
                value: localArea,
                setter: setLocalArea,
                placeholder: 'Blackley, Manchester',
              },
            ].map((field) => (
              <View key={field.label} style={styles.field}>
                <AppText variant="caption" tone="secondary">
                  {field.label}
                </AppText>

                <TextInput
                  onChangeText={field.setter}
                  placeholder={field.placeholder}
                  placeholderTextColor={theme.colors.textMuted}
                  selectionColor={theme.colors.primary}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surfaceMuted,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.lg,
                      color: theme.colors.text,
                    },
                  ]}
                  value={field.value}
                />
              </View>
            ))}

            <View style={styles.profilePhotoSection}>
              <AppText variant="caption" tone="secondary">
                Profile photo
              </AppText>

              <View
                style={[
                  styles.profilePhotoPreview,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.pill,
                  },
                ]}
              >
                {avatarUrl ? (
                  <Image
                    accessibilityLabel="Your profile photo"
                    resizeMode="cover"
                    source={{ uri: avatarUrl }}
                    style={styles.profilePhotoImage}
                  />
                ) : (
                  <AppText variant="heading" tone="brand">
                    {user?.displayName?.slice(0, 1).toUpperCase() ?? 'N'}
                  </AppText>
                )}
              </View>

              <View style={styles.profilePhotoActions}>
                <Button
                  disabled={mediaPicker.opening || mediaUpload.uploading}
                  label={avatarUrl ? 'Change photo' : 'Choose from Photos'}
                  loading={mediaUpload.uploading}
                  onPress={() => {
                    void (async () => {
                      try {
                        const selection = await mediaPicker.pickFromLibrary();
                        const selected = selection.items[0];

                        if (!selected) {
                          return;
                        }

                        const uploaded = await mediaUpload.upload([selected]);
                        const url = uploaded[0]?.asset.url;

                        if (!url) {
                          throw new Error('The uploaded profile photo is not available yet.');
                        }

                        setAvatarUrl(url);
                      } catch (error) {
                        console.warn('[Neighbour/Profile] profile photo upload failed:', error);
                      }
                    })();
                  }}
                  variant="secondary"
                />

                <Button
                  disabled={mediaPicker.opening || mediaUpload.uploading}
                  label="Take photo"
                  onPress={() => {
                    void (async () => {
                      try {
                        const selection = await mediaPicker.takePhoto();
                        const selected = selection.items[0];

                        if (!selected) {
                          return;
                        }

                        const uploaded = await mediaUpload.upload([selected]);
                        const url = uploaded[0]?.asset.url;

                        if (!url) {
                          throw new Error('The uploaded profile photo is not available yet.');
                        }

                        setAvatarUrl(url);
                      } catch (error) {
                        console.warn('[Neighbour/Profile] profile photo upload failed:', error);
                      }
                    })();
                  }}
                  variant="secondary"
                />

                {avatarUrl ? (
                  <Button
                    disabled={mediaUpload.uploading}
                    label="Remove photo"
                    onPress={() => {
                      setAvatarUrl('');
                    }}
                    variant="ghost"
                  />
                ) : null}
              </View>

              {mediaPicker.error ? (
                <AppText variant="caption" tone="secondary">
                  {mediaPicker.error}
                </AppText>
              ) : null}

              {mediaUpload.uploading ? (
                <AppText variant="caption" tone="secondary">
                  Uploading profile photo… {Math.round(mediaUpload.overallProgress * 100)}%
                </AppText>
              ) : null}
            </View>

            <View style={styles.row}>
              <View style={styles.copy}>
                <AppText variant="bodyStrong">Show local area</AppText>

                <AppText variant="caption" tone="secondary">
                  Allow neighbours to see the local area shown on your profile.
                </AppText>
              </View>

              <Switch
                onValueChange={setShowLocalArea}
                trackColor={{
                  false: theme.colors.border,
                  true: theme.colors.primarySoft,
                }}
                thumbColor={showLocalArea ? theme.colors.primary : theme.colors.textMuted}
                value={showLocalArea}
              />
            </View>

            <Button
              label={
                profile.saving ? 'Saving…' : profile.profile ? 'Save profile' : 'Create profile'
              }
              onPress={() => {
                void profile.save({
                  username: username.trim(),
                  ...(bio.trim() ? { bio: bio.trim() } : {}),
                  avatarUrl: avatarUrl.trim() || null,
                  ...(localArea.trim() ? { localArea: localArea.trim() } : {}),
                  showLocalArea,
                });
              }}
            />
          </Card>

          <Button
            label="Explore Neighbour Premium"
            onPress={() => {
              navigation.navigate('Premium');
            }}
            variant="secondary"
          />

          <Button
            label="Sign out of Neighbour"
            onPress={() => {
              void logout();
            }}
            variant="secondary"
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 18,
    paddingBottom: 52,
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    gap: 14,
    justifyContent: 'center',
  },
  header: {
    gap: 7,
  },
  error: {
    gap: 0,
  },
  errorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  errorDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  errorCopy: {
    flex: 1,
    gap: 2,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 2,
  },
  tab: {
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    flexGrow: 1,
    minHeight: 38,
    minWidth: '30%',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  section: {
    gap: 10,
  },
  card: {
    gap: 11,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 7,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  identityHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  identityMark: {
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  identityMarkText: {
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 30,
  },
  identityCopy: {
    flex: 1,
    gap: 3,
  },
  trustBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 62,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  profilePhotoSection: {
    gap: 12,
  },
  profilePhotoPreview: {
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    height: 112,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 112,
  },
  profilePhotoImage: {
    height: '100%',
    width: '100%',
  },
  profilePhotoActions: {
    gap: 8,
  },
});
