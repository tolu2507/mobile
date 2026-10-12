import { Tabs } from 'expo-router/tabs';

import { TabBar } from '@/components/TabBar';
import { roles } from '@/theme';

export default function TuckShopTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} accent={roles.tuckshop.accent} icons={{ index: 'storefront-outline', sales: 'receipt-outline', me: 'person-outline' }} />}>
      <Tabs.Screen name="index" options={{ title: 'Counter' }} />
      <Tabs.Screen name="sales" options={{ title: 'Today' }} />
      <Tabs.Screen name="me" options={{ title: 'Me' }} />
    </Tabs>
  );
}
