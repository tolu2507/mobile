import { router } from 'expo-router';
import { View } from 'react-native';

import { ProfileScreen } from '@/components/ProfileScreen';
import { ScreenHeader } from '@/components/ui';
import { roles } from '@/theme';

export default function TutorAccount() {
  return (
    <ProfileScreen
      theme={roles.tutor}
      extraRows={[
        { icon: 'create-outline', label: 'Teacher profile & subjects', href: '/tutor/profile-form' },
        { icon: 'cash-outline', label: 'Earnings', href: '/tutor/earnings' },
      ]}
    >
      <View className="absolute left-0 top-0">
        <ScreenHeader title="" onBack={() => router.back()} />
      </View>
    </ProfileScreen>
  );
}
