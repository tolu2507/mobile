import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Card, GameButton, PressableScale, Screen, ScreenHeader } from '@/components/ui';
import { palette } from '@/theme';

const SUPPORT_EMAIL = 'support@nexus.ng'; // TODO(launch): confirm the real support inbox

const FAQ = [
  { q: 'My child forgot their PIN', a: 'In the parent app go to Me → My children → choose your child → Reset PIN. They can sign in with the new PIN straight away.' },
  { q: 'How do weekly reports work?', a: 'Every Friday at 4pm we summarise the week: quests, lesson quizzes and (if their school uses Nexus) attendance and tests. You can also open the report any time to see the week so far.' },
  { q: 'What does “Nexus approved” mean?', a: 'The teacher passed our subject test, an ID check with two referees, and an interview with the Nexus team.' },
  { q: 'When does the teacher get paid?', a: 'Your payment waits safely with us. It goes to the teacher when your child finishes the short quiz after the lesson, or when you confirm the lesson happened. If something went wrong, tap “Report a problem” on the lesson and we’ll hold the money while we look into it.' },
  { q: 'Is the first lesson free?', a: 'Yes. The first lesson with every new teacher is a free trial.' },
  { q: 'How do I become a lesson teacher?', a: 'Go to Me → Become a lesson teacher (or sign up as a teacher). Fill in your profile, ID check, take a 20-minute subject test, then a short interview.' },
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
              <Animated.View entering={FadeIn.duration(200)} className="px-3.5 pb-4">
                <Text className="font-body text-[14px] leading-[21px] text-ink-700">{item.a}</Text>
              </Animated.View>
            ) : null}
          </View>
        ))}
      </Card>
      <GameButton label="Email support" icon={<Ionicons name="mail-outline" size={20} color="#FFFFFF" />} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Help with Nexus`)} />
    </Screen>
  );
}
