import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Animated, { FadeInRight, ZoomIn } from 'react-native-reanimated';

import { CountUp } from '@/components/game';
import { Avatar, Caption, CardListSkeleton, Display, EmptyState, ErrorState, Label, Screen } from '@/components/ui';
import { isPrimary, useLeague, useStudentHome } from '@/features/student/api';
import { palette, roles } from '@/theme';

const tierName = { BRONZE: 'Bronze', SILVER: 'Silver', GOLD: 'Gold', DIAMOND: 'Diamond' } as const;

export default function Leagues() {
  const home = useStudentHome();
  const { data, isPending, isError, error, refetch, isRefetching } = useLeague();
  const primary = isPrimary(home.data);
  const theme = primary ? roles.studentPrimary : roles.student;
  const league = data?.league;

  return (
    <Screen background={theme.bg} refreshing={isRefetching} onRefresh={refetch} accent={theme.accent} contentClassName={primary ? 'pb-32' : ''}>
      <View className="gap-1">
        <Display className="text-[30px]">{league ? `${tierName[league.tier]} League` : primary ? 'My league' : 'Leagues'}</Display>
        {league ? (
          <Caption className="text-[14px]">
            Top {league.promoteTop} move up on Monday · {league.daysLeft} {league.daysLeft === 1 ? 'day' : 'days'} left
          </Caption>
        ) : null}
      </View>

      {isPending ? (
        <CardListSkeleton count={6} height={64} />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} color={theme.accent} />
      ) : !league || data.standings.length === 0 ? (
        <EmptyState icon="trophy-outline" title="Join this week’s league" message="Finish any quest and you’ll be placed in a league with up to 30 students at your level. Top 5 move up every Monday." />
      ) : (
        <View className="gap-2">
          {data.standings.map((s, i) => {
            const rank = i + 1;
            const medal = rank <= 3 ? [palette.sun[400], '#C9CCD6', '#E3A06B'][rank - 1] : null;
            return (
              <View key={s.studentId}>
                <Animated.View
                  entering={FadeInRight.delay(40 * i)}
                  accessibilityLabel={`${rank}. ${s.name}, ${s.weeklyXp} XP${s.isMe ? ', that is you' : ''}`}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18, backgroundColor: s.isMe ? theme.accentSoft : palette.white, borderWidth: s.isMe ? 2 : 0, borderColor: theme.accent }}
                >
                  <Animated.View
                    entering={medal ? ZoomIn.delay(250 + 120 * i).springify().damping(9) : undefined}
                    style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: medal ?? 'transparent' }}
                    className="items-center justify-center"
                  >
                    <Text className="font-display text-[16px] text-ink">{rank}</Text>
                  </Animated.View>
                  <Avatar initials={s.isMe ? 'ME' : s.name.replace(/[^A-Za-z ]/g, '').split(' ').map((w) => w[0]).join('').slice(0, 2)} size={40} radius={14} />
                  <Label className="flex-1">{s.name}</Label>
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="flash" size={16} color={theme.accent} />
                    {s.isMe ? <CountUp value={s.weeklyXp} delay={400} fontSize={15} color={palette.ink.DEFAULT} /> : <Text className="font-body-extrabold text-[15px] text-ink">{s.weeklyXp.toLocaleString()}</Text>}
                  </View>
                </Animated.View>
                {rank === league.promoteTop && data.standings.length > league.promoteTop ? (
                  <View className="my-2 flex-row items-center gap-2">
                    <View className="h-[2px] flex-1 bg-mint-400" />
                    <Text className="font-body-bold text-[12px] text-mint-700">PROMOTION ZONE</Text>
                    <View className="h-[2px] flex-1 bg-mint-400" />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
