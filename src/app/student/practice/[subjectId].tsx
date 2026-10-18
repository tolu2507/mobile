import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Caption, CardListSkeleton, EmptyState, ErrorState, Label, Pill, PressableScale, ProgressBar, Screen } from '@/components/ui';
import { usePracticeMap } from '@/features/practice/api';
import { isPrimary, useStudentHome } from '@/features/student/api';
import { palette, roles, type RoleTheme } from '@/theme';
import type { PracticeMap, PracticeSubtopic } from '@/types/api';

const EXAM_NAMES: Record<string, string> = { JAMB: 'JAMB', WAEC: 'WAEC', NECO: 'NECO', BECE: 'BECE', COMMON_ENTRANCE: 'Common Entrance' };
const pct = (x: number) => Math.round(x * 100);

/** One subject's map: topics, most tested first, each a path of subtopics climbed from level 1 to the boss round. */
export default function PracticeMapScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const theme = isPrimary(useStudentHome().data) ? roles.studentPrimary : roles.student;
  const map = usePracticeMap(subjectId);

  if (map.isPending)
    return (
      <Screen background={theme.bg}>
        <CardListSkeleton count={5} height={84} />
      </Screen>
    );
  if (map.isError)
    return (
      <Screen background={theme.bg}>
        <ErrorState error={map.error} onRetry={() => void map.refetch()} color={theme.accent} />
      </Screen>
    );

  const m = map.data;
  return (
    <Screen background={theme.bg} header={<Header m={m} theme={theme} />} refreshing={map.isRefetching} onRefresh={() => void map.refetch()} accent={theme.accent} edges={['bottom']}>
      {!m.topics.length ? (
        <EmptyState
          icon="construct-outline"
          title={`${m.subject.name} is on its way`}
          message={`We’re studying ${EXAM_NAMES[m.subject.exam]}’s past papers to build this subject’s topics and questions. It will appear here once it’s ready.`}
        />
      ) : (
        m.topics.map((t, i) => (
          <Animated.View key={t.id} entering={FadeInDown.delay(Math.min(i, 6) * 60)}>
            <View className="gap-3 rounded-[22px] bg-white p-4">
              <View className="gap-1.5">
                <Text className="font-display text-[19px] leading-[23px] text-ink">{t.name}</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {t.hot ? <Pill tone="coral" label={`In every paper we studied`} icon={<Ionicons name="flame" size={13} color={palette.coral[700]} />} /> : null}
                  {t.weight ? <Pill tone="sky" label={`About ${Math.max(1, pct(t.weight))}% of the paper`} /> : null}
                </View>
              </View>
              <View>
                {t.subtopics.map((s, j) => (
                  <Node key={s.id} s={s} last={j === t.subtopics.length - 1} theme={theme} subjectName={m.subject.name} />
                ))}
              </View>
            </View>
          </Animated.View>
        ))
      )}
    </Screen>
  );
}

function Header({ m, theme }: { m: PracticeMap; theme: RoleTheme }) {
  return (
    <View style={{ backgroundColor: theme.accent, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
      <SafeAreaView edges={['top']}>
        <View className="gap-4 px-5 pb-5 pt-3">
          <View className="flex-row items-center gap-3">
            <PressableScale
              accessibilityLabel="Back"
              onPress={() => router.back()}
              style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </PressableScale>
            <View className="flex-1">
              <Text className="font-body-semibold text-[13px] text-white/80">{EXAM_NAMES[m.subject.exam]}</Text>
              <Text className="font-display text-[24px] leading-[28px] text-white">{m.subject.name}</Text>
            </View>
          </View>
          {m.leaves ? (
            <View className="gap-2 rounded-[18px] bg-white/10 p-3.5">
              <View className="flex-row items-baseline justify-between">
                <Text className="font-display text-[18px] text-white">{pct(m.mastery)}% mastered</Text>
                <Text className="font-body-semibold text-[13px] text-white">
                  {m.conquered} of {m.leaves} topics conquered
                </Text>
              </View>
              <ProgressBar value={m.mastery} color={palette.sun[400]} track="rgba(255,255,255,0.22)" height={10} accessibilityLabel="Subject mastery" />
              {m.reviewsDue ? (
                <Text className="font-body text-[13px] text-white/90">
                  {m.reviewsDue} {m.reviewsDue === 1 ? 'question you missed is' : 'questions you missed are'} back for review. They come up in the topic they belong to.
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

/** One stop on the path: locked, in progress (level 1–5), or conquered. */
function Node({ s, last, theme, subjectName }: { s: PracticeSubtopic; last: boolean; theme: RoleTheme; subjectName: string }) {
  const playable = s.unlocked && (s.fresh > 0 || s.answered > 0);
  const status = !s.unlocked
    ? 'Finish level 1 of the topic above to unlock'
    : s.bossBeaten
      ? 'Conquered'
      : s.level === 5
        ? 'Boss round next'
        : `Level ${s.level} of 5`;
  const detail = !s.unlocked ? null : s.fresh ? `${s.fresh} new ${s.fresh === 1 ? 'question' : 'questions'}` : s.answered ? 'Reviews only for now' : 'Questions coming soon';

  const circle = s.bossBeaten ? palette.sun[400] : s.unlocked ? theme.accent : palette.ink[100];
  return (
    <PressableScale
      disabled={!playable}
      accessibilityRole="button"
      accessibilityState={{ disabled: !playable }}
      accessibilityLabel={`${s.name}. ${status}.${detail ? ` ${detail}.` : ''}`}
      onPress={() => router.push({ pathname: '/student/practice/round/[topicId]', params: { topicId: s.id, name: s.name, subject: subjectName } })}
      style={{ flexDirection: 'row', gap: 12, opacity: s.unlocked ? 1 : 0.6 }}
    >
      <View className="items-center" style={{ width: 44 }}>
        <View className="h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: circle }}>
          {s.bossBeaten ? (
            <MaterialCommunityIcons name="crown" size={22} color={palette.ink.DEFAULT} />
          ) : !s.unlocked ? (
            <Ionicons name="lock-closed" size={18} color={palette.ink[300]} />
          ) : s.level === 5 ? (
            <MaterialCommunityIcons name="sword-cross" size={20} color="#FFFFFF" />
          ) : (
            <Text className="font-display text-[17px] text-white">{s.level}</Text>
          )}
        </View>
        {!last ? <View style={{ width: 3, flex: 1, minHeight: 14, backgroundColor: s.unlocked ? theme.accentSoft : palette.ink[100], borderRadius: 2 }} /> : null}
      </View>
      <View className="flex-1 gap-1 pb-4 pt-0.5">
        <Label className="leading-[20px]">{s.name}</Label>
        <Caption>
          {status}
          {detail ? ` · ${detail}` : ''}
        </Caption>
        {s.unlocked && s.answered ? <ProgressBar value={s.mastery} color={s.bossBeaten ? palette.sun[400] : theme.accent} height={6} accessibilityLabel={`${pct(s.mastery)}% mastered`} /> : null}
      </View>
      {playable ? <Ionicons name="play-circle" size={28} color={theme.accent} style={{ marginTop: 6 }} /> : null}
    </PressableScale>
  );
}
