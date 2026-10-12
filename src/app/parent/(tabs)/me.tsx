import { router } from 'expo-router';
import { Alert } from 'react-native';

import { ProfileScreen } from '@/components/ProfileScreen';
import { toast } from '@/components/reacticx/molecules/Toast';
import { useAddRole } from '@/features/me/api';
import { friendlyError } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { useAuth } from '@/store/auth';
import { roles } from '@/theme';

export default function ParentMe() {
  const addRole = useAddRole();
  const { user, switchRole } = useAuth();
  const isTutor = user?.memberships.some((m) => m.role === 'TUTOR');

  const becomeTutor = () =>
    Alert.alert('Become a lesson teacher?', 'You’ll keep your parent account and can switch between them any time. Next: your teacher profile and a short subject test.', [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Let’s go',
        onPress: () =>
          addRole.mutate('TUTOR', {
            onSuccess: () => {
              switchRole('TUTOR');
              queryClient.clear();
              router.replace('/');
            },
            onError: (e) => toast.error(friendlyError(e)),
          }),
      },
    ]);

  return (
    <ProfileScreen
      theme={roles.parent}
      extraRows={[
        { icon: 'people-outline', label: 'My children', href: '/parent/children' },
        ...(isTutor ? [] : [{ icon: 'easel-outline' as const, label: 'Become a lesson teacher', onPress: becomeTutor }]),
      ]}
    />
  );
}
