import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { NumberFlow } from '@/components/reacticx/molecules/number-flow';
import { toast } from '@/components/reacticx/molecules/Toast';
import { Body, Caption, Card, CardListSkeleton, Display, EmptyState, ErrorState, GameButton, Label, PressableScale, Screen, Title } from '@/components/ui';
import { startTopup, useChildWallet, useChildren } from '@/features/parent/api';
import { ChildSwitcher, useCurrentChild } from '@/features/parent/components/ChildSwitcher';
import { SchoolFees } from '@/features/parent/components/SchoolFees';
import { usePayment } from '@/features/payments';
import { friendlyError } from '@/lib/api';
import { naira } from '@/lib/format';
import { palette, roles } from '@/theme';

const theme = roles.parent;
const amounts = [100000, 200000, 500000, 1000000]; // kobo

export default function ParentWallet() {
  const children = useChildren();
  const child = useCurrentChild();
  const wallet = useChildWallet(child?.id);
  const [amount, setAmount] = useState(amounts[1]);
  const pay = usePayment(startTopup(child?.id ?? '', amount), [['parent', 'wallet', child?.id]]);

  const topup = () =>
    pay.mutate(undefined, {
      onSuccess: (status) => {
        if (status === 'SUCCESS') toast.success(`${naira(amount)} added to ${child?.firstName}’s wallet`);
        else if (status === 'PENDING') toast.info('Your bank is still processing. The balance updates when it clears.');
        else if (status === 'FAILED') toast.error('The payment didn’t go through. No money was taken.');
      },
      onError: (e) => toast.error(friendlyError(e)),
    });

  if (children.data && children.data.length === 0) {
    return (
      <Screen background={theme.bg}>
        <Display className="text-[26px]">Wallet</Display>
        <EmptyState icon="wallet-outline" title="Add a child first" message="Each child gets a tuck-shop wallet you can top up." action={<GameButton label="Add a child" color={theme.accent} shadowColor={theme.shadow} className="mt-2 self-stretch" onPress={() => router.push('/parent/children/new')} />} />
      </Screen>
    );
  }

  return (
    <Screen background={theme.bg} accent={theme.accent} refreshing={wallet.isRefetching} onRefresh={wallet.refetch}>
      <Display className="text-[26px]">Wallet</Display>
      <ChildSwitcher />
      {child ? <SchoolFees studentId={child.id} childName={child.firstName} /> : null}

      {wallet.isPending ? (
        <CardListSkeleton count={2} height={140} />
      ) : wallet.isError ? (
        <ErrorState error={wallet.error} onRetry={wallet.refetch} color={theme.accent} />
      ) : (
        <>
          <View style={{ backgroundColor: '#12302B', borderRadius: 26, padding: 20, gap: 6 }}>
            <Text className="font-body-semibold text-[14px]" style={{ color: '#9FE3D2' }}>{child?.firstName}’s tuck-shop wallet</Text>
            <View className="flex-row items-baseline gap-1">
              <Text className="font-display text-[38px] text-white">₦</Text>
              <NumberFlow value={Number(wallet.data.balanceKobo) / 100} fontSize={38} color="#FFFFFF" fontWeight="800" />
            </View>
            <Text className="font-body text-[13px]" style={{ color: '#C6E9E0' }}>{child?.firstName} pays by showing the QR code in their app.</Text>
          </View>

          <Card className="gap-4">
            <Title>Top up</Title>
            <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
              {amounts.map((a) => {
                const active = a === amount;
                return (
                  <PressableScale
                    key={a}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                    onPress={() => setAmount(a)}
                    style={{ flexGrow: 1, minWidth: '22%', height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? theme.accentSoft : '#FFFFFF', borderWidth: 2, borderColor: active ? theme.accent : palette.ink[200] }}
                  >
                    <Text style={{ color: active ? palette.mint[800] : palette.ink.DEFAULT }} className="font-body-bold text-[15px]">{naira(a)}</Text>
                  </PressableScale>
                );
              })}
            </View>
            <GameButton label={`Top up ${naira(amount)}`} color={theme.accent} shadowColor={theme.shadow} loading={pay.isPending} onPress={topup} icon={<Ionicons name="lock-closed" size={16} color="#FFFFFF" />} />
            <Caption className="text-center">Card, transfer or USSD through Squad (GTBank). Your receipt goes to your email.</Caption>
          </Card>

          <Title>History</Title>
          {wallet.data.entries.length === 0 ? (
            <EmptyState icon="receipt-outline" title="No activity yet" message="Top-ups and tuck-shop purchases will show here." />
          ) : (
            <Card className="p-2">
              {wallet.data.entries.map((e, i) => {
                const credit = Number(e.amountKobo) > 0;
                return (
                  <View key={e.id} className="flex-row items-center gap-3 p-3" style={{ borderTopWidth: i ? 1 : 0, borderTopColor: palette.ink[100] }}>
                    <View className={`h-10 w-10 items-center justify-center rounded-xl ${credit ? 'bg-mint-100' : 'bg-coral-100'}`}>
                      <Ionicons name={credit ? 'arrow-down' : 'cart-outline'} size={20} color={credit ? palette.mint[700] : palette.coral[700]} />
                    </View>
                    <View className="flex-1">
                      <Label numberOfLines={1}>{e.description}</Label>
                      <Caption>{new Date(e.createdAt).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}</Caption>
                    </View>
                    <Body className={`font-body-extrabold ${credit ? 'text-mint-700' : 'text-ink'}`}>{credit ? '+' : '−'}{naira(Math.abs(Number(e.amountKobo)))}</Body>
                  </View>
                );
              })}
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
