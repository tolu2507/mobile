import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CardListSkeleton, EmptyState, ErrorState, GameButton, PressableScale, ProgressBar, Screen, ScreenHeader } from '@/components/ui';
import { useExamCatalog, useMyExams } from '@/features/exams/api';
import { useWorlds } from '@/features/practice/api';
import { isPrimary, useStudentHome } from '@/features/student/api';
import { WorldIsland } from '@/features/worlds/WorldIsland';
import { worldFor } from '@/features/worlds/worlds';
import { roles } from '@/theme';
import type { PracticeWorld } from '@/types/api';

/** The world map: every subject the student picked is a world, grouped by exam. */
export default function WorldMap() {
  const theme = isPrimary(useStudentHome().data) ? roles.studentPrimary : roles.student;
  const mine = useMyExams();
  const worlds = useWorlds();
  const catalog = useExamCatalog();
  const label = (exam: string) => catalog.data?.find((e) => e.exam === exam)?.fullName ?? exam;
  const refetch = () => void Promise.all([mine.refetch(), worlds.refetch()]);
  const error = mine.error ?? worlds.error;

  return (
    <Screen background={theme.bg} edges={['top', 'bottom']} refreshing={mine.isRefetching || worlds.isRefetching} onRefresh={refetch} accent={theme.accent}>
      <ScreenHeader title="Pick your world" subtitle="Every subject is a world. Climb its topics from easy to hard and beat the boss at the top." />
      {error ? (
        <ErrorState error={error} onRetry={refetch} color={theme.accent} />
      ) : !mine.data || !worlds.data ? (
        <CardListSkeleton count={4} height={180} />
      ) : !mine.data.length ? (
        <EmptyState
          icon="school-outline"
          title="Choose your exam first"
          message="Tell us which exam you’re writing and your subjects. Each subject becomes a world to explore."
          action={<GameButton label="Set up exam prep" className="mt-2 self-stretch" color={theme.accent} shadowColor={theme.shadow} onPress={() => router.push('/student/exams')} />}
        />
      ) : (
        mine.data.map((exam) => {
          const progress = new Map(worlds.data?.map((w) => [w.id, w]));
          return (
            <View key={exam.exam} className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 font-display text-[20px] text-ink">
                  {label(exam.exam)}
                  {exam.targetYear ? ` · ${exam.targetYear}` : ''}
                </Text>
                <PressableScale accessibilityRole="button" accessibilityLabel={`Change ${exam.exam} subjects`} onPress={() => router.push({ pathname: '/student/exams/[exam]', params: { exam: exam.exam } })} style={{ minHeight: 44, justifyContent: 'center', paddingLeft: 12 }}>
                  <Text style={{ color: theme.accent }} className="font-body-bold text-[14px]">
                    Change
                  </Text>
                </PressableScale>
              </View>
              <View className="flex-row flex-wrap justify-between gap-y-4">
                {exam.subjects.map((s, i) => (
                  <WorldCard key={s.id} id={s.id} slug={s.slug} name={s.name} progress={progress.get(s.id)} index={i} />
                ))}
              </View>
            </View>
          );
        })
      )}
    </Screen>
  );
}

function WorldCard({ id, slug, name, progress, index }: { id: string; slug: string; name: string; progress: PracticeWorld | undefined; index: number }) {
  const world = worldFor(slug);
  const started = !!progress && (progress.mastery > 0 || progress.conquered > 0);
  const status = !progress?.ready ? 'Questions on the way' : started ? `${progress.conquered} of ${progress.leaves} conquered` : 'Ready to explore';
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 70)} style={{ width: '48%' }}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${world.name}. ${status}.`}
        onPress={() => router.push({ pathname: '/student/practice/[subjectId]', params: { subjectId: id } })}
        style={{ backgroundColor: world.bg, borderRadius: 24, padding: 12, paddingBottom: 14, gap: 8, alignItems: 'center', borderBottomWidth: 6, borderBottomColor: world.locked }}
      >
        <WorldIsland world={world} width={118} delay={index * 300} />
        <View className="items-center gap-0.5 self-stretch">
          <Text numberOfLines={2} className="text-center font-display text-[17px] leading-[20px]" style={{ color: world.ink }}>
            {name}
          </Text>
          <Text className="font-body-bold text-[12px]" style={{ color: world.muted }}>
            {world.name}
          </Text>
        </View>
        <View className="gap-1 self-stretch">
          <ProgressBar value={progress?.mastery ?? 0} color={world.land} track={world.locked} height={8} accessibilityLabel={`${Math.round((progress?.mastery ?? 0) * 100)}% mastered`} />
          <Text className="text-center font-body-bold text-[12px]" style={{ color: world.muted }}>
            {status}
          </Text>
        </View>
      </PressableScale>
    </Animated.View>
  );
}
