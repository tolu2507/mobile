import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { toast } from '@/components/reacticx/molecules/Toast';
import { Body, Caption, Card, CardListSkeleton, ChipGroup, EmptyState, ErrorState, GameButton, Label, PressableScale, ProgressBar, Screen, ScreenHeader, TextField, Title } from '@/components/ui';
import { useDataPlans, useParentRewards, useRedeem } from '@/features/parent/api';
import { Coin } from '@/features/student/components/Sticker';
import { friendlyError } from '@/lib/api';
import { naira } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { palette, roles } from '@/theme';
import type { ParentRewards, Redemption } from '@/types/api';

const theme = roles.parent;
const STATUS: Record<Redemption['status'], { label: string; color: string }> = {
  SENDING: { label: 'Sending', color: palette.sky[600] },
  PENDING: { label: 'On its way', color: palette.sky[600] },
  SUCCESS: { label: 'Sent', color: palette.mint[700] },
  FAILED: { label: 'Didn’t go through, money returned', color: palette.coral[700] },
  CHECK: { label: 'Confirming with the network', color: palette.amber[700] },
};

/** Earn while you learn, the parent's side: what the children earned, and sending it as airtime or data. */
export default function RewardsScreen() {
  const q = useParentRewards();
  return (
    <Screen background={theme.bg} accent={theme.accent} edges={['top', 'bottom']} refreshing={q.isRefetching} onRefresh={q.refetch}>
      <ScreenHeader title="Rewards" />
      {q.isPending ? (
        <CardListSkeleton count={3} height={130} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={q.refetch} color={theme.accent} />
      ) : (
        <>
          <Balance r={q.data} />
          {q.data.children.length ? <Children r={q.data} /> : null}
          {q.data.canCollect ? (
            Number(q.data.balanceKobo) >= Number(q.data.rewardKobo) ? (
              <Collect r={q.data} />
            ) : null
          ) : (
            <GameButton label={q.data.planState === 'TRIAL' ? 'Subscribe to collect' : 'Upgrade to start earning'} color={theme.accent} shadowColor={theme.shadow} onPress={() => router.push('/parent/plan')} />
          )}
          <HowItWorks r={q.data} />
          <History r={q.data} />
        </>
      )}
    </Screen>
  );
}

function Balance({ r }: { r: ParentRewards }) {
  const message = r.canCollect
    ? 'Send it as airtime or data to any Nigerian number.'
    : r.earning
      ? 'Your children are earning. Collecting is part of the ₦1,500 plan, and everything they earn stays here until then.'
      : 'On the free plan your children don’t earn coins. Upgrade and every new question they get right starts earning.';
  return (
    <View style={{ backgroundColor: '#2B1D00', borderRadius: 26, padding: 20, gap: 6 }}>
      <View className="flex-row items-center gap-2">
        <Coin size={20} />
        <Text className="font-body-semibold text-[14px]" style={{ color: '#FFE7A3' }}>
          Earned by your children
        </Text>
      </View>
      <Text className="font-display text-[38px]" style={{ color: palette.sun[400] }}>
        {naira(r.balanceKobo)}
      </Text>
      <Text className="font-body text-[14px] leading-[20px]" style={{ color: '#FFE7A3' }}>
        {message}
      </Text>
    </View>
  );
}

function Children({ r }: { r: ParentRewards }) {
  return (
    <Card className="gap-3">
      <Title>Towards the next {naira(r.rewardKobo)}</Title>
      {r.children.map((c) => (
        <View key={c.studentId} className="gap-1.5">
          <View className="flex-row items-baseline justify-between gap-2">
            <Label className="flex-1">{c.firstName}</Label>
            <Caption>
              {c.coins.toLocaleString()} / {r.coinsPerReward.toLocaleString()} coins
            </Caption>
          </View>
          <ProgressBar value={c.coins / r.coinsPerReward} color={palette.sun[600]} height={8} accessibilityLabel={`${c.firstName}: ${c.coins} of ${r.coinsPerReward} coins`} />
          {Number(c.earnedKobo) > 0 ? <Caption>{c.firstName} has earned you {naira(c.earnedKobo)} so far.</Caption> : null}
        </View>
      ))}
    </Card>
  );
}

