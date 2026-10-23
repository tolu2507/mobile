import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MathText } from '@/components/MathText';
import { Banner, CardListSkeleton, ErrorState, GameButton, PressableScale, Screen } from '@/components/ui';
import { saveMockAnswers, useMockPaper, useSubmitMock } from '@/features/mocks/api';
import { clock } from '@/features/mocks/format';
import { friendlyError } from '@/lib/api';
import { speakRich } from '@/lib/latex';
import { useNow } from '@/lib/useNow';
import { fonts, palette, roles } from '@/theme';
import type { MockPaper } from '@/types/api';
import { confirm } from '@/lib/confirm';
import { goBack } from '@/lib/nav';

const theme = roles.student;
const LETTERS = 'ABCDE';
const SAVE_AFTER_MS = 1500;
const RETRY_MS = 15_000;
const WARN_MS = 5 * 60_000;

export default function MockSitting() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const paper = useMockPaper(id);

  if (paper.isPending)
    return (
      <Screen background={theme.bg}>
        <CardListSkeleton count={5} height={60} />
      </Screen>
    );
  if (paper.isError)
    return (
      <Screen background={theme.bg}>
        <ErrorState error={paper.error} onRetry={() => void paper.refetch()} color={theme.accent} />
      </Screen>
    );
  if (paper.data.submitted) return <Redirect href={{ pathname: '/student/mocks/result/[id]', params: { id } }} />;
  return <Cbt paper={paper.data} />;
}

type Save = 'saved' | 'saving' | 'offline';

