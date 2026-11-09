import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInRight, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, GameButton } from '@/components/ui';
import { REPORT_REASONS, usePracticeRound, useReportQuestion, useSubmitRound } from '@/features/practice/api';
import { UNI } from '@/features/uni/components/classroom-theme';
import { friendlyError } from '@/lib/api';
import { playSound } from '@/lib/sounds';
import { fonts, palette } from '@/theme';
import type { PracticeResult, PracticeRound } from '@/types/api';
import { leave } from '@/features/uni/nav';

const LEVEL_NAMES = ['', 'Warm-up', 'Getting it', 'Applying it', 'Tricky ones', 'Lecturer level'];
const PAPER = '#FBFAF7';

function Dots({ n }: { n: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }} accessibilityLabel={`Difficulty ${n} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: i <= n ? UNI.accent : '#E4E1F2' }} />
      ))}
    </View>
  );
}

function Paper({ round, onSubmit, submitting }: { round: PracticeRound; onSubmit: (answers: Record<string, string>) => void; submitting: boolean }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const q = round.questions[i];
  const last = i === round.questions.length - 1;
  const chosen = answers[q.id];
  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 18 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: palette.ink[500], fontFamily: fonts.bodyBold, fontSize: 13 }}>
            Question {i + 1} of {round.questions.length}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {q.review ? (
              <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: palette.sun[100] }}>
                <Text style={{ color: palette.sun[800], fontFamily: fonts.bodyExtrabold, fontSize: 11 }}>REVIEW</Text>
              </View>
            ) : null}
            <Dots n={q.difficulty} />
          </View>
        </View>
        <Animated.View key={q.id} entering={SlideInRight.springify().damping(20).mass(0.8)} style={{ gap: 16 }}>
          <Text style={{ color: palette.ink.DEFAULT, fontFamily: fonts.bodySemibold, fontSize: 19, lineHeight: 27 }}>{q.prompt}</Text>
          <View style={{ gap: 10 }}>
            {q.options.map((o, k) => {
              const on = chosen === o.id;
              return (
                <Pressable
                  key={o.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${'ABCD'[k]}: ${o.label}`}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setAnswers((a) => ({ ...a, [q.id]: o.id }));
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14, backgroundColor: on ? UNI.accentSoft : '#fff', borderWidth: 2, borderColor: on ? UNI.accent : '#ECEAF6' }}
                >
                  <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? UNI.accent : '#F1EFF9' }}>
                    <Text style={{ color: on ? '#fff' : palette.ink[700], fontFamily: fonts.bodyExtrabold, fontSize: 13 }}>{'ABCD'[k]}</Text>
                  </View>
                  <Text style={{ flex: 1, color: palette.ink.DEFAULT, fontFamily: fonts.bodyMedium, fontSize: 15.5, lineHeight: 21 }}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, borderTopWidth: 1, borderTopColor: '#ECEAF6' }}>
        {i > 0 ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Previous question" onPress={() => setI(i - 1)} style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ECEAF6', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={22} color={palette.ink.DEFAULT} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <GameButton
            label={!chosen ? 'Pick an answer' : last ? 'Submit answers' : 'Next question'}
            color={UNI.accent}
            shadowColor={UNI.shadow}
            disabled={!chosen}
            loading={submitting}
            onPress={() => (last ? onSubmit(answers) : setI(i + 1))}
          />
        </View>
      </View>
    </>
  );
}

