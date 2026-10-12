import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, AppState, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuizPlayer, QuizProgress } from '@/components/QuizPlayer';
import { Body, CardListSkeleton, Display, ErrorState, GameButton, PressableScale, Screen } from '@/components/ui';
import { useStartTest, useSubmitTest } from '@/features/tutor/api';
import { friendlyError } from '@/lib/api';
import { useNow } from '@/lib/useNow';
import { fonts, palette, roles } from '@/theme';
import type { EducationLevel } from '@/types/api';

const theme = roles.tutor;
const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function VettingTestScreen() {
  const { subject, level } = useLocalSearchParams<{ subject: string; level: EducationLevel }>();
  const start = useStartTest();
  const submit = useSubmitTest();
  const navigation = useNavigation();
  const answersRef = useRef<Record<string, string>>({});
  const appSwitches = useRef(0);
  const now = useNow(1000);
  const test = start.data;
  const leftMs = test ? Date.parse(test.expiresAt) - now : 1;
  const finished = !!submit.data;

  // Start (or resume) the attempt once.
  useEffect(() => {
    start.mutate({ subject, level });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, level]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'background') appSwitches.current += 1; });
    return () => sub.remove();
  }, []);

  const doSubmit = (answers: Record<string, string>) => {
    if (!test || submit.isPending || finished) return;
    submit.mutate({ attemptId: test.attemptId, answers, appSwitches: appSwitches.current });
  };

  // Time's up: submit whatever is answered.
  useEffect(() => {
    if (test && leftMs <= 0 && !finished && !submit.isPending) doSubmit(answersRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftMs <= 0, test]);

  // Confirm before leaving mid-test.
  useEffect(
    () =>
      navigation.addListener('beforeRemove', (e) => {
        if (finished || !test) return;
        e.preventDefault();
        Alert.alert('Leave the test?', 'The timer keeps running. You can come back and continue until it runs out.', [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ]);
      }),
    [navigation, finished, test],
  );

  if (start.isPending || (!test && !start.isError)) return <Screen background={theme.bg}><CardListSkeleton count={5} height={64} /></Screen>;
  if (start.isError) return <Screen background={theme.bg}><ErrorState error={start.error} onRetry={() => start.mutate({ subject, level })} color={theme.accent} /></Screen>;

  if (submit.data) {
    const r = submit.data;
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <Animated.View entering={ZoomIn.springify()} className="h-24 w-24 items-center justify-center rounded-[32px]" style={{ backgroundColor: r.passed ? palette.mint[400] : palette.amber[500] }}>
            <Ionicons name={r.passed ? 'checkmark-done' : 'refresh'} size={48} color="#FFFFFF" />
          </Animated.View>
          <Display className="text-center text-[30px]">{r.passed ? 'You passed!' : 'Not this time'}</Display>
          <Body className="text-center text-ink-700">
            You scored {Math.round(r.score * 100)}% ({r.correct} of {r.total}). The pass mark is {Math.round(r.passMark * 100)}%.
            {r.late ? ' The test was submitted after the time ran out.' : ''}
            {r.passed ? ' Next: a short interview with the Nexus team. We’ll call you within 2 working days.' : ' You can retake it in 7 days.'}
          </Body>
          <GameButton label="Back to my application" color={theme.accent} shadowColor={theme.shadow} className="mt-2 self-stretch" onPress={() => router.replace('/tutor')} />
        </View>
      </SafeAreaView>
    );
  }

  const lowTime = leftMs < 5 * 60_000;
  return (
    <QuizPlayer
      questions={test!.questions}
      accent={theme.accent}
      shadow={theme.shadow}
      background={theme.bg}
      submitLabel="Submit test"
      submitting={submit.isPending}
      error={submit.isError ? friendlyError(submit.error) : null}
      onChange={(a) => (answersRef.current = a)}
      onSubmit={doSubmit}
      header={(pos) => (
        <View style={{ backgroundColor: theme.accent, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
          <SafeAreaView edges={['top']}>
            <View className="gap-4 px-5 pb-5 pt-3">
              <View className="flex-row items-center justify-between">
                <PressableScale accessibilityLabel="Leave test" onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </PressableScale>
                <View accessibilityLabel={`${mmss(leftMs)} left`} className="flex-row items-center gap-1.5 rounded-full px-3 py-2" style={{ backgroundColor: lowTime ? palette.sun[400] : 'rgba(0,0,0,0.18)' }}>
                  <Ionicons name="timer-outline" size={16} color={lowTime ? palette.ink.DEFAULT : '#FFFFFF'} />
                  <Text style={{ color: lowTime ? palette.ink.DEFAULT : '#FFFFFF', fontFamily: fonts.bodyBold, fontVariant: ['tabular-nums'] }} className="text-[14px]">{mmss(leftMs)}</Text>
                </View>
              </View>
              <QuizProgress {...pos} ids={test!.questions.map((q) => q.id)} />
              <View className="gap-1">
                <Text className="font-display text-[24px] text-white">{test!.title}</Text>
                <Text className="font-body text-[14px]" style={{ color: '#FFE7DF' }}>Question {pos.index + 1} of {pos.total} · pass mark {Math.round(test!.passMark * 100)}%</Text>
              </View>
            </View>
          </SafeAreaView>
        </View>
      )}
    />
  );
}
