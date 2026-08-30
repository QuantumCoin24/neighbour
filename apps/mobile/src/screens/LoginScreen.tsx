import { useEffect, useMemo, useState } from 'react';
import { Keyboard, Linking, Pressable, StyleSheet, View } from 'react-native';

import { useAuth } from '../auth/auth-context';
import { AppText, Button, Card, Screen, TextField } from '../components';
import NeighbourMark from '../components/brand/NeighbourMark';
import { useNeighbourTheme } from '../theme';

type AuthMode = 'login' | 'register';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidRegistrationPassword(value: string): boolean {
  return value.length >= 8 && /[A-Za-z]/.test(value) && /[0-9]/.test(value);
}

export default function LoginScreen() {
  const { theme } = useNeighbourTheme();
  const { status, error, login, register, clearError } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isAuthenticating = status === 'authenticating';
  const normalizedEmail = email.trim().toLowerCase();

  const isFormValid = useMemo(() => {
    if (!isValidEmail(normalizedEmail)) {
      return false;
    }

    if (mode === 'login') {
      return password.length > 0;
    }

    return displayName.trim().length >= 2 && isValidRegistrationPassword(password);
  }, [displayName, mode, normalizedEmail, password]);

  useEffect(() => {
    clearError();
  }, [mode, clearError]);

  async function submit(): Promise<void> {
    if (!isFormValid || isAuthenticating) {
      return;
    }

    Keyboard.dismiss();

    try {
      if (mode === 'login') {
        await login({
          email: normalizedEmail,
          password,
        });

        return;
      }

      await register({
        displayName: displayName.trim(),
        email: normalizedEmail,
        password,
      });
    } catch {
      // The authentication provider owns the user-facing error state.
    }
  }

  function changeMode(nextMode: AuthMode): void {
    setMode(nextMode);
    setPassword('');
  }

  const passwordError =
    mode === 'register' && password.length > 0 && !isValidRegistrationPassword(password)
      ? 'Use at least 8 characters with a letter and a number.'
      : null;

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.hero}>
        <View style={styles.brandHeader}>
          <NeighbourMark size={82} style={theme.shadows.floating} />

          <View style={styles.brandIdentity}>
            <AppText variant="overline" tone="brand">
              NEIGHBOUR™
            </AppText>

            <AppText variant="caption" tone="muted">
              Stronger together. Local forever.
            </AppText>
          </View>
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
        <View style={styles.modeSelector}>
          <Pressable
            accessibilityRole="button"
            onPress={() => changeMode('login')}
            style={[
              styles.modeButton,
              {
                backgroundColor: mode === 'login' ? theme.colors.primarySoft : 'transparent',
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="label" tone={mode === 'login' ? 'brand' : 'muted'}>
              Sign in
            </AppText>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => changeMode('register')}
            style={[
              styles.modeButton,
              {
                backgroundColor: mode === 'register' ? theme.colors.primarySoft : 'transparent',
                borderRadius: theme.radius.pill,
              },
            ]}
          >
            <AppText variant="label" tone={mode === 'register' ? 'brand' : 'muted'}>
              Create account
            </AppText>
          </Pressable>
        </View>

        <View style={styles.formHeader}>
          <AppText variant="heading">
            {mode === 'login' ? 'Good to see you.' : 'Join your neighbourhood.'}
          </AppText>

          <AppText tone="secondary">
            {mode === 'login'
              ? 'Sign in to continue to Neighbour™.'
              : 'Create your secure Neighbour™ identity.'}
          </AppText>
        </View>

        <View style={styles.fields}>
          {mode === 'register' ? (
            <TextField
              autoCapitalize="words"
              autoComplete="name"
              label="Your name"
              onChangeText={setDisplayName}
              placeholder="Jason Greaves"
              returnKeyType="next"
              textContentType="name"
              value={displayName}
            />
          ) : null}

          <TextField
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            label="Email address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            returnKeyType="next"
            textContentType="emailAddress"
            value={email}
          />

          <TextField
            autoCapitalize="none"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            label="Password"
            onChangeText={setPassword}
            onSubmitEditing={() => {
              void submit();
            }}
            placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'}
            returnKeyType="go"
            secureTextEntry
            textContentType={mode === 'login' ? 'password' : 'newPassword'}
            value={password}
            {...(passwordError
              ? {
                  error: passwordError,
                }
              : {})}
          />
        </View>

        {error ? (
          <View
            style={[
              styles.errorPanel,
              {
                backgroundColor: `${theme.colors.danger}14`,
                borderColor: `${theme.colors.danger}38`,
                borderRadius: theme.radius.md,
              },
            ]}
          >
            <AppText
              variant="caption"
              style={{
                color: theme.colors.danger,
              }}
            >
              {error}
            </AppText>
          </View>
        ) : null}

        <Button
          disabled={!isFormValid}
          label={mode === 'login' ? 'Continue' : 'Create my account'}
          loading={isAuthenticating}
          onPress={() => {
            void submit();
          }}
        />

        {mode === 'register' ? (
          <View>
            <AppText variant="caption" tone="muted" style={styles.privacyNotice}>
              Neighbour is for people aged 16 and over. By creating an account, you confirm that
              you are at least 16 and agree to our{' '}
              <AppText
                variant="caption"
                tone="brand"
                onPress={() => {
                  void Linking.openURL('https://www.neighbourlocal.com/terms');
                }}
              >
                Terms of Use
              </AppText>{' '}
              and acknowledge our{' '}
              <AppText
                variant="caption"
                tone="brand"
                onPress={() => {
                  void Linking.openURL('https://www.neighbourlocal.com/privacy');
                }}
              >
                Privacy Policy
              </AppText>
              .
            </AppText>
          </View>
        ) : (
          <AppText variant="caption" tone="muted" style={styles.privacyNotice}>
            Your account is protected using the existing Neighbour authentication and session
            platform.
          </AppText>
        )}
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
  brandHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  brandIdentity: {
    flex: 1,
    gap: 3,
  },
  introduction: {
    gap: 12,
  },
  formCard: {
    gap: 22,
    marginTop: 38,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  modeButton: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  formHeader: {
    gap: 6,
  },
  fields: {
    gap: 18,
  },
  errorPanel: {
    borderWidth: 1,
    padding: 12,
  },
  privacyNotice: {
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 8,
    paddingTop: 32,
  },
});
