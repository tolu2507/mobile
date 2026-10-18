import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner, Body, Caption, CardListSkeleton, Display, ErrorState, GameButton, Label, PressableScale, ScreenHeader, TextField } from '@/components/ui';
import { useStudentWallet } from '@/features/student/api';
import { Keypad } from '@/features/tuckshop/Keypad';
import { newRequestId, usePayableSchools, usePhonePay } from '@/features/tuckshop/api';
import { friendlyError } from '@/lib/api';
import { naira } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { palette, roles } from '@/theme';
import type { PayableSchool, PhoneReceipt } from '@/types/api';
import { confirm } from '@/lib/confirm';

const theme = roles.student;
const QUICK = [100, 200, 500, 1000];

/**
 * Paying the tuck shop from your own phone: type the amount, send. It goes to your school
 * (or a school you pick if you're not in one on Nexus). The staff see it arrive on their phone.
 */
export default function PayTuckShop() {
  const wallet = useStudentWallet();
  const pay = usePhonePay();
  const [amount, setAmount] = useState('');
  const [picked, setPicked] = useState<PayableSchool | null>(null);
  const [receipt, setReceipt] = useState<PhoneReceipt | null>(null);
  // One id per payment: if the reply is lost and the child taps again, they aren't charged twice.
  const [requestId] = useState(newRequestId);

  if (receipt) return <Paid receipt={receipt} />;

  const ownSchool = wallet.data?.school ?? null;
  const school = ownSchool ?? picked;
  const nairaAmount = Number(amount || '0');
  const leftToday = wallet.data?.dailyLimitKobo != null ? Math.max(0, Number(wallet.data.dailyLimitKobo) - Number(wallet.data.spentTodayKobo)) : null;
  const tooSmall = !!amount && nairaAmount < 50;
  const overBalance = !!wallet.data && nairaAmount * 100 > Number(wallet.data.balanceKobo);
  const overLimit = leftToday !== null && nairaAmount * 100 > leftToday;
  const problem = tooSmall ? 'The smallest payment is ₦50.' : overBalance ? 'That’s more than you have.' : overLimit ? `You can spend ${naira(leftToday!)} more today.` : undefined;

  const send = async () => {
    if (!(await confirm({ title: `Pay ₦${nairaAmount.toLocaleString('en-NG')}?`, message: `To the ${school!.name} tuck shop.`, confirmLabel: 'Pay' }))) return;
    pay.mutate(
            { amountKobo: nairaAmount * 100, schoolId: ownSchool ? undefined : school!.id, requestId },
            {
              onSuccess: (r) => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                setReceipt(r);
              },
              onError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {}),
            },
          );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}>
          <ScreenHeader title="Pay the tuck shop" subtitle={school ? `To ${school.name}` : 'Pick your school first'} />
          {wallet.isPending ? (
            <CardListSkeleton count={2} height={90} />
          ) : wallet.isError ? (
            <ErrorState error={wallet.error} onRetry={wallet.refetch} color={theme.accent} />
          ) : !school ? (
            <SchoolPicker onPick={setPicked} />
          ) : (
            <>
              {!ownSchool ? (
                <PressableScale accessibilityLabel="Change school" onPress={() => setPicked(null)} style={{ alignSelf: 'flex-start' }}>
                  <Text className="font-body-bold text-[14px]" style={{ color: theme.accent }}>
                    Change school
                  </Text>
                </PressableScale>
              ) : null}
              <View style={{ alignItems: 'center', gap: 2 }}>
                <Text accessibilityLabel={`${nairaAmount} naira`} className="font-display text-[52px] leading-[60px]" style={{ color: amount ? palette.ink.DEFAULT : palette.ink[300] }}>
                  ₦{nairaAmount.toLocaleString('en-NG')}
                </Text>
                <Caption>
                  You have {naira(wallet.data.balanceKobo)}
                  {leftToday !== null ? ` · ${naira(leftToday)} left to spend today` : ''}
                </Caption>
                {problem ? <Text className="font-body-semibold text-[13px] text-coral-700">{problem}</Text> : null}
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {QUICK.map((q) => (
                  <PressableScale
                    key={q}
                    accessibilityLabel={`${q} naira`}
                    onPress={() => setAmount(String(q))}
                    style={{ flex: 1, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accentSoft }}
                  >
                    <Text className="font-body-extrabold text-[15px]" style={{ color: theme.shadow }}>
                      ₦{q.toLocaleString('en-NG')}
                    </Text>
                  </PressableScale>
                ))}
              </View>
              <Keypad extra="00" onKey={(k) => setAmount((a) => (k === 'back' ? a.slice(0, -1) : `${a}${k}`.replace(/^0+/, '').slice(0, 5)))} />
              {pay.isError ? <Banner tone="error" message={friendlyError(pay.error)} /> : null}
              <GameButton
                label={amount && !problem ? `Pay ₦${nairaAmount.toLocaleString('en-NG')}` : 'Pay'}
                color={theme.accent}
                shadowColor={theme.shadow}
                disabled={!amount || !!problem}
                loading={pay.isPending}
                onPress={send}
                icon={<Ionicons name="send" size={18} color={palette.white} />}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Only for children who aren't in a school on Nexus. */
function SchoolPicker({ onPick }: { onPick: (s: PayableSchool) => void }) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  const schools = usePayableSchools(query, true);
  return (
    <View style={{ gap: 12 }}>
      <TextField label="Which school’s tuck shop?" placeholder={['School name', 'Bright Future']} value={search} onChangeText={setSearch} accent={theme.accent} />
      {schools.isPending ? (
        <CardListSkeleton count={3} height={60} />
      ) : schools.isError ? (
        <ErrorState error={schools.error} onRetry={schools.refetch} color={theme.accent} />
      ) : schools.data.length === 0 ? (
        <Caption className="text-center">No school with that name is on Nexus yet.</Caption>
      ) : (
        schools.data.map((s) => (
          <PressableScale key={s.id} accessibilityLabel={`Pay ${s.name}`} onPress={() => onPick(s)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.white, borderRadius: 18, padding: 14 }}>
            <Ionicons name="school-outline" size={22} color={theme.accent} />
            <View style={{ flex: 1 }}>
              <Label numberOfLines={1}>{s.name}</Label>
              {s.state ? <Caption>{s.state}</Caption> : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={palette.ink[300]} />
          </PressableScale>
        ))
      )}
    </View>
  );
}

/**
 * Shown to the tuck-shop staff. The ticking clock and pulsing tick make an old screenshot easy to
 * spot, and the payment also appears on the staff's own Today list.
 */
function Paid({ receipt }: { receipt: PhoneReceipt }) {
  const now = useNow(1000);
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.set(withRepeat(withTiming(1.08, { duration: 700 }), -1, true));
  }, [pulse]);
  const tick = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const clock = new Date(now).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
  const paidAt = new Date(receipt.createdAt).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.mint[600] }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 24, justifyContent: 'space-between' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Animated.View entering={ZoomIn.springify().damping(12)}>
            <Animated.View style={tick}>
              <View style={{ width: 96, height: 96, borderRadius: 999, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark" size={60} color={palette.mint[600]} />
              </View>
            </Animated.View>
          </Animated.View>
          <Display className="mt-2 text-center text-[34px] leading-[40px]" style={{ color: palette.white }}>
            Paid {naira(receipt.amountKobo)}
          </Display>
          <Body className="text-center text-[17px]" style={{ color: palette.white }}>
            {receipt.studentName} · {receipt.schoolName}
          </Body>
          <Body className="text-center text-[15px]" style={{ color: palette.mint[50] }}>
            Paid at {paidAt}. Show this screen at the tuck shop.
          </Body>
          <Text className="font-display text-[28px]" style={{ color: palette.white }} accessibilityLabel={`Time now ${clock}`}>
            {clock}
          </Text>
          <Caption className="text-center" style={{ color: palette.mint[50] }}>
            You have {naira(receipt.balanceKobo)} left.
          </Caption>
        </View>
        <GameButton label="Done" variant="white" color={palette.mint[700]} size="xl" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}
