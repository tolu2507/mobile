import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { NumberFlow } from '@/components/reacticx/molecules/number-flow';
import { Banner, Body, Caption, Card, CardListSkeleton, EmptyState, ErrorState, Label, Screen, ScreenHeader, Title } from '@/components/ui';
import { useEarnings } from '@/features/tutor/api';
import { naira } from '@/lib/format';
import { palette, roles } from '@/theme';

const theme = roles.tutor;

export default function Earnings() {
  const { data, isPending, isError, error, refetch, isRefetching } = useEarnings();
  return (
    <Screen background={theme.bg} edges={['top', 'bottom']} accent={theme.accent} refreshing={isRefetching} onRefresh={refetch}>
      <ScreenHeader title="Earnings" />
      {isPending ? (
        <CardListSkeleton count={3} height={110} />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} color={theme.accent} />
      ) : (
        <>
          <View style={{ backgroundColor: '#2A1710', borderRadius: 26, padding: 20, gap: 6 }}>
            <Text className="font-body-semibold text-[14px]" style={{ color: '#FFC7B5' }}>Available</Text>
            <View className="flex-row items-baseline gap-1">
              <Text className="font-display text-[38px] text-white">₦</Text>
              <NumberFlow value={Number(data.balanceKobo) / 100} fontSize={38} color="#FFFFFF" fontWeight="800" />
            </View>
            <Text className="font-body text-[13px]" style={{ color: '#FFE7DF' }}>
              {Number(data.pendingKobo) > 0 ? `+ ${naira(data.pendingKobo)} held for ${data.pendingLessons} ${data.pendingLessons === 1 ? 'lesson' : 'lessons'} until the quiz is done` : 'Nothing waiting in escrow'}
            </Text>
          </View>
          <Banner tone="info" title="Withdrawals" message="Bank withdrawals are being connected. Your balance is safe and will be available to withdraw as soon as they open." />
          <Title>History</Title>
          {data.entries.length === 0 ? (
            <EmptyState icon="cash-outline" title="No payments yet" message="After each paid lesson, the money lands here when your student finishes the lesson quiz." />
          ) : (
            <Card className="p-2">
              {data.entries.map((e, i) => (
                <View key={e.id} className="flex-row items-center gap-3 p-3" style={{ borderTopWidth: i ? 1 : 0, borderTopColor: palette.ink[100] }}>
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-mint-100">
                    <Ionicons name="arrow-down" size={20} color={palette.mint[700]} />
                  </View>
                  <View className="flex-1">
                    <Label numberOfLines={1}>{e.description}</Label>
                    <Caption>{new Date(e.createdAt).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}</Caption>
                  </View>
                  <Body className="font-body-extrabold text-mint-700">+{naira(e.amountKobo)}</Body>
                </View>
              ))}
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
