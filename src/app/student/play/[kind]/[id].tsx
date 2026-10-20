import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Confetti, CountUp, Flame, PopIn, ScoreRing, Stars, starsForScore } from '@/components/game';
import { QuizPlayer, QuizProgress } from '@/components/QuizPlayer';
import { RewardCard } from '@/components/RewardCard';
import { Body, CardListSkeleton, EmptyState, ErrorState, GameButton, PressableScale, Screen } from '@/components/ui';
import { isPrimary, usePlayable, useStudentHome, useSubmitPlay } from '@/features/student/api';
import { friendlyError } from '@/lib/api';
import { palette, roles } from '@/theme';
import type { PlayResult, Question } from '@/types/api';
import { StickerFace } from '@/features/student/components/Sticker';

export default function Play() {
  const params = useLocalSearchParams<{ kind: string; id: string }>();
  const kind = params.kind === 'LESSON_QUIZ' ? 'LESSON_QUIZ' : 'ACTIVITY';
  const home = useStudentHome();
  const primary = isPrimary(home.data);
  const theme = primary ? roles.studentPrimary : roles.student;
  const quiz = usePlayable(kind, params.id);
  const submit = useSubmitPlay(kind, params.id);

  if (quiz.isPending)
    return (
      <Screen background={theme.bg}>
        <CardListSkeleton count={5} height={60} />
      </Screen>
    );
  if (quiz.isError)
    return (
      <Screen background={theme.bg}>
        <ErrorState error={quiz.error} onRetry={quiz.refetch} color={theme.accent} />
      </Screen>
    );
  if (submit.data) return <Results result={submit.data} questions={quiz.data.questions} accent={theme.accent} shadow={theme.shadow} bg={theme.bg} primary={primary} />;
  if (quiz.data.status === 'COMPLETED') {
    return (
      <Screen background={theme.bg}>
        <EmptyState
          icon="checkmark-done-outline"
          title="You already did this one"
          message="Great work! Your teacher and parent can see your score."
          action={<GameButton label="Back home" className="mt-2 self-stretch" color={theme.accent} shadowColor={theme.shadow} onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  return (
    <QuizPlayer
      questions={quiz.data.questions}
      accent={theme.accent}
      shadow={theme.shadow}
      background={theme.bg}
      playful={primary}
      submitLabel="Finish"
      submitting={submit.isPending}
      error={submit.isError ? friendlyError(submit.error) : null}
      onSubmit={(answers) => submit.mutate(answers)}
      header={(pos) => (
        <View style={{ backgroundColor: theme.accent, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
          <SafeAreaView edges={['top']}>
            <View className="gap-4 px-5 pb-5 pt-3">
              <View className="flex-row items-center justify-between">
                <PressableScale
                  accessibilityLabel="Stop playing"
                  onPress={() => router.back()}
                  style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </PressableScale>
                <View className="flex-row items-center gap-1.5 rounded-full px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
                  <Ionicons name="flash" size={16} color={palette.sun[400]} />
                  <Text className="font-body-bold text-[14px] text-white">Up to {quiz.data.xpReward} XP</Text>
                </View>
              </View>
              <QuizProgress {...pos} ids={quiz.data.questions.map((q) => q.id)} />
              <Text className="font-display text-[22px] leading-[26px] text-white">{quiz.data.title}</Text>
            </View>
          </SafeAreaView>
        </View>
      )}
    />
  );
}

const BEAT = 450; // ms between reward reveals

function Results({ result, questions, accent, shadow, bg, primary }: { result: PlayResult; questions: Question[]; accent: string; shadow: string; bg: string; primary: boolean }) {
  const pct = Math.round(result.score * 100);
  const great = pct >= 80;
  const rewards = result.rewards;
  const leveledUp = !!rewards && rewards.level.after > rewards.level.before;
  const stars = starsForScore(pct);

  // Staged reveal: score → XP → streak → level up → badges → answer review.
  const xpAt = primary ? 400 + 3 * 280 : 1400;
  const streakAt = rewards?.streak.extended ? xpAt + BEAT : null;
  const levelAt = leveledUp ? (streakAt ?? xpAt) + BEAT * 1.5 : null;
  const badgesFrom = (levelAt ?? streakAt ?? xpAt) + BEAT * 1.5;
  const badgeAt = (i: number) => badgesFrom + i * BEAT;
  const reviewAt = badgeAt(rewards?.newBadges.length ?? 0);

  const [levelBurst, setLevelBurst] = useState(false);
  useEffect(() => {
    Haptics.notificationAsync(great ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
    if (levelAt == null) return;
    const id = setTimeout(() => {
      setLevelBurst(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, levelAt);
    return () => clearTimeout(id);
  }, [great, levelAt]);

  const unit = primary ? 'stars' : 'XP';
  const earned = primary ? Math.floor(result.xpEarned / 10) || 1 : result.xpEarned;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-6">
        <View className="items-center gap-4">
          <View className="items-center justify-center" style={{ minHeight: primary ? 90 : 148 }}>
            {primary ? <Stars earned={stars} size={52} /> : <ScoreRing percent={pct} color={great ? palette.mint[400] : accent} />}
            {pct >= 50 ? <Confetti key="score" /> : null}
          </View>
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text accessibilityRole="header" className="text-center font-display text-[32px] text-ink">
              {pct === 100 ? 'Perfect!' : great ? 'Brilliant!' : pct >= 50 ? 'Good effort!' : 'Keep practising!'}
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(250)}>
            <Body className="text-center text-ink-700">
              You got {result.correct} of {result.total} right.
            </Body>
          </Animated.View>
          {result.xpEarned > 0 ? (
            <PopIn delay={xpAt}>
              <View accessibilityLabel={`${earned} ${unit} earned`} className="flex-row items-center gap-2 rounded-full bg-white px-5 py-3">
                <Ionicons name={primary ? 'star' : 'flash'} size={22} color={primary ? '#FFB800' : accent} />
                <Text className="font-display text-[22px] text-ink">+</Text>
                <CountUp value={earned} delay={xpAt + 150} color={palette.ink.DEFAULT} />
                <Text className="font-display text-[22px] text-ink">{unit}</Text>
              </View>
            </PopIn>
          ) : (
            <Body className="text-center text-[14px] text-ink-500">Practice round: XP is given once per quest each day.</Body>
          )}
        </View>

        {streakAt != null && rewards ? (
          <PopIn delay={streakAt}>
            <RewardCard
              tone="coral"
              icon={<Flame size={30} color={palette.coral[500]} />}
              title={rewards.streak.days === 1 ? 'Streak started!' : `${rewards.streak.days}-day streak!`}
              body={rewards.streak.days === 1 ? 'Come back tomorrow to keep it going.' : 'You’ve practised every day. Keep it alive tomorrow!'}
            />
          </PopIn>
        ) : null}

        {levelAt != null && rewards ? (
          <View>
            <PopIn delay={levelAt}>
              <RewardCard
                tone="violet"
                icon={<Text className="font-display text-[24px] text-white">{rewards.level.after}</Text>}
                title={primary ? 'You levelled up!' : `Level ${rewards.level.after} reached`}
                body={`You’re now a ${rewards.level.title}. New quests are waiting for you.`}
              />
            </PopIn>
            {levelBurst ? <Confetti key="level" count={48} spread={220} /> : null}
          </View>
        ) : null}

        {rewards?.newBadges.map((b, i) => (
          <PopIn key={b.code} delay={badgeAt(i)}>
            <RewardCard tone="sun" icon={<StickerFace icon={b.icon} rarity={b.rarity} size={48} />} title={`New sticker: ${b.name}`} body={b.description} />
          </PopIn>
        ))}

        <View className="gap-2.5">
          {questions.map((q, i) => {
            const r = result.results.find((x) => x.questionId === q.id);
            const right = q.options.find((o) => o.id === r?.correctId)?.label;
            const chosen = q.options.find((o) => o.id === r?.chosenId)?.label;
            return (
              <Animated.View key={q.id} entering={FadeInDown.delay(reviewAt + 60 * i)}>
                <View className="gap-1.5 rounded-[18px] bg-white p-4">
                  <View className="flex-row items-start gap-2">
                    <Ionicons name={r?.correct ? 'checkmark-circle' : 'close-circle'} size={22} color={r?.correct ? palette.mint[400] : palette.coral[500]} />
                    <Text className="flex-1 font-body-semibold text-[15px] leading-[21px] text-ink">{q.prompt}</Text>
                  </View>
                  {!r?.correct ? (
                    <Text className="pl-7 font-body text-[14px] text-ink-700">
                      {chosen ? `You chose ${chosen}. ` : ''}Answer: <Text className="font-body-bold text-mint-800">{right}</Text>
                    </Text>
                  ) : null}
                </View>
              </Animated.View>
            );
          })}
        </View>

        <GameButton label="Back home" color={accent} shadowColor={shadow} size="lg" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}
