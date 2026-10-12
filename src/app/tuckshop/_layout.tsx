import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/store/auth';

export default function TuckShopLayout() {
  const { accessToken, activeRole } = useAuth();
  if (!accessToken || activeRole !== 'TUCK_SHOP') return <Redirect href="/" />;
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      {/* The child holds the phone during a sale: no swiping back out of it. */}
      <Stack.Screen name="sell" options={{ gestureEnabled: false, animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
