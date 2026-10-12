import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/store/auth';

export default function ParentLayout() {
  const { accessToken, activeRole } = useAuth();
  if (!accessToken || activeRole !== 'PARENT') return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
