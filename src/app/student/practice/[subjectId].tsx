import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pulse } from '@/components/game';
import { CardListSkeleton, EmptyState, ErrorState, Pill, PressableScale, ProgressBar, Screen } from '@/components/ui';
import { usePracticeMap } from '@/features/practice/api';
import { NurseryMap } from '@/features/practice/components/NurseryMap';
import { VoiceToggle } from '@/features/practice/components/NurseryRound';
import { isPrimary, useStudentHome } from '@/features/student/api';
import { WorldIsland } from '@/features/worlds/WorldIsland';
import { worldFor, type World } from '@/features/worlds/worlds';
import { palette, roles } from '@/theme';
import type { PracticeMap, PracticeSubtopic } from '@/types/api';
import { goBack } from '@/lib/nav';

const EXAM_NAMES: Record<string, string> = { JAMB: 'JAMB', WAEC: 'WAEC', NECO: 'NECO', BECE: 'BECE', COMMON_ENTRANCE: 'Common Entrance', PRIMARY: 'Class practice', NURSERY: 'Class practice' };
const pct = (x: number) => Math.round(x * 100);
/** How far each stop on a topic's path sits from the left, so the path winds. */
const WIND = [0, 56, 112, 56];
const NODE = 64;

const playable = (s: PracticeSubtopic) => s.unlocked && (s.fresh > 0 || s.answered > 0);

/** One subject as a world: topics, most tested first, each a winding path of subtopics climbed from level 1 to the boss. */
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
  const world = worldFor(m.subject.slug);
  const nursery = m.subject.exam === 'NURSERY';
  // The stop that glows: the first one they can play and haven't conquered.
  const nextId = m.topics.flatMap((t) => t.subtopics).find((s) => playable(s) && !s.bossBeaten)?.id;

  return (
    <Screen background={world.bg} header={<Header m={m} world={world} />} refreshing={map.isRefetching} onRefresh={() => void map.refetch()} accent={world.ledge} edges={['bottom']}>
      {!m.topics.length ? (
        <EmptyState
          icon="construct-outline"
          title={`${m.subject.name} is on its way`}
          message={
            m.subject.exam === 'PRIMARY' || nursery
              ? 'We’re still writing this subject’s questions. It will appear here once it’s ready.'
              : `We’re studying ${EXAM_NAMES[m.subject.exam]}’s past papers to build this subject’s topics and questions. It will appear here once it’s ready.`
          }
        />
      ) : nursery ? (
        <NurseryMap m={m} theme={theme} />
      ) : (
        m.topics.map((t, i) => (
          <Animated.View key={t.id} entering={FadeInDown.delay(Math.min(i, 6) * 60)} className="gap-3">
            <View className="gap-1.5 rounded-[22px] bg-white p-4" style={{ borderBottomWidth: 5, borderBottomColor: world.locked }}>
              <Text accessibilityRole="header" className="font-display text-[19px] leading-[23px]" style={{ color: world.ink }}>
                {t.name}
              </Text>
              {t.hot || t.weight ? (
                <View className="flex-row flex-wrap gap-1.5">
                  {t.hot ? <Pill tone="coral" label="In every paper we studied" icon={<Ionicons name="flame" size={13} color={palette.coral[700]} />} /> : null}
                  {t.weight ? <Pill tone="sky" label={`About ${Math.max(1, pct(t.weight))}% of the paper`} /> : null}
                </View>
              ) : null}
            </View>
            <View className="pb-2">
              {t.subtopics.map((s, j) => (
                <View key={s.id}>
                  {j > 0 ? <Trail from={WIND[(j - 1) % WIND.length]} to={WIND[j % WIND.length]} color={s.unlocked ? world.land : world.locked} /> : null}
                  <Stop s={s} offset={WIND[j % WIND.length]} world={world} next={s.id === nextId} subjectName={m.subject.name} />
                </View>
              ))}
            </View>
          </Animated.View>
        ))
      )}
    </Screen>
  );
}

