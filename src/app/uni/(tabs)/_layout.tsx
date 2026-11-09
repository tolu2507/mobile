import { Tabs } from 'expo-router/tabs';

import { TabBar } from '@/components/TabBar';
import { UNI } from '@/features/uni/components/classroom-theme';

export default function UniTabs() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} accent={UNI.accent} icons={{ index: 'library-outline', me: 'person-outline' }} />}>
      <Tabs.Screen name="index" options={{ title: 'My courses' }} />
      <Tabs.Screen name="me" options={{ title: 'Me' }} />
    </Tabs>
  );
}
