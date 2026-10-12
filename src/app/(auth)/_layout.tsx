import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/store/auth';

export default function AuthLayout() {
  const accessToken = useAuth((s) => s.accessToken);
  if (accessToken) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
