import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Confetti, PopIn, ScoreRing } from '@/components/game';
import { MathText } from '@/components/MathText';
import { Banner, Caption, CardListSkeleton, ErrorState, GameButton, Label, PressableScale, ProgressBar, Screen } from '@/components/ui';
import { useMockResult } from '@/features/mocks/api';
import { lagosWhen, ordinal } from '@/features/mocks/format';
import { fonts, palette, roles } from '@/theme';
import type { MockResult } from '@/types/api';

const theme = roles.student;
const LETTERS = 'ABCDE';

export default function MockResultScreen() {
  const { id, auto } = useLocalSearchParams<{ id: string; auto?: string }>();
  const result = useMockResult(id);

  if (result.isPending)
    return (
      <Screen background={theme.bg}>
        <CardListSkeleton count={4} height={80} />
      </Screen>
    );
  if (result.isError)
    return (
      <Screen background={theme.bg}>
        <ErrorState error={result.error} onRetry={() => void result.refetch()} color={theme.accent} />
      </Screen>
    );

  const r = result.data;
  const share = r.outOf ? (r.score ?? 0) / r.outOf : 0;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-4">
        <View className="flex-row items-center">
          <PressableScale accessibilityLabel="Back to Friday mocks" onPress={() => router.replace('/student/mocks')} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={22} color={palette.ink.DEFAULT} />
          </PressableScale>
        </View>

        {auto ? <Banner tone="info" message="Time ran out, so we submitted what you’d answered." /> : null}

        <View className="items-center gap-3">
          <View className="items-center justify-center" style={{ minHeight: 148 }}>
            <ScoreRing percent={Math.round(share * 100)} color={share >= 0.6 ? palette.mint[400] : theme.accent} />
            {share >= 0.6 ? <Confetti /> : null}
          </View>
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <Text accessibilityRole="header" className="text-center font-display text-[34px] text-ink">
              {r.score}
              <Text className="text-[22px] text-ink-500">/{r.outOf}</Text>
            </Text>
          </Animated.View>
          <Caption className="text-center text-[14px]">{r.title}</Caption>
          <PopIn delay={900}>
            {r.resultsOut && r.nationalRank ? (
              <View className="items-center gap-0.5 rounded-[20px] bg-white px-5 py-3">
                <Text className="font-display text-[22px] text-ink">
                  {ordinal(r.nationalRank)} of {r.sat.toLocaleString()}
                </Text>
                <Caption>{r.sat > 1 ? `Better than ${Math.round(r.percentile ?? 0)}% of everyone who sat it` : 'You were the only one this week'}</Caption>
              </View>
            ) : (
              <View className="flex-row items-center gap-2 rounded-full bg-white px-4 py-2.5">
                <Ionicons name="time-outline" size={18} color={theme.accent} />
                <Text className="font-body-semibold text-[14px] text-ink">National rank at {lagosWhen(r.closesAt, false)}, when the window closes</Text>
              </View>
            )}
          </PopIn>
        </View>

        <View className="gap-3 rounded-[22px] bg-white p-4">
          <Label>By subject</Label>
          {r.subjects.map((s) => (
            <View key={s.name} className="gap-1">
              <View className="flex-row justify-between">
                <Text className="font-body-semibold text-[14px] text-ink">{s.name}</Text>
                <Text className="font-body-bold text-[14px] text-ink">
                  {s.score}/100 <Text className="font-body text-ink-500">({s.correct} of {s.total})</Text>
                </Text>
              </View>
              <ProgressBar value={s.score / 100} color={s.score >= 60 ? palette.mint[400] : s.score >= 45 ? palette.sun[400] : palette.amber[500]} height={8} accessibilityLabel={`${s.name} ${s.score} out of 100`} />
            </View>
          ))}
        </View>

        {r.review ? (
          <Review r={r} />
        ) : (
          <View className="flex-row gap-3 rounded-[22px] bg-white p-4">
            <Ionicons name="lock-closed-outline" size={22} color={palette.ink[500]} />
            <Caption className="flex-1 text-[14px]">
              The answers and explanations appear at {lagosWhen(r.closesAt, false)}, once everyone has finished, so nobody can pass them round. Questions you got wrong also come back in Practice.
            </Caption>
          </View>
        )}

        <GameButton label="Back to Friday mocks" color={theme.accent} shadowColor={theme.shadow} onPress={() => router.replace('/student/mocks')} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Review({ r }: { r: MockResult }) {
  const [subjectId, setSubjectId] = useState(r.review![0]?.subjectId);
  const [wrongOnly, setWrongOnly] = useState(true);
  const block = r.review!.find((b) => b.subjectId === subjectId);
  const list = (block?.questions ?? []).filter((q) => !wrongOnly || q.chosen !== q.answerId);

  return (
    <View className="gap-3">
      <Text className="font-display text-[20px] text-ink">Go through the paper</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {r.review!.map((b) => (
          <PressableScale key={b.subjectId} accessibilityRole="tab" accessibilityState={{ selected: b.subjectId === subjectId }} onPress={() => setSubjectId(b.subjectId)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: b.subjectId === subjectId ? theme.accent : '#FFFFFF' }}>
            <Text className="font-body-bold text-[13px]" style={{ color: b.subjectId === subjectId ? '#FFFFFF' : palette.ink.DEFAULT }}>
              {b.name}
            </Text>
          </PressableScale>
        ))}
      </ScrollView>
      <PressableScale accessibilityRole="switch" accessibilityState={{ checked: wrongOnly }} onPress={() => setWrongOnly((x) => !x)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' }}>
        <Ionicons name={wrongOnly ? 'checkbox' : 'square-outline'} size={20} color={theme.accent} />
        <Text className="font-body-semibold text-[14px] text-ink">Only show the ones I missed</Text>
      </PressableScale>
      {!list.length ? <Caption className="text-[14px]">{wrongOnly ? 'You got every question in this subject right!' : 'No questions.'}</Caption> : null}
      {list.map((q) => {
        const n = block!.questions.indexOf(q) + 1;
        const right = q.chosen === q.answerId;
        return (
          <View key={q.id} className="gap-2 rounded-[18px] bg-white p-4">
            <View className="flex-row items-center gap-2">
              <Ionicons name={right ? 'checkmark-circle' : 'close-circle'} size={20} color={right ? palette.mint[400] : palette.coral[500]} />
              <Text className="font-body-bold text-[13px] text-ink-500">Question {n}</Text>
            </View>
            <MathText text={q.prompt} size={15} fontFamily={fonts.bodySemibold} />
            <View className="gap-1">
              {q.options.map((o, i) => {
                const isAnswer = o.id === q.answerId;
                const isChosen = o.id === q.chosen;
                return (
                  <View key={o.id} className="flex-row items-start gap-2 rounded-xl px-2 py-1.5" style={{ backgroundColor: isAnswer ? palette.mint[50] : isChosen ? palette.coral[50] : 'transparent' }}>
                    <Text className="w-4 font-body-bold text-[14px] text-ink-500">{LETTERS[i]}</Text>
                    <View className="flex-1">
                      <MathText text={o.label} size={14} fontFamily={isAnswer ? fonts.bodyBold : fonts.body} color={isAnswer ? palette.mint[800] : palette.ink.DEFAULT} />
                    </View>
                    {isAnswer ? <Ionicons name="checkmark" size={16} color={palette.mint[800]} /> : isChosen ? <Ionicons name="close" size={16} color={palette.coral[700]} /> : null}
                  </View>
                );
              })}
            </View>
            {!q.chosen ? <Caption>You didn’t answer this one.</Caption> : null}
            <View className="gap-1 rounded-[14px] p-3" style={{ backgroundColor: theme.accentSoft }}>
              <Text className="font-body-bold text-[13px] text-ink">How to solve it</Text>
              <MathText text={q.explanation} size={14} color={palette.ink[700]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
