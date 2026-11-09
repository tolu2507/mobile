import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { ProfileScreen } from '@/components/ProfileScreen';
import { useUniMe } from '@/features/uni/api';
import { UNI } from '@/features/uni/components/classroom-theme';
import { palette } from '@/theme';

export default function UniMe() {
  const { data } = useUniMe();
  const done = data?.courses.reduce((n, c) => n + c.lessonsDone, 0) ?? 0;
  const stats = data
    ? [
        { label: 'Day streak', value: data.streak, icon: <MaterialCommunityIcons name="fire" size={22} color="#FF8A3D" /> },
        { label: 'Classes done', value: done, icon: <Ionicons name="school" size={20} color={UNI.accent} /> },
        { label: 'Total XP', value: data.xp, icon: <Ionicons name="flash" size={20} color={palette.sun[600]} /> },
      ]
    : [];

  return (
    <ProfileScreen theme={UNI} extraRows={[{ icon: 'library-outline', label: 'Change my courses', href: '/uni/setup' }]}>
      {data?.department ? (
        <View className="rounded-[20px] bg-white p-4">
          <Text className="font-body-bold text-[15px] text-ink">{data.department.name}</Text>
          <Text className="font-body text-[13px] text-ink-500">
            Faculty of {data.department.faculty} · {data.level}
          </Text>
        </View>
      ) : null}
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
