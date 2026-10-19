import '@/global.css';

import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
} from '@expo-google-fonts/figtree';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplash } from '@/components/AnimatedSplash';
import { ToastProvider } from '@/components/reacticx/molecules/Toast';
import { usePushNotifications } from '@/lib/push';
import { queryClient } from '@/lib/query-client';
import { fonts } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_700Bold,
    BricolageGrotesque_800ExtraBold,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
  });
  const ready = fontsLoaded; // MMKV restores the session synchronously, so only fonts need waiting for
  usePushNotifications(ready);

  if (!ready) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider
        position="top"
        theme="light"
        titleStyle={{ fontFamily: fonts.bodyBold }}
        descriptionStyle={{ fontFamily: fonts.body }}
      >
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
        {/* Hides the native splash itself once it's on screen, then plays and fades away. */}
        <AnimatedSplash />
      </ToastProvider>
    </QueryClientProvider>
  );
}
