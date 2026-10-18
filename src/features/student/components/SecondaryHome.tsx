import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CountUp, Flame, Pulse } from '@/components/game';
import { Caption, GameButton, Label, PressableScale, ProgressBar, Screen, Title } from '@/components/ui';
import { ExamPrepCard } from '@/features/exams/components/ExamPrepCard';
import { greeting } from '@/lib/format';
import { palette, roles } from '@/theme';
import type { Quest, StudentHome } from '@/types/api';
import { QuestCard } from './QuestCard';

const theme = roles.student;
const tierNames = { BRONZE: 'Bronze', SILVER: 'Silver', GOLD: 'Gold', DIAMOND: 'Diamond' } as const;

export function SecondaryHome({ home, refreshing, onRefresh }: { home: StudentHome; refreshing: boolean; onRefresh: () => void }) {
  const { xp, league } = home;
  const nextQuest = home.quests.find((q) => q.progress < 1);
  const openQuest = (q: Quest) => router.push({ pathname: '/student/play/[kind]/[id]', params: { kind: q.kind, id: q.id } });

  const header = (
    <View style={{ backgroundColor: theme.accent, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
      <SafeAreaView edges={['top']}>
        <View className="gap-5 px-5 pb-6 pt-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-sun-400">
                <Text className="font-display text-[20px] text-ink">{home.firstName[0]}</Text>
              </View>
              <View>
                <Text className="font-body text-[13px] text-violet-100">{greeting()}</Text>
                <Text className="font-display-bold text-[20px] text-white">{home.firstName}</Text>
              </View>
            </View>
            <View className="flex-row gap-2">
              <View accessibilityLabel={`${home.streak} day streak`} className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-2">
                <Flame size={18} alive={home.streak > 0} />
                <CountUp value={home.streak} fontSize={14} color="#FFFFFF" fontWeight="700" />
              </View>
            </View>
          </View>

          <View className="gap-2.5 rounded-[20px] bg-white/10 p-4">
            <View className="flex-row items-baseline justify-between">
              <Text className="font-display text-[22px] text-white">
                Level {xp.level} · {xp.title}
              </Text>
              <View className="flex-row items-baseline">
                <CountUp value={xp.current} from={xp.levelStart} fontSize={13} color="#FFFFFF" fontWeight="600" />
                <Text className="font-body-semibold text-[13px] text-white"> / {xp.next.toLocaleString()} XP</Text>
              </View>
            </View>
            <ProgressBar value={(xp.current - xp.levelStart) / (xp.next - xp.levelStart)} color={palette.sun[400]} track="rgba(255,255,255,0.22)" height={12} accessibilityLabel="Progress to next level" />
            <Text className="font-body text-[13px] text-violet-100">{(xp.next - xp.current).toLocaleString()} XP to level {xp.level + 1}</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );

  return (
    <Screen background={theme.bg} header={header} refreshing={refreshing} onRefresh={onRefresh} accent={theme.accent}>
      <ExamPrepCard level={home.level} grade={home.gradeName} theme={theme} />

      {league ? (
      <PressableScale
        onPress={() => router.push('/student/leagues')}
        accessibilityLabel={`${tierNames[league.tier]} League, rank ${league.rank} of ${league.size}`}
        style={{ backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
      >
        <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-sun-100">
          <Ionicons name="trophy" size={26} color={palette.sun[800]} />
        </View>
        <View className="flex-1 gap-0.5">
          <Label>
            {tierNames[league.tier]} League · #{league.rank} of {league.size}
          </Label>
          <Caption>
            Top {league.promoteTop} move up on Sunday. {league.daysLeft} {league.daysLeft === 1 ? 'day' : 'days'} left.
          </Caption>
        </View>
        <Ionicons name="chevron-forward" size={20} color={palette.ink[300]} />
      </PressableScale>
      ) : (
        <View className="flex-row items-center gap-3 rounded-[22px] bg-white p-4">
          <Ionicons name="trophy-outline" size={24} color={palette.sun[800]} />
          <Caption className="flex-1 text-[14px]">Finish a quest to join this week’s league.</Caption>
        </View>
      )}

      <Title className="font-display text-[22px]">Today’s quests</Title>

      <View className="gap-3">
        {home.quests.map((q, i) => (
          <QuestCard key={q.id} quest={q} index={i} onPress={() => openQuest(q)} />
        ))}
      </View>

      {nextQuest ? (
        <Pulse scale={1.03}>
          <GameButton label="Continue quest" variant="sun" icon={<Ionicons name="play" size={18} color={palette.ink.DEFAULT} />} onPress={() => openQuest(nextQuest)} />
        </Pulse>
      ) : (
        <View className="items-center gap-1 rounded-[20px] bg-mint-50 p-4">
          <Label className="text-mint-800">All quests done today!</Label>
          <Caption className="text-mint-800">Come back tomorrow to keep your streak.</Caption>
        </View>
      )}
    </Screen>
  );
}
