import { Tabs } from 'expo-router/tabs';

import { TabBar } from '@/components/TabBar';
import { isPrimary, useStudentHome } from '@/features/student/api';
import { roles } from '@/theme';

export default function StudentTabs() {
  const { data } = useStudentHome();
  const primary = isPrimary(data);
  const theme = primary ? roles.studentPrimary : roles.student;

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <TabBar
          {...props}
          accent={theme.accent}
          variant={primary ? 'playful' : 'standard'}
          icons={{ index: 'home-outline', leagues: primary ? 'people-outline' : 'trophy-outline', wallet: primary ? 'star-outline' : 'wallet-outline', me: 'person-outline' }}
        />
      )}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="leagues" options={{ title: primary ? 'My league' : 'Leagues' }} />
      <Tabs.Screen name="wallet" options={{ title: primary ? 'Stickers' : 'Wallet' }} />
      <Tabs.Screen name="me" options={{ title: 'Me' }} />
    </Tabs>
  );
}