function ReviewItem({ round, r, n }: { round: PracticeRound; r: PracticeResult['results'][number]; n: number }) {
  const [open, setOpen] = useState(!r.correct);
  const [reported, setReported] = useState(false);
  const report = useReportQuestion();
  const q = round.questions.find((x) => x.id === r.questionId);
  if (!q) return null;
  const label = (id: string | null) => q.options.find((o) => o.id === id)?.label ?? 'No answer';
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(n, 6) * 60)} style={{ borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEAF6', overflow: 'hidden' }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={{ flexDirection: 'row', gap: 12, padding: 14, alignItems: 'flex-start' }}>
        <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: r.correct ? palette.mint[400] : palette.coral[400], marginTop: 1 }}>
          <Ionicons name={r.correct ? 'checkmark' : 'close'} size={16} color="#fff" />
        </View>
        <Text numberOfLines={open ? undefined : 2} style={{ flex: 1, color: palette.ink.DEFAULT, fontFamily: fonts.bodySemibold, fontSize: 14.5, lineHeight: 20 }}>{q.prompt}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={palette.ink[300]} />
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}>
          {!r.correct ? (
            <Text style={{ color: palette.coral[700], fontFamily: fonts.bodySemibold, fontSize: 14 }}>
              Your answer: {label(r.chosen)}
            </Text>
          ) : null}
          <Text style={{ color: palette.mint[700], fontFamily: fonts.bodyBold, fontSize: 14 }}>Correct: {label(r.answerId)}</Text>
          <View style={{ borderRadius: 14, padding: 12, backgroundColor: PAPER }}>
            <Text style={{ color: palette.ink[700], fontFamily: fonts.body, fontSize: 14, lineHeight: 21 }}>{r.explanation}</Text>
          </View>
          {reported ? (
            <Text style={{ color: palette.ink[500], fontFamily: fonts.body, fontSize: 12.5 }}>Thanks, we’ll check this question.</Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <Text style={{ color: palette.ink[500], fontFamily: fonts.body, fontSize: 12.5 }}>Something wrong?</Text>
              {REPORT_REASONS.slice(0, 3).map((x) => (
                <Text
                  key={x.value}
                  accessibilityRole="button"
                  onPress={() => report.mutate({ questionId: q.id, reason: x.value }, { onSuccess: () => setReported(true) })}
                  style={{ color: UNI.accent, fontFamily: fonts.bodySemibold, fontSize: 12.5, paddingVertical: 4, paddingHorizontal: 6 }}
                >
                  {x.label}
                </Text>
              ))}
            </View>
          )}
        </View>
      ) : null}
    </Animated.View>
  );
}

function Results({ round, result, onAgain }: { round: PracticeRound; result: PracticeResult; onAgain: () => void }) {
  const pct = Math.round(result.score * 100);
  const up = result.levelAfter > result.levelBefore;
  const down = result.levelAfter < result.levelBefore;
  useEffect(() => {
    playSound(result.bossBeaten || up ? 'fanfare' : 'chime');
  }, [result.bossBeaten, up]);
  const banner = result.bossBeaten
    ? { icon: 'crown' as const, title: 'Boss beaten! Section mastered.', body: 'You answered the hardest questions a strict lecturer would set.', bg: palette.sun[100], fg: palette.sun[800] }
    : up
      ? { icon: 'arrow-up-bold-circle' as const, title: `Level up! Now level ${result.levelAfter}: ${LEVEL_NAMES[result.levelAfter]}`, body: result.levelAfter === 5 ? 'Next round is the boss round.' : 'The questions get trickier from here.', bg: palette.mint[50], fg: palette.mint[800] }
      : down
        ? { icon: 'refresh-circle' as const, title: `Back to level ${result.levelAfter} for now`, body: 'Read the explanations below, then go again. You’ll climb back fast.', bg: palette.coral[50], fg: palette.coral[700] }
        : result.counted < 5
          ? null
          : { icon: 'target' as const, title: `Still on level ${result.levelAfter}`, body: 'Score 80% in a round to move up a level.', bg: UNI.accentSoft, fg: UNI.shadow };
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <View style={{ alignItems: 'center', gap: 6, paddingVertical: 8 }}>
        <Animated.View entering={ZoomIn.springify().damping(10)} style={{ width: 140, height: 140, borderRadius: 70, borderWidth: 10, borderColor: pct >= 80 ? palette.mint[400] : pct >= 50 ? palette.sun[400] : palette.coral[400], alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
          <Text style={{ color: palette.ink.DEFAULT, fontFamily: fonts.display, fontSize: 38 }}>{pct}%</Text>
          <Text style={{ color: palette.ink[500], fontFamily: fonts.body, fontSize: 13 }}>
            {result.correct}/{result.counted || round.questions.length}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(300)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <Ionicons name="flash" size={18} color={palette.sun[600]} />
          <Text style={{ color: palette.ink.DEFAULT, fontFamily: fonts.bodyBold, fontSize: 16 }}>+{result.xpEarned} XP</Text>
        </Animated.View>
      </View>
      {banner ? (
        <Animated.View entering={FadeInDown.delay(200).springify().damping(15)} style={{ flexDirection: 'row', gap: 12, borderRadius: 20, padding: 14, backgroundColor: banner.bg }}>
          <MaterialCommunityIcons name={banner.icon} size={28} color={banner.fg} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: banner.fg, fontFamily: fonts.bodyExtrabold, fontSize: 15 }}>{banner.title}</Text>
            <Text style={{ color: banner.fg, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 19 }}>{banner.body}</Text>
          </View>
        </Animated.View>
      ) : null}
      <View style={{ gap: 10 }}>
        <GameButton label="Another round" color={UNI.accent} shadowColor={UNI.shadow} onPress={onAgain} />
        <GameButton label="Back to the course" variant="outline" size="md" onPress={() => leave()} />
      </View>
      <Text accessibilityRole="header" style={{ color: palette.ink.DEFAULT, fontFamily: fonts.display, fontSize: 20, marginTop: 8 }}>Go through your answers</Text>
      {result.results.map((r, n) => (
        <ReviewItem key={r.questionId} round={round} r={r} n={n} />
      ))}
    </ScrollView>
  );
}

