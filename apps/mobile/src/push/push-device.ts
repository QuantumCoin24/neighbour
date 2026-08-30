import {
  registerPushDevice,
  unregisterPushDevice,
} from '@neighbour/api-client';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

async function getGrantedNativePushToken(
  requestPermission: boolean,
): Promise<string | null> {
  if (Platform.OS !== 'ios') {
    return null;
  }

  let permissions = await Notifications.getPermissionsAsync();

  if (
    !permissions.granted &&
    requestPermission &&
    permissions.canAskAgain
  ) {
    permissions = await Notifications.requestPermissionsAsync();
  }

  if (!permissions.granted) {
    return null;
  }

  const token = await Notifications.getDevicePushTokenAsync();

  if (typeof token.data !== 'string' || !token.data.trim()) {
    return null;
  }

  return token.data.trim();
}

export async function registerCurrentPushDevice(): Promise<string | null> {
  try {
    const token = await getGrantedNativePushToken(true);

    if (!token) {
      return null;
    }

    await registerPushDevice({
      platform: 'ios',
      token,
    });

    return token;
  } catch {
    return null;
  }
}

export async function unregisterCurrentPushDevice(): Promise<void> {
  try {
    const token = await getGrantedNativePushToken(false);

    if (!token) {
      return;
    }

    await unregisterPushDevice(token);
  } catch {
    // Explicit logout must still succeed if notification cleanup is unavailable.
  }
}
