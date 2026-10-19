import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Caption, Card, CardListSkeleton, EmptyState, ErrorState, GameButton, Label, Pill, PressableScale, Screen, ScreenHeader } from '@/components/ui';
import { useMyTickets, type SupportStatus } from '@/features/support/api';
import { timeAgo } from '@/lib/format';
import { palette } from '@/theme';

const FAQ = [
  { q: 'My child forgot their PIN', a: 'In the parent app go to Me → My children → choose your child → Reset PIN. They can sign in with the new PIN straight away.' },
  {
    q: 'How do weekly reports work?',
    a: 'Every Friday at 4pm we sum up the week: practice, Friday mocks, streaks and (if their school uses Nexus) attendance and tests. You can open the report any time to see the week so far.',
  },
  {
    q: 'Where do the practice questions come from?',
    a: 'Nexus writes its own questions, following the pattern of real past papers for each exam. Every question is checked before students see it, and a student never gets the same question twice.',
  },
  { q: 'When is the Friday mock?', a: 'Every Friday a timed mock opens for each exam, just like the real CBT. Results and the child’s national ranking come out after it closes.' },
  { q: 'I found a mistake in a question', a: 'Tap “Report this question” under it. We check every report and fix or remove the question.' },
];

const STATUS: Record<SupportStatus, { label: string; tone: 'sun' | 'sky' | 'mint' }> = {
  OPEN: { label: 'Sent', tone: 'sun' },
  WAITING_ON_USER: { label: 'We replied', tone: 'sky' },
  RESOLVED: { label: 'Resolved', tone: 'mint' },
};

export default function Help() {
  const [open, setOpen] = useState<number | null>(0);
  const tickets = useMyTickets();
  return (
    <Screen background={palette.paper} edges={['top', 'bottom']} refreshing={tickets.isRefetching} onRefresh={tickets.refetch}>
      <ScreenHeader title="Help & support" />
      <Card className="p-2">
        {FAQ.map((item, i) => (
          <View key={item.q} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: palette.ink[100] }}>
            <PressableScale accessibilityRole="button" accessibilityState={{ expanded: open === i }} onPress={() => setOpen(open === i ? null : i)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 44 }}>
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

      <Text className="mt-2 font-display text-[18px] text-ink">Your questions</Text>
      {tickets.isPending ? (
        <CardListSkeleton count={2} height={72} />
      ) : tickets.isError ? (
        <ErrorState error={tickets.error} onRetry={tickets.refetch} />
      ) : tickets.data.length === 0 ? (
        <EmptyState icon="chatbubbles-outline" title="No questions yet" message="Ask us anything about Nexus. We reply here, and you’ll get a notification." />
      ) : (
        <View className="gap-2">
          {tickets.data.map((t, i) => (
            <Animated.View key={t.id} entering={FadeInDown.delay(i * 60).duration(300)}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={`${t.subject}, ${STATUS[t.status].label}`}
                onPress={() => router.push({ pathname: '/settings/support/[id]', params: { id: t.id } })}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14 }}
              >
                <View className="flex-1 gap-1">
                  <Label numberOfLines={1}>{t.subject}</Label>
                  <Caption numberOfLines={1}>
                    {t.lastFromStaff ? 'Nexus: ' : 'You: '}
                    {t.lastMessage}
                  </Caption>
                  <View className="flex-row items-center gap-2">
                    <Pill tone={STATUS[t.status].tone} label={STATUS[t.status].label} />
                    <Caption>{timeAgo(t.updatedAt)}</Caption>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={palette.ink[300]} />
              </PressableScale>
            </Animated.View>
          ))}
        </View>
      )}
      <GameButton label="Ask us a question" icon={<Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />} onPress={() => router.push('/settings/support/new')} />
    </Screen>
  );
}