export default function UniPractice() {
  const { topicId } = useLocalSearchParams<{ topicId: string }>();
  const insets = useSafeAreaInsets();
  const round = usePracticeRound(topicId);
  const submit = useSubmitRound(topicId);
  const [result, setResult] = useState<PracticeResult | null>(null);
  const r = round.data;

  const again = () => {
    setResult(null);
    submit.reset();
    void round.refetch();
  };

  const status = isAxiosError(round.error) ? round.error.response?.status : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: PAPER, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Leave practice" onPress={() => leave()} hitSlop={12} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEAF6', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="close" size={22} color={palette.ink.DEFAULT} />
        </Pressable>
        {r ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name={r.boss ? 'sword-cross' : 'target'} size={20} color={r.boss ? palette.coral[500] : UNI.accent} />
            <Text style={{ color: palette.ink.DEFAULT, fontFamily: fonts.bodyBold, fontSize: 15 }}>{r.boss ? 'Boss round' : `Level ${r.level} · ${LEVEL_NAMES[r.level]}`}</Text>
          </View>
        ) : null}
      </View>

      {round.isFetching && !result ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <MaterialCommunityIcons name="file-document-edit-outline" size={40} color={palette.ink[300]} />
          <Text style={{ color: palette.ink[500], fontFamily: fonts.bodySemibold, fontSize: 15 }}>Setting your questions…</Text>
        </View>
      ) : round.isError ? (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20, gap: 12 }}>
          <EmptyState icon={status === 429 ? 'moon-outline' : 'document-text-outline'} title={status === 429 ? 'Done for today' : 'No round right now'} message={friendlyError(round.error)} />
          <GameButton label="Back to the course" variant="outline" size="md" onPress={() => leave()} />
        </View>
      ) : result && r ? (
        <Results round={r} result={result} onAgain={again} />
      ) : r ? (
        <>
          {r.boss ? (
            <Animated.View entering={FadeInDown} style={{ marginHorizontal: 20, flexDirection: 'row', gap: 10, alignItems: 'center', borderRadius: 16, padding: 12, backgroundColor: palette.coral[50] }}>
              <MaterialCommunityIcons name="sword-cross" size={22} color={palette.coral[500]} />
              <Text style={{ flex: 1, color: palette.coral[700], fontFamily: fonts.bodySemibold, fontSize: 13.5, lineHeight: 19 }}>The hardest questions on this section. Score 80% to master it.</Text>
            </Animated.View>
          ) : null}
          <Paper round={r} submitting={submit.isPending} onSubmit={(answers) => submit.mutate(answers, { onSuccess: setResult })} />
          {submit.isError ? <Text style={{ color: palette.coral[700], fontFamily: fonts.bodySemibold, fontSize: 13, textAlign: 'center', paddingBottom: 6 }}>{friendlyError(submit.error)}</Text> : null}
        </>
      ) : null}
    </View>
  );
}
