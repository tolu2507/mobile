import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Pulse } from '@/components/game';
import { Caption, Label, PressableScale } from '@/components/ui';
import { useNow } from '@/lib/useNow';
import { palette } from '@/theme';
import { useMocks } from '../api';
import { countdown, lagosWhen } from '../format';

/** Student home: the next Friday mock, loud when it's open. Hidden when none of their exams has one. */
export function FridayMockCard() {
  const mocks = useMocks();
  const now = useNow();
  const m = mocks.data?.upcoming[0];
  if (!m) return null;

  const open = m.state === 'OPEN' && !m.sitting?.submitted;
  const title = open ? (m.sitting ? 'Your mock is in progress' : `${m.title.split(' · ')[0]} is open!`) : m.title.split(' · ')[0];
  const detail =
    m.state === 'OPEN'
      ? m.sitting?.submitted
        ? 'Submitted. Results and your national rank at 9pm.'
        : m.sitting
          ? 'Tap to carry on. The clock is still running.'
          : `Open until ${lagosWhen(m.closesAt, false)}. ${m.durationMinutes} minutes, real exam format.`
      : m.state === 'MARKING'
        ? 'Results coming out shortly.'
        : `${lagosWhen(m.opensAt)} · in ${countdown(new Date(m.opensAt).getTime() - now)}`;

  const card = (
    <PressableScale
      onPress={() => router.push('/student/mocks')}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}`}
      style={{ backgroundColor: open ? palette.coral[500] : '#FFFFFF', borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
    >
      <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl" style={{ backgroundColor: open ? 'rgba(255,255,255,0.2)' : palette.coral[50] }}>
        <MaterialCommunityIcons name="timer-outline" size={26} color={open ? '#FFFFFF' : palette.coral[500]} />
      </View>
      <View className="flex-1 gap-0.5">
        <Label className={open ? 'text-white' : ''}>{title}</Label>
        <Caption className={open ? 'text-white/90' : ''}>{detail}</Caption>
      </View>
      {open ? <Text className="font-body-bold text-[14px] text-white">{m.sitting ? 'Continue' : 'Start'}</Text> : <Ionicons name="chevron-forward" size={20} color={palette.ink[300]} />}
    </PressableScale>
  );
  return open ? <Pulse scale={1.02}>{card}</Pulse> : card;
}
