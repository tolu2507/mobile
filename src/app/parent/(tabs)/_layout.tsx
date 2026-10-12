import { Tabs } from 'expo-router/tabs';

import { TabBar } from '@/components/TabBar';
import { roles } from '@/theme';

export default function ParentTabs() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <TabBar {...props} accent={roles.parent.accent} icons={{ index: 'bar-chart-outline', teachers: 'school-outline', wallet: 'wallet-outline', me: 'person-outline' }} />
      )}
    >
      <Tabs.Screen name="index" options={{ title: 'Reports' }} />
      <Tabs.Screen name="teachers" options={{ title: 'Teachers' }} />
      <Tabs.Screen name="wallet" options={{ title: 'Wallet' }} />
      <Tabs.Screen name="me" options={{ title: 'Me' }} />
    </Tabs>
  );
}
