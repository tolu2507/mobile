import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { api } from '@/lib/api';
import { PUSH_TOKEN_KEY, storage } from '@/lib/storage';
import { useAuth } from '@/store/auth';
import { palette } from '@/theme';

/** on: registered · denied: the person said no · unavailable: this build has no push credentials (see README). */
export type PushStatus = 'on' | 'denied' | 'unavailable';

// Show notifications as a banner even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/** Asks for permission (only if `ask`), gets this phone's token and sends it to the API. */
export async function registerForPush(ask: boolean): Promise<PushStatus> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Nexus',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: palette.violet[500],
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted' && ask) ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== 'granted') return 'denied';

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return 'unavailable';
  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.post('/me/push-tokens', { token, platform: Platform.OS });
    storage.set(PUSH_TOKEN_KEY, token);
    return 'on';
  } catch {
    // No Firebase credentials in this build, or the phone has no Google Play services.
    return 'unavailable';
  }
}

/** Registers after sign-in and opens the right screen when a notification is tapped. Mount once at the root. */
export function usePushNotifications(navigationReady: boolean) {
  const signedIn = useAuth((s) => !!s.accessToken && !!s.activeRole);
  const last = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (signedIn) registerForPush(true).catch(() => {});
  }, [signedIn]);

  // Covers both a tap while the app is running and a tap that launched it.
  useEffect(() => {
    const url = last?.notification.request.content.data?.url;
    if (navigationReady && signedIn && typeof url === 'string' && url.startsWith('/')) router.push(url as Href);
  }, [last, signedIn, navigationReady]);
}
