import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { NumberFlow } from '@/components/reacticx/molecules/number-flow';
import { Body, Caption, Card, CardListSkeleton, Display, EmptyState, ErrorState, GameButton, Label, Screen, Title } from '@/components/ui';
import { isPrimary, useBadges, useStudentHome, useStudentWallet } from '@/features/student/api';
import { StickerBook } from '@/features/student/components/StickerBook';
import { naira } from '@/lib/format';
import { palette, roles } from '@/theme';

/** Secondary students: tuck-shop wallet. Primary pupils: a sticker book instead of money. */
export default function WalletTab() {
  const home = useStudentHome();
  return isPrimary(home.data) ? <StickerTab /> : <StudentWallet />;
}

function StudentWallet() {
  const theme = roles.student;
  const { data, isPending, isError, error, refetch, isRefetching } = useStudentWallet();

  return (
    <Screen background={theme.bg} refreshing={isRefetching} onRefresh={refetch} accent={theme.accent}>
      <Display className="text-[30px]">Wallet</Display>
      {isPending ? (
        <CardListSkeleton count={3} height={120} />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} color={theme.accent} />
      ) : (
        <>
          <View style={{ backgroundColor: palette.ink.DEFAULT, borderRadius: 26, padding: 20, gap: 6 }}>
            <Text className="font-body-semibold text-[14px] text-violet-100">Tuck shop balance</Text>
            <View className="flex-row items-baseline gap-1">
              <Text className="font-display text-[40px] text-sun-400">₦</Text>
              <NumberFlow value={Number(data.balanceKobo) / 100} fontSize={40} color={palette.sun[400]} fontWeight="800" />
            </View>
            <Text className="font-body text-[13px] text-violet-100">A parent can top up from their BrainBox app.</Text>
          </View>

          <Card className="gap-3">
            <Title>Pay at the tuck shop</Title>
            <GameButton label="Pay from my phone" color={theme.accent} shadowColor={theme.shadow} onPress={() => router.push('/student/pay')} icon={<Ionicons name="send" size={18} color={palette.white} />} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.bg, borderRadius: 16, padding: 14 }}>
              <Ionicons name="id-card-outline" size={24} color={theme.accent} />
              <View style={{ flex: 1 }}>
                <Caption>No phone? Tell them your tuck shop ID</Caption>
                <Text className="font-display text-[24px] tracking-wider text-ink" accessibilityLabel={`Your tuck shop ID is ${data.shopCode.split('').join(' ')}`}>
                  {data.shopCode}
                </Text>
              </View>
            </View>
            {data.dailyLimitKobo !== null ? (
              <Caption className="text-center">
                You can spend {naira(Math.max(0, Number(data.dailyLimitKobo) - Number(data.spentTodayKobo)))} more today (your parent set {naira(data.dailyLimitKobo)} a day).
              </Caption>
            ) : null}
          </Card>

          <Title>Recent</Title>
          {data.entries.length === 0 ? (
            <EmptyState icon="receipt-outline" title="Nothing yet" message="Top-ups and tuck-shop purchases will show up here." />
          ) : (
            <Card className="p-2">
              {data.entries.map((e, i) => {
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
                    <Body className={`font-body-extrabold ${credit ? 'text-mint-700' : 'text-ink'}`}>
                      {credit ? '+' : '−'}
                      {naira(Math.abs(Number(e.amountKobo)))}
                    </Body>
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

/** Primary pupils: the sticker book is their tab. */
function StickerTab() {
  const theme = roles.studentPrimary;
  const { refetch, isRefetching } = useBadges();
  return (
    <Screen background={theme.bg} contentClassName="pb-32" refreshing={isRefetching} onRefresh={refetch} accent={theme.accent}>
      <Display className="text-[30px]">My stickers</Display>
      <StickerBook theme={theme} />
    </Screen>
  );
}
