import { router } from 'expo-router';

import { Banner } from '@/components/ui';
import { naira } from '@/lib/format';
import { useParentRewards, usePlan } from '../api';

const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`;
const openPlan = () => router.push('/parent/plan');

/** On the parent home, when children have earned something: what's waiting, and where to collect it. */
export function RewardsBanner() {
  const { data: r } = useParentRewards();
  if (!r || Number(r.balanceKobo) < Number(r.rewardKobo)) return null;
  return (
    <Banner
      tone="success"
      title={`Your children earned you ${naira(r.balanceKobo)}!`}
      message={r.canCollect ? 'Collect it as airtime or data for any Nigerian number.' : 'It’s safe in your rewards. Collecting is part of the ₦1,500 plan.'}
      action={{ label: r.canCollect ? 'Collect' : 'See rewards', onPress: () => router.push('/parent/rewards') }}
    />
  );
}

/** On the parent home: the trial countdown, a heads-up before the plan ends, and what to do once it has. */
export function PlanBanner() {
  const { data: p } = usePlan();
  if (!p || p.state === 'NO_CHILDREN') return null;
  const price = naira(p.priceKobo);

  if (p.state === 'FREE') {
    return (
      <Banner
        tone="tip"
        title="You’re on the free plan"
        message={`${p.freeDailyQuestions} questions a day, no reports, no rewards. ${price} gives every child unlimited practice for ${p.planDays} days, and their coins start earning you airtime or data.`}
        action={{ label: `Upgrade for ${price}`, onPress: openPlan }}
      />
    );
  }
  if (p.state === 'TRIAL') {
    return (
      <Banner
        tone={p.daysLeft <= 7 ? 'tip' : 'info'}
        title={`Free trial: ${days(p.daysLeft)} left`}
        message={`After that it’s ${price} for ${p.planDays} days, for all your children.`}
        action={{ label: 'See plan', onPress: openPlan }}
      />
    );
  }
  if (p.daysLeft <= 3) {
    return <Banner tone="tip" title={`Your plan ends in ${days(p.daysLeft)}`} message={`Add ${p.planDays} more days for ${price} so practice doesn’t stop.`} action={{ label: 'Renew', onPress: openPlan }} />;
  }
  return null;
}
