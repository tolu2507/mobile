import { Redirect, Stack } from 'expo-router';

import { StickerCelebrations } from '@/features/student/components/StickerCelebration';
import { useAuth } from '@/store/auth';

export default function StudentLayout() {
  const { accessToken, activeRole, user } = useAuth();
  if (!accessToken || activeRole !== 'STUDENT') return <Redirect href="/" />;
  if (user?.studentLevel === 'TERTIARY') return <Redirect href="/uni" />;
  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
      <StickerCelebrations />
    </>
  );
}
