import { useEffect, useState, type ReactNode } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInLeft, FadeInRight, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MathText } from '@/components/MathText';
import { Banner, GameButton, PressableScale } from '@/components/ui';
import { speakRich } from '@/lib/latex';
import { fonts, palette } from '@/theme';
import type { Question } from '@/types/api';

type Props = {
  questions: Question[];
  accent: string;
  shadow: string;
  background: string;
  /** Coloured top area; receives the current position. */
  header: (pos: { index: number; total: number; answered: Record<string, string> }) => ReactNode;
  submitLabel?: string;
  onSubmit: (answers: Record<string, string>) => void;
  submitting?: boolean;
  error?: string | null;
  /** Bigger text and buttons for primary pupils. */
  playful?: boolean;
  /** Called on every answer change (e.g. so a timer can auto-submit what's there). */
  onChange?: (answers: Record<string, string>) => void;
  /** Optional label above a question (e.g. "Review"). */
  tag?: (q: Question) => ReactNode;
};

/** One question at a time, answers kept on the phone until "Submit". Used by quests and lesson quizzes. */
export function QuizPlayer({ questions, accent, shadow, background, header, submitLabel = 'Finish', onSubmit, submitting, error, playful, onChange, tag }: Props) {
  const [index, setIndex] = useState(0);
  const [forward, setForward] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const q = questions[index];
  const last = index === questions.length - 1;

  const submit = () => {
    const missing = questions.length - Object.keys(answers).length;
    if (!missing) return onSubmit(answers);
    Alert.alert(`${missing} ${missing === 1 ? 'question has' : 'questions have'} no answer`, 'Unanswered questions count as wrong. Submit anyway?', [
      { text: 'Go back', style: 'cancel' },
      { text: 'Submit', onPress: () => onSubmit(answers) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      {header({ index, total: questions.length, answered: answers })}
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView key={q.id} className="flex-1" contentContainerClassName="gap-4 px-5 pt-6 pb-4">
          <Animated.View entering={(forward ? FadeInRight : FadeInLeft).duration(240)}>
            <View className="gap-4">
              {tag?.(q)}
              <MathText text={q.prompt} size={playful ? 24 : 20} fontFamily={fonts.displayBold} mathFont={fonts.bodySemibold} />
              <View accessibilityRole="radiogroup" className="gap-2.5">
                {q.options.map((o, i) => (
                  <Option
                    key={o.id}
                    label={o.label}
                    index={i}
                    selected={answers[q.id] === o.id}
                    accent={accent}
                    playful={playful}
                    onPress={() => {
                      const next = { ...answers, [q.id]: o.id };
                      setAnswers(next);
                      onChange?.(next);
                    }}
                  />
                ))}
              </View>
            </View>
          </Animated.View>

          {error ? (
            <Animated.View entering={FadeIn}>
              <Banner tone="error" message={`${error} Your answers are still here.`} />
            </Animated.View>
          ) : null}
        </ScrollView>
        <View className="px-5">
          <View className="flex-row gap-2.5 pb-3 pt-2">
            <View className="flex-1">
              <GameButton
                label="Back"
                variant="outline"
                disabled={index === 0 || submitting}
                onPress={() => {
                  setForward(false);
                  setIndex((i) => i - 1);
                }}
              />
            </View>
            <View className="flex-[2]">
              {last ? (
                <GameButton label={submitLabel} color={accent} shadowColor={shadow} loading={submitting} onPress={submit} />
              ) : (
                <GameButton
                  label="Next"
                  color={accent}
                  shadowColor={shadow}
                  disabled={!answers[q.id]}
                  onPress={() => {
                    setForward(true);
                    setIndex((i) => i + 1);
                  }}
                />
              )}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

/** One answer choice: cascades in with its siblings and gives a springy pop when picked. */
function Option({ label, index, selected, accent, playful, onPress }: { label: string; index: number; selected: boolean; accent: string; playful?: boolean; onPress: () => void }) {
  const pop = useSharedValue(1);
  useEffect(() => {
    if (selected) pop.set(withSequence(withTiming(1.04, { duration: 90 }), withSpring(1, { damping: 8, stiffness: 300 })));
  }, [selected, pop]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <Animated.View entering={FadeInDown.delay(60 * index).duration(260)} style={style}>
      <PressableScale
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={speakRich(label)}
        onPress={onPress}
        style={{
          minHeight: playful ? 64 : 58,
          paddingHorizontal: 16,
          borderRadius: 18,
          borderWidth: 2,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          borderColor: selected ? accent : palette.ink[200],
          backgroundColor: selected ? `${accent}14` : '#FFFFFF',
        }}
      >
        <View style={{ width: 24, height: 24, borderRadius: 999, borderWidth: 2, borderColor: selected ? accent : palette.ink[300], alignItems: 'center', justifyContent: 'center' }}>
          {selected ? <Animated.View entering={ZoomIn.springify().damping(10)} style={{ width: 12, height: 12, borderRadius: 999, backgroundColor: accent }} /> : null}
        </View>
        <View className="flex-1 py-3">
          <MathText text={label} size={playful ? 18 : 16} fontFamily={selected ? fonts.bodyBold : fonts.bodySemibold} />
        </View>
      </PressableScale>
    </Animated.View>
  );
}

function Segment({ state }: { state: 'current' | 'answered' | 'todo' }) {
  const fill = useSharedValue(state === 'todo' ? 0 : 1);
  useEffect(() => {
    fill.set(withTiming(state === 'todo' ? 0 : 1, { duration: 320 }));
  }, [state, fill]);
  const style = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  return (
    <View style={{ flex: 1, height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', borderRadius: 999, backgroundColor: state === 'current' ? palette.sun[400] : '#FFFFFF' }, style]} />
    </View>
  );
}

/** Thin progress segments for quiz headers; each fills in as you reach or answer it. */
export function QuizProgress({ index, total, answered, ids }: { index: number; total: number; answered: Record<string, string>; ids: string[] }) {
  return (
    <View accessibilityLabel={`Question ${index + 1} of ${total}`} className="flex-row gap-1.5">
      {ids.map((id, i) => (
        <Segment key={id} state={i === index ? 'current' : answered[id] ? 'answered' : 'todo'} />
      ))}
    </View>
  );
}
