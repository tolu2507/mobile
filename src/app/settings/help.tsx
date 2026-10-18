import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Card, GameButton, PressableScale, Screen, ScreenHeader } from '@/components/ui';
import { palette } from '@/theme';

const SUPPORT_EMAIL = 'support@nexus.ng'; // TODO(launch): confirm the real support inbox

const FAQ = [
  { q: 'My child forgot their PIN', a: 'In the parent app go to Me → My children → choose your child → Reset PIN. They can sign in with the new PIN straight away.' },
  {
    q: 'How do weekly reports work?',
    a: 'Every Friday at 4pm we summarise the week: quests, lesson quizzes and (if their school uses Nexus) attendance and tests. You can also open the report any time to see the week so far.',
  },
];

export default function Help() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Screen background={palette.paper} edges={['top', 'bottom']}>
      <ScreenHeader title="Help & support" />
      <Card className="p-2">
        {FAQ.map((item, i) => (
          <View key={item.q} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: palette.ink[100] }}>
            <PressableScale accessibilityState={{ expanded: open === i }} onPress={() => setOpen(open === i ? null : i)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
              <Text className="flex-1 font-body-bold text-[15px] text-ink">{item.q}</Text>
              <Ionicons name={open === i ? 'chevron-up' : 'chevron-down'} size={18} color={palette.ink[500]} />
            </PressableScale>
            {open === i ? (
              <Animated.View entering={FadeIn.duration(200)}>
                <View className="px-3.5 pb-4">
                  <Text className="font-body text-[14px] leading-[21px] text-ink-700">{item.a}</Text>
                </View>
              </Animated.View>
            ) : null}
          </View>
        ))}
      </Card>
      <GameButton label="Email support" icon={<Ionicons name="mail-outline" size={20} color="#FFFFFF" />} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Help with Nexus`)} />
    </Screen>
  );
}
