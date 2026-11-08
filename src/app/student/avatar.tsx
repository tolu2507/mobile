import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar, Banner, GameButton, PressableScale, Screen, ScreenHeader } from '@/components/ui';
import { isPrimary, useSetAvatar, useStudentHome } from '@/features/student/api';
import { AVATAR_KEYS, AVATARS } from '@/features/student/avatars';
import { friendlyError } from '@/lib/api';
import { initials } from '@/lib/format';
import { goBack } from '@/lib/nav';
import { useAuth } from '@/store/auth';
import { palette, roles } from '@/theme';

/** The child picks their cartoon avatar (or goes back to initials). Parents and league friends see it too. */
export default function AvatarScreen() {
  const home = useStudentHome();
  const theme = isPrimary(home.data) ? roles.studentPrimary : roles.student;
  const { user } = useAuth();
  const save = useSetAvatar();
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const current = home.data?.avatar ?? null;
  const choice = picked === undefined ? current : picked;

  const done = () => save.mutate(choice, { onSuccess: () => goBack('/student/me') });

  return (
    <Screen background={theme.bg} accent={theme.accent} edges={['top', 'bottom']}>
      <ScreenHeader title="Pick your avatar" subtitle="Your friends in leagues and your parents will see it." />

      <View className="items-center gap-2">
        <Avatar initials={initials(user?.firstName ?? '?', user?.lastName)} avatar={choice} size={132} radius={44} />
        <Text className="font-display text-[20px] text-ink">{user?.firstName}</Text>
      </View>

      <View className="flex-row flex-wrap justify-between gap-y-3">
        {AVATAR_KEYS.map((key, i) => {
          const selected = key === choice;
          return (
            <Animated.View key={key} entering={FadeInDown.delay(Math.min(i, 12) * 30)} style={{ width: '23%' }}>
              <PressableScale
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Avatar ${i + 1}`}
                onPress={() => setPicked(key)}
                style={{ aspectRatio: 1, borderRadius: 20, backgroundColor: selected ? theme.accentSoft : palette.white, borderWidth: 3, borderColor: selected ? theme.accent : 'transparent', overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' }}
              >
                <Image source={AVATARS[key]} style={{ width: '92%', height: '92%' }} contentFit="contain" />
                {selected ? (
                  <View style={{ position: 'absolute', top: 4, right: 4 }}>
                    <Ionicons name="checkmark-circle" size={22} color={theme.accent} />
                  </View>
                ) : null}
              </PressableScale>
            </Animated.View>
          );
        })}
      </View>

      <PressableScale
        accessibilityRole="radio"
        accessibilityState={{ selected: choice === null }}
        onPress={() => setPicked(null)}
        style={{ minHeight: 48, borderRadius: 16, borderWidth: 2, borderColor: choice === null ? theme.accent : palette.ink[200], backgroundColor: choice === null ? theme.accentSoft : palette.white, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text className="font-body-bold text-[15px] text-ink">Use my initials instead</Text>
      </PressableScale>

      {save.isError ? <Banner tone="error" message={friendlyError(save.error)} /> : null}
      <GameButton label="Save" color={theme.accent} shadowColor={theme.shadow} loading={save.isPending} disabled={choice === current} onPress={done} />
    </Screen>
  );
}