function Header({ m, world }: { m: PracticeMap; world: World }) {
  return (
    <View style={{ backgroundColor: world.land, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, borderBottomWidth: 6, borderBottomColor: world.ledge }}>
      <SafeAreaView edges={['top']}>
        <View className="gap-4 px-5 pb-5 pt-3">
          <View className="flex-row items-center gap-3">
            <PressableScale
              accessibilityLabel="Back to your worlds"
              onPress={() => goBack('/student/practice')}
              style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="chevron-back" size={22} color={world.ink} />
            </PressableScale>
            <View className="flex-1">
              <Text className="font-body-bold text-[13px]" style={{ color: world.ink }}>
                {world.name} · {EXAM_NAMES[m.subject.exam]}
              </Text>
              <Text accessibilityRole="header" className="font-display text-[24px] leading-[28px]" style={{ color: world.ink }}>
                {m.subject.name}
              </Text>
            </View>
            {m.subject.exam === 'NURSERY' ? <VoiceToggle /> : <WorldIsland world={{ ...world, sea: 'rgba(255,255,255,0.35)' }} width={84} />}
          </View>
          {m.subject.exam !== 'NURSERY' && m.leaves ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Enter the ${m.subject.name} arena`}
              onPress={() => router.push({ pathname: '/student/arena/[subjectId]', params: { subjectId: m.subject.id } })}
              style={{ minHeight: 56, borderRadius: 18, backgroundColor: '#14122E', borderBottomWidth: 5, borderBottomColor: '#000000', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={24} color="#FFD23F" />
              <Text className="font-display text-[20px]" style={{ color: '#FFD23F' }}>
                Enter the Arena
              </Text>
            </PressableScale>
          ) : null}
          {m.leaves ? (
            <View className="gap-2 rounded-[18px] p-3.5" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
              <View className="flex-row items-baseline justify-between">
                <Text className="font-display text-[18px]" style={{ color: world.ink }}>
                  {pct(m.mastery)}% mastered
                </Text>
                <Text className="font-body-bold text-[13px]" style={{ color: world.ink }}>
                  {m.conquered} of {m.leaves} conquered
                </Text>
              </View>
              <ProgressBar value={m.mastery} color={world.ink} track="rgba(255,255,255,0.45)" height={10} accessibilityLabel="Subject mastery" />
              {m.reviewsDue ? (
                <Text className="font-body-semibold text-[13px]" style={{ color: world.ink }}>
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

/** Three stepping stones between two stops on the path. */
function Trail({ from, to, color }: { from: number; to: number; color: string }) {
  return (
    <View accessible={false} className="gap-1.5 py-1.5">
      {[0.25, 0.5, 0.75].map((f) => (
        <View key={f} style={{ marginLeft: NODE / 2 - 4 + from + (to - from) * f, width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      ))}
    </View>
  );
}

/** One stop on the path: locked, in progress (level 1–5), the boss, or conquered. */
function Stop({ s, offset, world, next, subjectName }: { s: PracticeSubtopic; offset: number; world: World; next: boolean; subjectName: string }) {
  const canPlay = playable(s);
  const status = !s.unlocked ? 'Finish level 1 of the stop above to unlock' : s.bossBeaten ? 'Conquered' : s.level === 5 ? 'Boss round next' : `Level ${s.level} of 5`;
  const detail = !s.unlocked ? null : s.fresh ? `${s.fresh} new ${s.fresh === 1 ? 'question' : 'questions'}` : s.answered ? 'Reviews only for now' : 'Questions coming soon';

  const fill = s.bossBeaten ? palette.sun[400] : s.unlocked ? (next ? '#FFFFFF' : world.land) : world.locked;
  const ledge = s.bossBeaten ? palette.sun[600] : s.unlocked ? world.ledge : world.locked;
  const glyph = s.bossBeaten ? palette.ink.DEFAULT : next ? world.ledge : s.unlocked ? world.ink : world.muted;

  const circle = (
    <View
      style={{
        width: NODE,
        height: NODE,
        borderRadius: NODE / 2,
        backgroundColor: fill,
        borderBottomWidth: 6,
        borderBottomColor: ledge,
        borderWidth: next ? 4 : 0,
        borderColor: world.land,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {s.bossBeaten ? (
        <MaterialCommunityIcons name="crown" size={28} color={glyph} />
      ) : !s.unlocked ? (
        <Ionicons name="lock-closed" size={22} color={glyph} />
      ) : s.level === 5 ? (
        <MaterialCommunityIcons name="sword-cross" size={26} color={glyph} />
      ) : (
        <Text className="font-display text-[24px]" style={{ color: glyph }}>
          {s.level}
        </Text>
      )}
    </View>
  );

  return (
    <PressableScale
      disabled={!canPlay}
      accessibilityRole="button"
      accessibilityState={{ disabled: !canPlay }}
      accessibilityLabel={`${s.name}. ${status}.${detail ? ` ${detail}.` : ''}`}
      onPress={() => router.push({ pathname: '/student/practice/round/[topicId]', params: { topicId: s.id, name: s.name, subject: subjectName } })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: offset }}
    >
      {next ? (
        <Pulse scale={1.08}>{circle}</Pulse>
      ) : (
        circle
      )}
      <View className="flex-1 gap-0.5">
        <Text numberOfLines={2} className="font-body-extrabold text-[15px] leading-[19px]" style={{ color: s.unlocked ? world.ink : world.muted }}>
          {s.name}
        </Text>
        <Text className="font-body-semibold text-[12px]" style={{ color: world.muted }}>
          {next ? 'Play next · ' : ''}
          {status}
          {detail ? ` · ${detail}` : ''}
        </Text>
        {s.unlocked && s.answered ? <ProgressBar value={s.mastery} color={s.bossBeaten ? palette.sun[600] : world.land} track={world.locked} height={6} accessibilityLabel={`${pct(s.mastery)}% mastered`} /> : null}
      </View>
    </PressableScale>
  );
}
