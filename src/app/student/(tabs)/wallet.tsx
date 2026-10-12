import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { QRCode } from '@/components/reacticx/base/qr-code';
import { NumberFlow } from '@/components/reacticx/molecules/number-flow';
import { Body, Caption, Card, CardListSkeleton, Display, EmptyState, ErrorState, Label, Screen, Title } from '@/components/ui';
import { isPrimary, useBadges, useStudentHome, useStudentWallet } from '@/features/student/api';
import { naira } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { palette, roles } from '@/theme';

/** Secondary students: tuck-shop wallet. Primary pupils: a sticker book instead of money. */
export default function WalletTab() {
  const home = useStudentHome();
  return isPrimary(home.data) ? <StickerBook /> : <StudentWallet />;
}

function StudentWallet() {
  const theme = roles.student;
  const { data, isPending, isError, error, refetch, isRefetching } = useStudentWallet();
  const userId = useAuth((s) => s.user?.id ?? '');

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
            <Text className="font-body text-[13px] text-violet-100">A parent can top up from their Nexus app.</Text>
          </View>

          <Card className="items-center gap-3 py-5">
            <Title>Pay at the tuck shop</Title>
            <Caption className="text-center">Tap the code to make it bigger, then show it to the cashier.</Caption>
            <QRCode backgroundColorFocused={palette.violet[50]}>
              <QRCode.Value value={`nexus:pay:${userId}`} size={180} />
              <QRCode.Label>Show my pay code</QRCode.Label>
            </QRCode>
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

const stickerStyle: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  FIRST_QUEST: { icon: 'rocket', color: palette.violet[400] },
  STREAK_3: { icon: 'flame', color: palette.coral[400] },
  STREAK_7: { icon: 'flame', color: palette.coral[500] },
  STREAK_30: { icon: 'bonfire', color: palette.coral[700] },
  XP_500: { icon: 'star', color: palette.sun[400] },
  XP_2000: { icon: 'school', color: palette.mint[400] },
  FIRST_LESSON_QUIZ: { icon: 'ribbon', color: palette.sky[400] },
  PERFECT_SCORE: { icon: 'trophy', color: palette.sun[600] },
};

function StickerBook() {
  const theme = roles.studentPrimary;
  const { data, isPending, isError, error, refetch, isRefetching } = useBadges();
  const earned = data?.filter((b) => b.earned).length ?? 0;
  return (
    <Screen background={theme.bg} contentClassName="pb-32" refreshing={isRefetching} onRefresh={refetch} accent={theme.accent}>
      <Display className="text-[30px]">My stickers</Display>
      <Caption className="text-[15px]">{data ? `${earned} of ${data.length} collected. Finish quests to get more!` : 'Finish quests to collect them all!'}</Caption>
      {isPending ? (
        <CardListSkeleton count={2} height={130} />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} color={theme.accent} />
      ) : (
        <View className="flex-row flex-wrap gap-3">
          {data.map((b, i) => {
            const st = stickerStyle[b.code] ?? { icon: 'star' as const, color: palette.violet[400] };
            return (
              <Animated.View
                key={b.id}
                entering={ZoomIn.delay(50 * i).springify()}
                accessibilityLabel={`${b.name}: ${b.description}${b.earned ? '' : ', not collected yet'}`}
                style={{ width: '31%', aspectRatio: 0.8, borderRadius: 22, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 6, opacity: b.earned ? 1 : 0.5 }}
              >
                <View style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: b.earned ? st.color : palette.ink[200] }} className="items-center justify-center">
                  <Ionicons name={b.earned ? st.icon : 'lock-closed'} size={28} color="#FFFFFF" />
                </View>
                <Text className="text-center font-body-bold text-[13px] text-ink">{b.name}</Text>
              </Animated.View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
