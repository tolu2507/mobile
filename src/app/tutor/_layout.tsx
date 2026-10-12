import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/store/auth';

export default function TutorLayout() {
  const { accessToken, activeRole } = useAuth();
  if (!accessToken || activeRole !== 'TUTOR') return <Redirect href="/" />;
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="test" options={{ gestureEnabled: false, animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
