import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Confetti, CountUp, Flame, PopIn, ScoreRing } from '@/components/game';
import { MathText } from '@/components/MathText';
import { QuizPlayer, QuizProgress } from '@/components/QuizPlayer';
import { RewardCard } from '@/components/RewardCard';
import { Body, CardListSkeleton, ChipGroup, EmptyState, GameButton, Pill, PressableScale, Screen } from '@/components/ui';
import { REPORT_REASONS, usePracticeRound, useReportQuestion, useSubmitRound } from '@/features/practice/api';
import { NurseryPlayer, NurseryResults } from '@/features/practice/components/NurseryRound';
import { isPrimary, useStudentHome } from '@/features/student/api';
import { Coin, StickerFace } from '@/features/student/components/Sticker';
import { friendlyError } from '@/lib/api';
import { naira } from '@/lib/format';
import { fonts, palette, roles, type RoleTheme } from '@/theme';
import type { PracticeQuestion, PracticeResult } from '@/types/api';
import { goBack } from '@/lib/nav';

export default function PracticeRoundScreen() {
  const { topicId, name, subject } = useLocalSearchParams<{ topicId: string; name?: string; subject?: string }>();
  const theme = isPrimary(useStudentHome().data) ? roles.studentPrimary : roles.student;
  const round = usePracticeRound(topicId);
  const submit = useSubmitRound(topicId);

  if (round.isPending || round.isFetching)
    return (
      <Screen background={theme.bg}>
        <CardListSkeleton count={5} height={60} />
      </Screen>
    );
  const doneForToday = isAxiosError(round.error) && round.error.response?.status === 429; // free plan: today's questions are used up
  if (round.isError)
    return (
      <Screen background={theme.bg}>
        <EmptyState
          icon={doneForToday ? 'moon-outline' : 'hourglass-outline'}
          title={doneForToday ? 'That’s it for today!' : 'No round right now'}
          message={friendlyError(round.error)}
          action={<GameButton label="Back to topics" className="mt-2 self-stretch" color={theme.accent} shadowColor={theme.shadow} onPress={() => goBack('/student/practice')} />}
        />
      </Screen>
    );
  if (submit.data) {
    const next = () => {
      submit.reset();
      void round.refetch();
    };
    return round.data.nursery ? <NurseryResults result={submit.data} theme={theme} onNext={next} /> : <Results result={submit.data} questions={round.data.questions} theme={theme} onNext={next} />;
  }
  if (round.data.nursery) {
    return <NurseryPlayer key={round.dataUpdatedAt} questions={round.data.questions} theme={theme} submitting={submit.isPending} error={submit.isError ? friendlyError(submit.error) : null} onSubmit={(answers) => submit.mutate(answers)} />;
  }

  const { level, boss, questions } = round.data;
  return (
    <QuizPlayer
      key={round.dataUpdatedAt}
      questions={questions}
      accent={boss ? palette.coral[500] : theme.accent}
      shadow={boss ? palette.coral[700] : theme.shadow}
      background={theme.bg}
      submitLabel="Finish round"
      submitting={submit.isPending}
      error={submit.isError ? friendlyError(submit.error) : null}
      onSubmit={(answers) => submit.mutate(answers)}
      tag={(q) => ((q as PracticeQuestion).review ? <Pill tone="amber" label="Review: you missed this one before" icon={<Ionicons name="refresh" size={13} color="#7A3D00" />} /> : null)}
      header={(pos) => (
        <View style={{ backgroundColor: boss ? palette.coral[500] : theme.accent, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
          <SafeAreaView edges={['top']}>
            <View className="gap-4 px-5 pb-5 pt-3">
              <View className="flex-row items-center justify-between">
                <PressableScale
                  accessibilityLabel="Stop practising"
                  onPress={() => goBack('/student/practice')}
                  style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </PressableScale>
                <View className="flex-row items-center gap-1.5 rounded-full px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}>
                  {boss ? <MaterialCommunityIcons name="sword-cross" size={16} color={palette.sun[400]} /> : <Ionicons name="trending-up" size={16} color={palette.sun[400]} />}
                  <Text className="font-body-bold text-[14px] text-white">{boss ? 'Boss round · get 8 of 10' : `Level ${level} of 5`}</Text>
                </View>
              </View>
              <QuizProgress {...pos} ids={questions.map((q) => q.id)} />
              <View>
                {subject ? <Text className="font-body-semibold text-[13px] text-white/80">{subject}</Text> : null}
                <Text className="font-display text-[22px] leading-[26px] text-white">{name ?? 'Practice'}</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>
      )}
    />
  );
}

const BEAT = 450;

function Results({ result, questions, theme, onNext }: { result: PracticeResult; questions: PracticeQuestion[]; theme: RoleTheme; onNext: () => void }) {
  const percent = Math.round(result.score * 100);
  const up = result.levelAfter > result.levelBefore;
  const down = result.levelAfter < result.levelBefore;
  const { rewards } = result;
  const xpLevelUp = rewards.level.after > rewards.level.before;

  const headline = result.bossBeaten
    ? 'Topic conquered!'
    : up
      ? result.levelAfter === 5
        ? 'Boss round unlocked!'
        : `Level ${result.levelAfter} unlocked!`
      : !result.counted
        ? 'Practice round'
        : percent >= 60
          ? 'Nice work!'
          : 'Keep going!';
  const sub = !result.counted
    ? 'You’d seen all of these before, so this round didn’t count towards your level.'
    : result.boss && !result.bossBeaten
      ? `You got ${result.correct} of ${result.counted}. Get 8 of 10 to beat the boss.`
      : down
        ? `You got ${result.correct} of ${result.counted}. We’ve dropped you to level ${result.levelAfter} to build up again.`
        : result.counted < 5
          ? `You got ${result.correct} of ${result.counted}. Levels move after rounds of 5 or more new questions.`
          : up || result.bossBeaten
            ? `You got ${result.correct} of ${result.counted} right.`
            : `You got ${result.correct} of ${result.counted}. Get 8 of 10 to move up a level.`;

  const xpAt = 1300;
  const streakAt = rewards.streak.extended ? xpAt + BEAT : null;
  const levelAt = xpLevelUp ? (streakAt ?? xpAt) + BEAT * 1.5 : null;
  const reviewAt = (levelAt ?? streakAt ?? xpAt) + BEAT * 1.5;

  useEffect(() => {
    Haptics.notificationAsync(percent >= 60 ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
  }, [percent]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-6">
        <View className="items-center gap-4">
          <View className="items-center justify-center" style={{ minHeight: 148 }}>
            {result.bossBeaten ? (
              <View className="h-[132px] w-[132px] items-center justify-center rounded-full" style={{ backgroundColor: palette.sun[400] }}>
                <MaterialCommunityIcons name="crown" size={72} color={palette.ink.DEFAULT} />
              </View>
            ) : (
              <ScoreRing percent={percent} color={percent >= 80 ? palette.mint[400] : theme.accent} />
            )}
            {up || result.bossBeaten ? <Confetti key="win" count={result.bossBeaten ? 60 : 40} /> : null}
          </View>
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text accessibilityRole="header" className="text-center font-display text-[30px] text-ink">
              {headline}
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(250)}>
            <Body className="text-center text-ink-700">{sub}</Body>
          </Animated.View>
          {rewards.coins?.earned ? (
            <PopIn delay={xpAt + 300}>
              <View accessibilityLabel={`${rewards.coins.earned} coins earned`} className="flex-row items-center gap-2 rounded-full px-5 py-3" style={{ backgroundColor: '#2B1D00' }}>
                <Coin size={22} />
                <Text className="font-display text-[22px]" style={{ color: palette.sun[400] }}>+</Text>
                <CountUp value={rewards.coins.earned} delay={xpAt + 450} color={palette.sun[400]} />
                <Text className="font-display text-[18px]" style={{ color: palette.sun[400] }}>coins</Text>
              </View>
            </PopIn>
          ) : null}
          {rewards.coins?.sentKobo ? (
            <PopIn delay={xpAt + 600}>
              <Text className="text-center font-display text-[20px] text-ink">You just earned {naira(rewards.coins.sentKobo)} for your family!</Text>
            </PopIn>
          ) : null}
          {result.xpEarned > 0 ? (
            <PopIn delay={xpAt}>
              <View accessibilityLabel={`${result.xpEarned} XP earned`} className="flex-row items-center gap-2 rounded-full bg-white px-5 py-3">
                <Ionicons name="flash" size={22} color={theme.accent} />
                <Text className="font-display text-[22px] text-ink">+</Text>
                <CountUp value={result.xpEarned} delay={xpAt + 150} color={palette.ink.DEFAULT} />
                <Text className="font-display text-[22px] text-ink">XP</Text>
              </View>
            </PopIn>
          ) : null}
        </View>

        {streakAt != null ? (
          <PopIn delay={streakAt}>
            <RewardCard
              tone="coral"
              icon={<Flame size={30} color={palette.coral[500]} />}
              title={rewards.streak.days === 1 ? 'Streak started!' : `${rewards.streak.days}-day streak!`}
              body={rewards.streak.days === 1 ? 'Come back tomorrow to keep it going.' : 'You’ve practised every day. Keep it alive tomorrow!'}
            />
          </PopIn>
        ) : null}
        {levelAt != null ? (
          <PopIn delay={levelAt}>
            <RewardCard tone="violet" icon={<Text className="font-display text-[24px] text-white">{rewards.level.after}</Text>} title={`Level ${rewards.level.after} reached`} body={`You’re now a ${rewards.level.title}.`} />
          </PopIn>
        ) : null}
        {rewards.newBadges.map((b, i) => (
          <PopIn key={b.code} delay={reviewAt + i * BEAT}>
            <RewardCard tone="sun" icon={<StickerFace icon={b.icon} rarity={b.rarity} size={48} />} title={`New sticker: ${b.name}`} body={b.description} />
          </PopIn>
        ))}

        <Animated.View entering={FadeIn.delay(reviewAt)} className="gap-2.5">
          <Text className="font-display text-[20px] text-ink">Go through your answers</Text>
          {questions.map((q, i) => (
            <AnswerReview key={q.id} q={q} r={result.results.find((x) => x.questionId === q.id)} index={i} theme={theme} />
          ))}
        </Animated.View>

        <View className="gap-2.5">
          <GameButton
            label="Next round"
            color={theme.accent}
            shadowColor={theme.shadow}
            size="lg"
            onPress={onNext}
          />
          <GameButton label="Back to topics" variant="outline" onPress={() => goBack('/student/practice')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AnswerReview({ q, r, index, theme }: { q: PracticeQuestion; r: PracticeResult['results'][number] | undefined; index: number; theme: RoleTheme }) {
  const [open, setOpen] = useState(!r?.correct);
  const [reporting, setReporting] = useState(false);
  const report = useReportQuestion();
  const right = q.options.find((o) => o.id === r?.answerId)?.label;
  const chosen = q.options.find((o) => o.id === r?.chosen)?.label;

  return (
    <View className="gap-2 rounded-[18px] bg-white p-4">
      <PressableScale accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`Question ${index + 1}, ${r?.correct ? 'correct' : 'wrong'}. ${open ? 'Hide' : 'Show'} the working`} onPress={() => setOpen((x) => !x)} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        <Ionicons name={r?.correct ? 'checkmark-circle' : 'close-circle'} size={22} color={r?.correct ? palette.mint[400] : palette.coral[500]} style={{ marginTop: 1 }} />
        <View className="flex-1">
          <MathText text={q.prompt} size={15} fontFamily={fonts.bodySemibold} />
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={palette.ink[300]} />
      </PressableScale>
      {open ? (
        <View className="gap-2 pl-7">
          {!r?.correct ? (
            <View className="gap-1">
              {chosen ? <MathText text={`You chose: ${chosen}`} size={14} color={palette.ink[700]} /> : <Text className="font-body text-[14px] text-ink-700">You didn’t answer this one.</Text>}
              {right ? <MathText text={`Answer: ${right}`} size={14} color={palette.mint[800]} fontFamily={fonts.bodyBold} /> : null}
            </View>
          ) : null}
          {r?.explanation ? (
            <View className="gap-1 rounded-[14px] p-3" style={{ backgroundColor: theme.accentSoft }}>
              <Text className="font-body-bold text-[13px] text-ink">How to solve it</Text>
              <MathText text={r.explanation} size={14} color={palette.ink[700]} />
            </View>
          ) : null}
          {report.isSuccess ? (
            <Text className="font-body text-[13px] text-mint-800">Thanks! We’ll check this question.</Text>
          ) : reporting ? (
            <View className="gap-2">
              <ChipGroup
                label="What’s wrong with it?"
                options={REPORT_REASONS.map((x) => ({ value: x.value, label: x.label }))}
                value={null}
                accent={theme.accent}
                onChange={(reason) => report.mutate({ questionId: q.id, reason })}
              />
              {report.isError ? <Text className="font-body text-[13px] text-coral-700">{friendlyError(report.error)}</Text> : null}
            </View>
          ) : (
            <PressableScale accessibilityRole="button" accessibilityLabel="Report this question" onPress={() => setReporting(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' }}>
              <Ionicons name="flag-outline" size={14} color={palette.ink[500]} />
              <Text className="font-body-semibold text-[13px] text-ink-500">Report this question</Text>
            </PressableScale>
          )}
        </View>
      ) : null}
    </View>
  );
}
