import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Flame } from '@/components/game';
import { Avatar, Caption, CardListSkeleton, Display, EmptyState, ErrorState, GameButton, Label, PressableScale, Screen } from '@/components/ui';
import { countdown, lagosWhen, ordinal } from '@/features/mocks/format';
import { useChildCards, useChildren, useParentRewards, usePlan } from '@/features/parent/api';
import { PendingChildren } from '@/features/parent/components/PendingChildren';
import { PlanBanner, RewardsBanner } from '@/features/parent/components/PlanBanner';
import { initials } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { palette, roles } from '@/theme';
import type { Child, ChildCard as Card } from '@/types/api';

const theme = roles.parent;

/** Parent home: every child at a glance. Tap one for the full picture. */
export default function ParentHome() {
  const children = useChildren();
  const cards = useChildCards();
  const plan = usePlan();
  const rewards = useParentRewards();
  const refresh = () => {
    void children.refetch();
    void cards.refetch();
    void plan.refetch();
    void rewards.refetch();
  };

  return (
    <Screen background={theme.bg} accent={theme.accent} refreshing={children.isRefetching || cards.isRefetching} onRefresh={refresh}>
      <View className="flex-row items-center justify-between">
        <Display className="text-[26px]">My children</Display>
        <PressableScale accessibilityLabel="Add a child" onPress={() => router.push('/parent/children/new')} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="person-add-outline" size={21} color={palette.ink.DEFAULT} />
        </PressableScale>
      </View>

      <PendingChildren />
      <PlanBanner />
      <RewardsBanner />

      {children.isPending ? (
        <CardListSkeleton count={2} height={190} />
      ) : children.isError ? (
        <ErrorState error={children.error} onRetry={refresh} color={theme.accent} />
      ) : children.data.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Add your first child"
          message="Create a login for your child in under a minute. No school needed: they can start practising for their exams today, and you’ll see exactly how they’re doing."
          action={<GameButton label="Add a child" color={theme.accent} shadowColor={theme.shadow} className="mt-2 self-stretch" onPress={() => router.push('/parent/children/new')} />}
        />
      ) : (
        children.data.map((c, i) => (
          <Animated.View key={c.id} entering={FadeInDown.delay(i * 80).springify().damping(16)}>
            <ChildTile child={c} card={cards.data?.find((x) => x.studentId === c.id)} loading={cards.isPending} />
          </Animated.View>
        ))
      )}
    </Screen>
  );
}

function ChildTile({ child, card, loading }: { child: Child; card?: Card; loading: boolean }) {
  const w = card?.week;
  const accuracy = w?.questions ? Math.round((w.correct / w.questions) * 100) : null;
  const exams = card?.exams.map((e) => (e.targetYear ? `${e.label} ${e.targetYear}` : e.label)).join(' · ');
  const quiet = !!card && !loading && w?.activeDays === 0;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${child.firstName}. ${w ? `${w.questions} questions this week.` : ''} Open ${child.firstName}’s progress`}
      onPress={() => router.push({ pathname: '/parent/children/[id]', params: { id: child.id } })}
      style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, gap: 14 }}
    >
      <View className="flex-row items-center gap-3">
        <Avatar initials={initials(child.firstName, child.lastName)} size={52} radius={17} />
        <View className="flex-1 gap-0.5">
          <Text className="font-display text-[20px] text-ink">{child.firstName}</Text>
          <Caption numberOfLines={1}>
            {child.className}
            {exams ? ` · ${exams}` : ''}
          </Caption>
        </View>
        {card ? (
          <View accessibilityLabel={`${card.streak} day streak`} className="flex-row items-center gap-1 rounded-full bg-coral-50 px-3 py-1.5">
            <Flame size={16} alive={card.streak > 0} />
            <Text className="font-body-bold text-[14px] text-ink">{card.streak}</Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View className="h-[64px] rounded-2xl bg-ink-100/50" />
      ) : w ? (
        <View className="flex-row gap-2">
          <Stat value={String(w.questions)} label="questions this week" />
          <Stat value={accuracy == null ? '–' : `${accuracy}%`} label="right" />
          <Stat value={`${w.activeDays}/7`} label="days practised" />
        </View>
      ) : null}

      {card?.lastMock ? (
        <View className="flex-row items-center gap-2.5 rounded-2xl p-3" style={{ backgroundColor: theme.accentSoft }}>
          <MaterialCommunityIcons name="clipboard-text-clock-outline" size={22} color={theme.accent} />
          <View className="flex-1">
            <Label className="text-[15px]">
              {card.lastMock.score}/{card.lastMock.outOf} in the {card.lastMock.title.split(' · ')[0]}
            </Label>
            <Caption>
              {card.lastMock.rank && card.lastMock.sat ? `${ordinal(card.lastMock.rank)} of ${card.lastMock.sat.toLocaleString()} nationally` : 'National rank comes out at 9pm'}
            </Caption>
          </View>
        </View>
      ) : null}

      {card?.locked ? (
        <View className="flex-row items-center gap-2 rounded-2xl bg-coral-50 p-3">
          <Ionicons name="pause-circle-outline" size={20} color={palette.coral[700]} />
          <Text className="flex-1 font-body-semibold text-[14px] text-coral-700">Free plan: {child.firstName} gets 10 questions a day. Upgrade for unlimited practice and progress.</Text>
        </View>
      ) : null}

      {card?.nextMock ? <NextMock m={card.nextMock} name={child.firstName} /> : null}

      {quiet ? (
        <View className="flex-row items-center gap-2 rounded-2xl bg-amber-50 p-3">
          <Ionicons name="alert-circle-outline" size={20} color={palette.amber[700]} />
          <Text className="flex-1 font-body-semibold text-[14px] text-amber-800">
            {child.firstName} hasn’t practised yet this week. A quick 10 minutes keeps the streak alive.
          </Text>
        </View>
      ) : null}

      <View className="flex-row items-center justify-end gap-1">
        <Text style={{ color: theme.accent }} className="font-body-bold text-[14px]">
          See progress
        </Text>
        <Ionicons name="chevron-forward" size={16} color={theme.accent} />
      </View>
    </PressableScale>
  );
}

function NextMock({ m, name }: { m: NonNullable<Card['nextMock']>; name: string }) {
  const now = useNow();
  const label = m.title.split(' · ')[0];
  const text =
    m.state === 'OPEN'
      ? m.taken
        ? `${name} has sat this week’s ${label}. Results at 9pm.`
        : `${label} is open now until ${lagosWhen(m.closesAt, false)}. Remind ${name}!`
      : m.state === 'MARKING'
        ? `${label} results come out shortly.`
        : `Next ${label}: ${lagosWhen(m.opensAt)} (in ${countdown(new Date(m.opensAt).getTime() - now)})`;
  return (
    <View className="flex-row items-center gap-2">
      <Ionicons name={m.state === 'OPEN' && !m.taken ? 'radio-button-on' : 'calendar-outline'} size={16} color={m.state === 'OPEN' && !m.taken ? palette.coral[500] : palette.ink[500]} />
      <Caption className={`flex-1 ${m.state === 'OPEN' && !m.taken ? 'font-body-bold text-coral-700' : ''}`}>{text}</Caption>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View accessibilityLabel={`${value} ${label}`} className="flex-1 gap-0.5 rounded-2xl bg-paper p-2.5">
      <Text className="font-display text-[20px] text-ink">{value}</Text>
      <Text className="font-body text-[12px] text-ink-500">{label}</Text>
    </View>
  );
}
