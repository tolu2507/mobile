import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { toast } from '@/components/reacticx/molecules/Toast';
import { Caption, Card, CardListSkeleton, ErrorState, GameButton, Label, Screen, ScreenHeader, Title } from '@/components/ui';
import { startPlanPayment, usePlan } from '@/features/parent/api';
import { usePayment } from '@/features/payments';
import { friendlyError } from '@/lib/api';
import { naira } from '@/lib/format';
import { palette, roles } from '@/theme';
import type { Plan } from '@/types/api';

const theme = roles.parent;
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;

const INCLUDED: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'flash-outline', text: 'Unlimited practice for every child, easy to hard, with explanations' },
  { icon: 'stats-chart-outline', text: 'Progress, strong topics and the topics that need work' },
  { icon: 'sparkles-outline', text: 'The weekly report, with a tip for helping at home' },
  { icon: 'gift-outline', text: 'Earn while you learn: your children’s coins become airtime or data for you' },
  { icon: 'people-outline', text: 'All your children on one plan' },
];

/** The parent's plan: free trial, then one price for 30 days. No automatic charges. */
export default function PlanScreen() {
  const plan = usePlan();
  const pay = usePayment(startPlanPayment, [['parent']]);

  const subscribe = () =>
    pay.mutate(undefined, {
      onSuccess: (status) => {
        if (status === 'SUCCESS') toast.success('Payment received. 30 days added. Thank you!');
        else if (status === 'PENDING') toast.info('Your bank is still processing. Your plan updates when it clears.');
        else if (status === 'FAILED') toast.error('The payment didn’t go through. No money was taken.');
      },
      onError: (e) => toast.error(friendlyError(e)),
    });

  return (
    <Screen background={theme.bg} accent={theme.accent} edges={['top', 'bottom']} refreshing={plan.isRefetching} onRefresh={plan.refetch}>
      <ScreenHeader title="BrainBox plan" />
      {plan.isPending ? (
        <CardListSkeleton count={3} height={130} />
      ) : plan.isError ? (
        <ErrorState error={plan.error} onRetry={plan.refetch} color={theme.accent} />
      ) : (
        <>
          <Status p={plan.data} />

          <Card className="gap-3">
            <Title>What the {naira(plan.data.priceKobo)} plan gives you</Title>
            {INCLUDED.map((i) => (
              <View key={i.text} className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: theme.accentSoft }}>
                  <Ionicons name={i.icon} size={19} color={theme.accent} />
                </View>
                <Text className="flex-1 font-body text-[15px] leading-[21px] text-ink">{i.text}</Text>
              </View>
            ))}
            <View className="flex-row items-center gap-2 rounded-2xl bg-mint-50 p-3">
              <Ionicons name="lock-open-outline" size={19} color={palette.mint[800]} />
              <Text className="flex-1 font-body-semibold text-[14px] leading-[20px] text-mint-800">
                Free plan, always: the Friday mock with its national ranking, {plan.data.freeDailyQuestions} practice questions a day, and stickers.
              </Text>
            </View>
          </Card>

          {plan.data.state === 'NO_CHILDREN' ? (
            <GameButton label="Add a child" color={theme.accent} shadowColor={theme.shadow} onPress={() => router.push('/parent/children/new')} />
          ) : (
            <Card className="gap-3">
              <View className="flex-row items-baseline justify-between gap-2">
                <Title>{naira(plan.data.priceKobo)}</Title>
                <Caption>for {plan.data.planDays} days, all your children</Caption>
              </View>
              <GameButton
                label={plan.data.state === 'FREE' ? `Upgrade for ${naira(plan.data.priceKobo)}` : plan.data.state === 'ACTIVE' ? `Add ${plan.data.planDays} more days` : `Pay ${naira(plan.data.priceKobo)} now`}
                color={theme.accent}
                shadowColor={theme.shadow}
                loading={pay.isPending}
                onPress={subscribe}
                icon={<Ionicons name="lock-closed" size={16} color="#FFFFFF" />}
              />
              <Caption className="text-center">
                {plan.data.state === 'TRIAL' ? 'Paying now keeps the trial days you have left. ' : ''}
                Card, transfer or USSD through Squad (GTBank). We never charge you automatically: you pay each month when you’re ready.
              </Caption>
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}

function Status({ p }: { p: Plan }) {
  const [label, headline, detail] =
    p.state === 'NO_CHILDREN'
      ? ['Free trial', `${p.trialDays} days free`, 'Your free trial starts when you add your first child.']
      : p.state === 'TRIAL'
        ? ['Free trial', `${days(p.daysLeft)} left`, `Your free trial ends on ${day(p.accessUntil)}.`]
        : p.state === 'ACTIVE'
          ? ['Active', `${days(p.daysLeft)} left`, `Paid until ${day(p.accessUntil)}.`]
          : ['Free plan', 'You’re on the free plan', `${p.freeDailyQuestions} practice questions a day for each child, and the Friday mock. Upgrade for unlimited practice, weekly reports and rewards. Nothing is deleted.`];
  const paused = p.state === 'FREE';
  return (
    <View style={{ backgroundColor: paused ? '#3A1A12' : '#12302B', borderRadius: 26, padding: 20, gap: 6 }}>
      <View className="flex-row items-center gap-2">
        <Ionicons name={paused ? 'pause-circle' : p.state === 'ACTIVE' ? 'checkmark-circle' : 'time-outline'} size={18} color={paused ? '#FFB59E' : '#9FE3D2'} />
        <Label style={{ color: paused ? '#FFB59E' : '#9FE3D2' }}>{label}</Label>
      </View>
      <Text className="font-display text-[30px] text-white">{headline}</Text>
      <Text className="font-body text-[14px] leading-[20px]" style={{ color: paused ? '#FFD9CC' : '#C6E9E0' }}>
        {detail}
      </Text>
    </View>
  );
}
