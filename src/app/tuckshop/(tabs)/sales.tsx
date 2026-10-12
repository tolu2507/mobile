import { Alert, Text, View } from 'react-native';

import { toast } from '@/components/reacticx/molecules/Toast';
import { Caption, CardListSkeleton, Display, EmptyState, ErrorState, Label, Pill, PressableScale, Screen } from '@/components/ui';
import { useRefund, useTodaysSales } from '@/features/tuckshop/api';
import { friendlyError } from '@/lib/api';
import { naira } from '@/lib/format';
import { palette, roles } from '@/theme';
import type { ShopSale } from '@/types/api';

const theme = roles.tuckshop;
const time = (iso: string) => new Date(iso).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });

/** Everything this person sold today, newest first. A sale made by mistake can be undone today. */
export default function TodaysSales() {
  const sales = useTodaysSales();
  const refund = useRefund();

  const undo = (s: ShopSale) =>
    Alert.alert(`Undo ${naira(s.amountKobo)} for ${s.studentName}?`, 'The money goes straight back into their wallet.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Undo sale',
        style: 'destructive',
        onPress: () => refund.mutate(s.id, { onSuccess: (r) => toast.success(r.message), onError: (e) => toast.error(friendlyError(e)) }),
      },
    ]);

  return (
    <Screen background={theme.bg} refreshing={sales.isRefetching} onRefresh={sales.refetch} accent={theme.accent}>
      <View style={{ gap: 4 }}>
        <Display className="text-[30px] leading-[34px]">Today</Display>
        <Caption className="text-[15px]">Your sales since midnight. Tap a sale to undo it.</Caption>
      </View>
      {sales.isPending ? (
        <CardListSkeleton count={4} height={68} />
      ) : sales.isError ? (
        <ErrorState error={sales.error} onRetry={sales.refetch} color={theme.accent} />
      ) : (
        <>
          <View style={{ backgroundColor: '#2B1A08', borderRadius: 24, padding: 18, gap: 4 }}>
            <Text className="font-body-semibold text-[13px]" style={{ color: '#FFC98A' }}>
              Total today
            </Text>
            <Text className="font-display text-[32px] text-white">{naira(sales.data.totalKobo)}</Text>
            <Text className="font-body text-[13px]" style={{ color: '#FFE4C7' }}>
              {sales.data.count} {sales.data.count === 1 ? 'sale' : 'sales'}
            </Text>
          </View>
          {sales.data.items.length === 0 ? (
            <EmptyState icon="receipt-outline" title="No sales yet" message="Sales you make at the counter today show up here." />
          ) : (
            <View style={{ gap: 10 }}>
              {sales.data.items.map((s) => (
                <PressableScale
                  key={s.id}
                  disabled={s.refunded || refund.isPending}
                  accessibilityLabel={`${s.studentName}, ${naira(s.amountKobo)} at ${time(s.createdAt)}${s.refunded ? ', undone' : ''}`}
                  accessibilityHint={s.refunded ? undefined : 'Undo this sale'}
                  onPress={() => undo(s)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.white, borderRadius: 20, padding: 14, opacity: s.refunded ? 0.6 : 1 }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Label numberOfLines={1}>{s.studentName}</Label>
                    <Caption numberOfLines={1}>{[time(s.createdAt), s.note].filter(Boolean).join(' · ')}</Caption>
                  </View>
                  {s.refunded ? <Pill label="Undone" tone="sky" /> : null}
                  <Text className="font-display-bold text-[18px]" style={{ color: palette.ink.DEFAULT, textDecorationLine: s.refunded ? 'line-through' : 'none' }}>
                    {naira(s.amountKobo)}
                  </Text>
                </PressableScale>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
