import { Redirect } from 'expo-router';

import { useAuth } from '@/store/auth';

/** Sends each person to their own world based on the role they're using. */
export default function Index() {
  const { accessToken, activeRole } = useAuth();
  if (!accessToken) return <Redirect href="/welcome" />;
  if (activeRole === 'PARENT') return <Redirect href="/parent" />;
  if (activeRole === 'STUDENT') return <Redirect href="/student" />;
  if (activeRole === 'TUCK_SHOP') return <Redirect href="/tuckshop" />;
  return <Redirect href="/no-access" />;
}