/** The exam itself: one question at a time, subject tabs, a question grid, and a clock that submits at zero. */
function Cbt({ paper }: { paper: MockPaper }) {
  const submit = useSubmitMock(paper.sittingId);
  const [answers, setAnswers] = useState<Record<string, string>>(paper.answers);
  const [subjectIdx, setSubjectIdx] = useState(0);
  const [positions, setPositions] = useState<Record<string, number>>({});
  const [gridOpen, setGridOpen] = useState(false);
  const [save, setSave] = useState<Save>('saved');
  const now = useNow(1000);

  // The server's clock is the one that counts; correct for a phone that's a few minutes off.
  const [skew] = useState(() => new Date(paper.serverNow).getTime() - Date.now());
  const deadline = new Date(paper.deadlineAt).getTime();
  const left = deadline - (now + skew);

  const pending = useRef<Record<string, string>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submitted = useRef(false);

  const subject = paper.subjects[subjectIdx];
  const qIdx = positions[subject.id] ?? 0;
  const q = subject.questions[qIdx];
  const total = paper.subjects.reduce((sum, s) => sum + s.questions.length, 0);
  const answeredCount = Object.keys(answers).length;
  const lastQuestion = subjectIdx === paper.subjects.length - 1 && qIdx === subject.questions.length - 1;

  const finish = useCallback(
    (auto: boolean) => {
      if (submitted.current) return;
      submitted.current = true;
      if (timer.current) clearTimeout(timer.current);
      submit.mutate(answers, {
        onSuccess: () => router.replace({ pathname: '/student/mocks/result/[id]', params: { id: paper.sittingId, auto: auto ? '1' : '' } }),
        onError: () => {
          // Let them retry; when time ran out, retry by itself every 10 seconds rather than every tick.
          setTimeout(() => (submitted.current = false), auto ? 10_000 : 0);
        },
      });
    },
    [answers, submit, paper.sittingId],
  );

  const flush = useCallback(async () => {
    const batch = { ...pending.current };
    if (!Object.keys(batch).length) return;
    setSave('saving');
    try {
      await saveMockAnswers(paper.sittingId, batch);
      for (const [k, v] of Object.entries(batch)) if (pending.current[k] === v) delete pending.current[k];
      setSave(Object.keys(pending.current).length ? 'saving' : 'saved');
    } catch {
      setSave('offline'); // kept in `pending`; retried below and sent again with the final submit
    }
  }, [paper.sittingId]);

  // Submit by itself at zero.
  useEffect(() => {
    if (left <= 0) finish(true);
  }, [left, finish]);

  // Retry saving while offline.
  useEffect(() => {
    if (save !== 'offline') return;
    const t = setInterval(() => void flush(), RETRY_MS);
    return () => clearInterval(t);
  }, [save, flush]);

  const choose = (optionId: string) => {
    Haptics.selectionAsync().catch(() => {});
    setAnswers((a) => ({ ...a, [q.id]: optionId }));
    pending.current[q.id] = optionId;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), SAVE_AFTER_MS);
  };

  const go = (subj: number, idx: number) => {
    setSubjectIdx(subj);
    setPositions((p) => ({ ...p, [paper.subjects[subj].id]: idx }));
  };
  const next = () => {
    if (qIdx < subject.questions.length - 1) go(subjectIdx, qIdx + 1);
    else if (subjectIdx < paper.subjects.length - 1) go(subjectIdx + 1, positions[paper.subjects[subjectIdx + 1].id] ?? 0);
  };
  const prev = () => {
    if (qIdx > 0) go(subjectIdx, qIdx - 1);
    else if (subjectIdx > 0) go(subjectIdx - 1, paper.subjects[subjectIdx - 1].questions.length - 1);
  };

  const leave = async () => {
    void flush();
    if (await confirm({ title: 'Leave the mock?', message: 'Your answers are saved, but the clock keeps running. Come back before it runs out.', confirmLabel: 'Leave', cancelLabel: 'Stay', destructive: true })) goBack('/student');
  };
  // Android back button: confirm, and remind them the clock keeps going.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      void leave();
      return true;
    });
    return () => sub.remove();
  });

  const confirmSubmit = async () => {
    const blank = total - answeredCount;
    const yes = await confirm({
      title: 'Submit your mock?',
      message: blank ? `${blank} ${blank === 1 ? 'question has' : 'questions have'} no answer. You can’t change anything after submitting.` : 'You’ve answered everything. You can’t change anything after submitting.',
      confirmLabel: 'Submit',
      cancelLabel: 'Keep going',
      destructive: true,
    });
    if (yes) finish(false);
  };

  const low = left < WARN_MS;
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ backgroundColor: palette.ink.DEFAULT }}>
        <SafeAreaView edges={['top']}>
          <View className="gap-3 px-4 pb-3 pt-2">
            <View className="flex-row items-center gap-3">
              <PressableScale accessibilityLabel="Leave the mock" onPress={leave} style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </PressableScale>
              <View className="flex-1">
                <Text numberOfLines={1} className="font-body-bold text-[14px] text-white">
                  {paper.title}
                </Text>
                <Text accessibilityLiveRegion="polite" className="font-body text-[12px]" style={{ color: save === 'offline' ? palette.sun[400] : 'rgba(255,255,255,0.7)' }}>
                  {answeredCount} of {total} answered · {save === 'saved' ? 'All saved' : save === 'saving' ? 'Saving…' : 'No connection. Your answers are kept on this phone.'}
                </Text>
              </View>
              <View accessibilityLabel={`Time left ${clock(left)}`} className="rounded-xl px-3 py-1.5" style={{ backgroundColor: low ? palette.coral[500] : 'rgba(255,255,255,0.12)' }}>
                <Text className="font-display text-[17px] text-white" style={{ fontVariant: ['tabular-nums'] }}>
                  {clock(left)}
                </Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {paper.subjects.map((s, i) => {
                const done = s.questions.filter((x) => answers[x.id]).length;
                const on = i === subjectIdx;
                return (
                  <Pressable
                    key={s.id}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={`${s.name}, ${done} of ${s.questions.length} answered`}
                    onPress={() => go(i, positions[s.id] ?? 0)}
                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: on ? '#FFFFFF' : 'rgba(255,255,255,0.12)' }}
                  >
                    <Text className="font-body-bold text-[13px]" style={{ color: on ? palette.ink.DEFAULT : '#FFFFFF' }}>
                      {s.name} · {done}/{s.questions.length}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>

      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView key={q.id} className="flex-1" contentContainerClassName="gap-4 px-5 pb-4 pt-5">
          <Text className="font-body-bold text-[13px] text-ink-500">
            {subject.name} · Question {qIdx + 1} of {subject.questions.length}
          </Text>
          <MathText text={q.prompt} size={19} fontFamily={fonts.bodySemibold} />
          <View accessibilityRole="radiogroup" className="gap-2.5">
            {q.options.map((o, i) => {
              const on = answers[q.id] === o.id;
              return (
                <PressableScale
                  key={o.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${LETTERS[i]}: ${speakRich(o.label)}`}
                  onPress={() => choose(o.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 14, borderRadius: 16, borderWidth: 2, borderColor: on ? theme.accent : palette.ink[200], backgroundColor: on ? `${theme.accent}14` : '#FFFFFF' }}
                >
                  <View className="h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: on ? theme.accent : palette.ink[100] }}>
                    <Text className="font-body-bold text-[14px]" style={{ color: on ? '#FFFFFF' : palette.ink[700] }}>
                      {LETTERS[i]}
                    </Text>
                  </View>
                  <View className="flex-1 py-3">
                    <MathText text={o.label} size={16} fontFamily={on ? fonts.bodyBold : fonts.bodySemibold} />
                  </View>
                </PressableScale>
              );
            })}
          </View>
          {submit.isError ? <Banner tone="error" message={`${friendlyError(submit.error)} Your answers are still here; try again.`} /> : null}
        </ScrollView>

        <View className="flex-row items-center gap-2 px-4 pb-3 pt-2">
          <View className="flex-1">
            <GameButton label="Previous" variant="outline" disabled={subjectIdx === 0 && qIdx === 0} onPress={prev} />
          </View>
          <PressableScale accessibilityLabel="All questions" onPress={() => setGridOpen(true)} style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: palette.ink[200], alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="grid-outline" size={22} color={palette.ink.DEFAULT} />
          </PressableScale>
          <View className="flex-1">
            {lastQuestion ? (
              <GameButton label="Submit" color={palette.coral[500]} shadowColor={palette.coral[700]} loading={submit.isPending} onPress={confirmSubmit} />
            ) : (
              <GameButton label="Next" color={theme.accent} shadowColor={theme.shadow} onPress={next} />
            )}
          </View>
        </View>
      </SafeAreaView>

      <Modal visible={gridOpen} transparent animationType="slide" onRequestClose={() => setGridOpen(false)}>
        <Pressable accessibilityLabel="Close" onPress={() => setGridOpen(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} />
        <View style={{ maxHeight: '75%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
          <SafeAreaView edges={['bottom']}>
            <ScrollView contentContainerClassName="gap-4 p-5">
              <View className="flex-row items-center justify-between">
                <Text className="font-display text-[20px] text-ink">All questions</Text>
                <GameButton
                  label="Submit"
                  size="md"
                  color={palette.coral[500]}
                  shadowColor={palette.coral[700]}
                  onPress={() => {
                    setGridOpen(false);
                    confirmSubmit();
                  }}
                />
              </View>
              {paper.subjects.map((s, si) => (
                <View key={s.id} className="gap-2">
                  <Text className="font-body-bold text-[14px] text-ink">{s.name}</Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {s.questions.map((x, qi) => {
                      const current = si === subjectIdx && qi === qIdx;
                      const done = !!answers[x.id];
                      return (
                        <Pressable
                          key={x.id}
                          accessibilityLabel={`${s.name} question ${qi + 1}${done ? ', answered' : ''}`}
                          onPress={() => {
                            go(si, qi);
                            setGridOpen(false);
                          }}
                          style={{ width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? theme.accent : palette.ink[100], borderWidth: current ? 3 : 0, borderColor: palette.sun[400] }}
                        >
                          <Text className="font-body-bold text-[13px]" style={{ color: done ? '#FFFFFF' : palette.ink[700] }}>
                            {qi + 1}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
