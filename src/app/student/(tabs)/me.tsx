import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { ProfileScreen } from '@/components/ProfileScreen';
import { isPrimary, useStudentHome } from '@/features/student/api';
import { palette, roles } from '@/theme';

export default function StudentMe() {
  const { data } = useStudentHome();
  const primary = isPrimary(data);
  const theme = primary ? roles.studentPrimary : roles.student;

  const stats = data
    ? [
        { label: 'Day streak', value: data.streak, icon: <MaterialCommunityIcons name="fire" size={22} color="#FF8A3D" /> },
        { label: primary ? 'Stars' : 'Level', value: primary ? data.stars : data.xp.level, icon: <Ionicons name="star" size={20} color="#FFB800" /> },
        { label: 'Total XP', value: data.xp.current, icon: <Ionicons name="flash" size={20} color={palette.violet[500]} /> },
      ]
    : [];

  return (
    <ProfileScreen theme={theme} floatingTabBar={primary} extraRows={primary ? [] : [{ icon: 'ribbon-outline', label: 'My stickers', href: '/student/stickers' }]}>
      <View className="flex-row gap-3">
        {stats.map((s) => (
          <View key={s.label} accessibilityLabel={`${s.label}: ${s.value}`} className="flex-1 items-center gap-1 rounded-[20px] bg-white py-4">
            {s.icon}
            <Text className="font-display text-[22px] text-ink">{s.value.toLocaleString()}</Text>
            <Text className="font-body text-[12px] text-ink-500">{s.label}</Text>
          </View>
        ))}
      </View>
    </ProfileScreen>
  );
}
