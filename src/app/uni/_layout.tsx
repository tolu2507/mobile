import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/store/auth';

/** The university side: only for university student accounts. */
export default function UniLayout() {
  const { accessToken, activeRole, user } = useAuth();
  if (!accessToken || activeRole !== 'STUDENT' || user?.studentLevel !== 'TERTIARY') return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