function Collect({ r }: { r: ParentRewards }) {
  const myPhone = useAuth((s) => s.user?.phone) ?? '';
  const [kind, setKind] = useState<'AIRTIME' | 'DATA'>('AIRTIME');
  const [network, setNetwork] = useState('MTN');
  const [phone, setPhone] = useState(myPhone);
  const balance = Number(r.balanceKobo);
  const amounts = r.airtimeOptionsKobo.filter((a) => Number(a) <= balance);
  const [amount, setAmount] = useState(amounts[amounts.length - 1] ?? '');
  const plans = useDataPlans(kind === 'DATA' ? network : null);
  const affordable = (plans.data ?? []).filter((p) => Number(p.priceKobo) <= balance);
  const [planCode, setPlanCode] = useState<string | null>(null);
  const plan = affordable.find((p) => p.planCode === planCode);
  const redeem = useRedeem();

  const ready = phone.replace(/\D/g, '').length >= 11 && (kind === 'AIRTIME' ? !!amount : !!plan);
  const label = kind === 'AIRTIME' ? `Send ${amount ? naira(amount) : ''} airtime` : plan ? `Send ${plan.name}` : 'Pick a data plan';

  const send = () =>
    redeem.mutate(
      { kind, network, phone, ...(kind === 'AIRTIME' ? { amountKobo: amount } : { planCode: planCode! }) },
      {
        onSuccess: (res) => {
          if (res.status === 'SUCCESS') toast.success(`Sent to ${res.phone}!`);
          else if (res.status === 'PENDING') toast.info('On its way. It usually arrives in a minute or two.');
          else if (res.status === 'CHECK') toast.info('We’re confirming with the network and will let you know.');
          else toast.error('It didn’t go through, and your money is back in your rewards. Check the number and network.');
        },
        onError: (e) => toast.error(friendlyError(e)),
      },
    );

  return (
    <Card className="gap-4">
      <Title>Collect</Title>
      <ChipGroup label="Send as" options={[{ value: 'AIRTIME', label: 'Airtime' }, { value: 'DATA', label: 'Data' }]} value={kind} onChange={setKind} accent={theme.accent} />
      <ChipGroup label="Network" options={r.networks.map((n) => ({ value: n, label: n === '9MOBILE' ? '9mobile' : n === 'AIRTEL' ? 'Airtel' : n === 'GLO' ? 'Glo' : n }))} value={network} onChange={(n) => { setNetwork(n); setPlanCode(null); }} accent={theme.accent} />
      <TextField label="Phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="08031234567" accent={theme.accent} maxLength={14} />
      {kind === 'AIRTIME' ? (
        <ChipGroup label="Amount" options={amounts.map((a) => ({ value: a, label: naira(a) }))} value={amount} onChange={setAmount} accent={theme.accent} />
      ) : plans.isPending ? (
        <CardListSkeleton count={2} height={48} />
      ) : plans.isError ? (
        <ErrorState error={plans.error} onRetry={plans.refetch} color={theme.accent} />
      ) : affordable.length ? (
        <View accessibilityRole="radiogroup" className="gap-2">
          <Text className="font-body-bold text-[14px] text-ink">Data plan</Text>
          {affordable.map((p) => {
            const on = p.planCode === planCode;
            return (
              <PressableScale
                key={p.planCode}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setPlanCode(p.planCode)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14, borderWidth: 2, borderColor: on ? theme.accent : palette.ink[200], backgroundColor: on ? theme.accentSoft : '#FFFFFF' }}
              >
                <Body className="flex-1">{p.name}</Body>
                <Text className="font-body-bold text-[15px] text-ink">{naira(p.priceKobo)}</Text>
              </PressableScale>
            );
          })}
        </View>
      ) : (
        <Caption>No {network} data plans fit your balance yet. Try airtime, or wait until your children earn a bit more.</Caption>
      )}
      <GameButton label={label} color={theme.accent} shadowColor={theme.shadow} disabled={!ready} loading={redeem.isPending} onPress={send} icon={<Ionicons name="send" size={16} color="#FFFFFF" />} />
      <Caption className="text-center">Sent through Squad (GTBank). Check the number and network: we can’t take airtime back once it’s sent.</Caption>
    </Card>
  );
}

function HowItWorks({ r }: { r: ParentRewards }) {
  return (
    <Card className="gap-2">
      <Title>How your children earn</Title>
      {[
        '10 coins for every new question they get right (up to 100 a day)',
        '200 coins for each Friday mock they finish',
        '200 to 5,000 coins for each sticker: the harder it is, the more it’s worth',
        `Every ${r.coinsPerReward.toLocaleString()} coins becomes ${naira(r.rewardKobo)} here, automatically`,
      ].map((t) => (
        <View key={t} className="flex-row gap-2">
          <Coin size={16} />
          <Caption className="flex-1 text-[14px] leading-[20px] text-ink-700">{t}</Caption>
        </View>
      ))}
    </Card>
  );
}

function History({ r }: { r: ParentRewards }) {
  const sending = r.redemptions.filter((x) => x.status !== 'SUCCESS' && x.status !== 'FAILED');
  return (
    <View className="gap-3">
      <Title>History</Title>
      {sending.map((x) => (
        <View key={x.id} className="flex-row items-center gap-2 rounded-2xl bg-sky-100 p-3">
          <Ionicons name="time-outline" size={18} color={STATUS[x.status].color} />
          <Caption className="flex-1 text-[14px] text-ink">
            {x.kind === 'AIRTIME' ? `${naira(x.amountKobo)} airtime` : x.planName} to {x.phone}: {STATUS[x.status].label.toLowerCase()}
          </Caption>
        </View>
      ))}
      {r.activity.length === 0 ? (
        <EmptyState icon="gift-outline" title="Nothing yet" message="When your children’s coins turn into money, it shows here." />
      ) : (
        <Card className="p-2">
          {r.activity.map((e, i) => {
            const credit = Number(e.amountKobo) > 0;
            return (
              <View key={e.id} className="flex-row items-center gap-3 p-3" style={{ borderTopWidth: i ? 1 : 0, borderTopColor: palette.ink[100] }}>
                <View className={`h-10 w-10 items-center justify-center rounded-xl ${credit ? 'bg-sun-100' : 'bg-mint-50'}`}>
                  <Ionicons name={credit ? 'star' : 'phone-portrait-outline'} size={19} color={credit ? palette.sun[800] : palette.mint[700]} />
                </View>
                <View className="flex-1">
                  <Label numberOfLines={2}>{e.description}</Label>
                  <Caption>{new Date(e.createdAt).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}</Caption>
                </View>
                <Body className={`font-body-extrabold ${credit ? 'text-sun-800' : 'text-ink'}`}>
                  {credit ? '+' : '−'}
                  {naira(Math.abs(Number(e.amountKobo)))}
                </Body>
              </View>
            );
          })}
        </Card>
      )}
    </View>
  );
}
