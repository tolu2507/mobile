import { ProfileScreen } from '@/components/ProfileScreen';
import { roles } from '@/theme';

export default function ParentMe() {
  return <ProfileScreen theme={roles.parent} extraRows={[
        { icon: 'people-outline', label: 'My children', href: '/parent/children' },
        { icon: 'card-outline', label: 'BrainBox plan', href: '/parent/plan' },
        { icon: 'gift-outline', label: 'Rewards', href: '/parent/rewards' },
      ]} />;
}
