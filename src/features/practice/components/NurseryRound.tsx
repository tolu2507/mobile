import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Confetti, CountUp, Flame, PopIn, Pulse, Stars, starsForScore } from '@/components/game';
import { RewardCard } from '@/components/RewardCard';
import { Banner, Body, GameButton, PressableScale } from '@/components/ui';
import { hush, say, useVoice } from '@/lib/speech';
import { fonts, palette, type RoleTheme } from '@/theme';
import type { PracticeQuestion, PracticeResult } from '@/types/api';
import { StickerFace } from '@/features/student/components/Sticker';
import { goBack } from '@/lib/nav';
import { parseNurseryLabel, parseNurseryStem, pictureCount, PRAISE, TRY_AGAIN } from '../nursery';

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const NEXT_AFTER_RIGHT = 1400;

/**
 * A nursery round: one big picture question at a time, read aloud. Tapping an answer is final and the
 * child hears straight away whether it was right; a wrong answer shows the right one and waits for "Next".
 */
export function NurseryPlayer({ questions, theme, submitting, error, onSubmit }: { questions: PracticeQuestion[]; theme: RoleTheme; submitting: boolean; error: string | null; onSubmit: (answers: Record<string, string>) => void }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const q = questions[index];
  const stem = parseNurseryStem(q.prompt);
  const chosen = answers[q.id];
  const right = chosen != null && chosen === q.answerId;
  const done = Object.keys(answers).length === questions.length;
  const muted = useVoice((v) => v.muted);

  useEffect(() => {
    const t = setTimeout(() => say(stem.spoken), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per question, even when two read the same
  }, [q.id]);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      hush();
    },
    [],
  );

  const next = (all: Record<string, string>) => {
    clearTimeout(timer.current);
    if (index === questions.length - 1) return onSubmit(all);
    hush();
    setIndex((i) => i + 1);
  };

  const answer = (id: string) => {
    if (chosen) return;
    const all = { ...answers, [q.id]: id };
    setAnswers(all);
    if (id === q.answerId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      say(pick(PRAISE));
      if (index < questions.length - 1) timer.current = setTimeout(() => next(all), NEXT_AFTER_RIGHT);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      say(`${pick(TRY_AGAIN)} ${q.explanation ?? ''}`);
    }
  };

  const size = (n: number) => (n <= 1 ? 96 : n <= 3 ? 64 : n <= 5 ? 44 : 36);
  const pictureSize = stem.picture ? size(Math.max(...stem.picture.split('\n').map(pictureCount))) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View
        style={{
          backgroundColor: theme.accent,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
        }}
      >
        <SafeAreaView edges={['top']}>
          <View className="flex-row items-center gap-3 px-5 pb-4 pt-3">
            <PressableScale
              accessibilityLabel="Stop playing"
              onPress={() => goBack('/student/practice')}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: 'rgba(0,0,0,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </PressableScale>
            <View accessibilityLabel={`Question ${index + 1} of ${questions.length}`} className="flex-1 flex-row flex-wrap items-center justify-center gap-1">
              {questions.map((x, i) => {
                const a = answers[x.id];
                return a ? (
                  <Animated.View key={x.id} entering={ZoomIn.springify().damping(9)}>
                    <Ionicons name={a === x.answerId ? 'star' : 'ellipse'} size={a === x.answerId ? 22 : 12} color={a === x.answerId ? palette.sun[400] : 'rgba(255,255,255,0.45)'} style={{ marginHorizontal: a === x.answerId ? 0 : 5 }} />
                  </Animated.View>
                ) : (
                  <View
                    key={x.id}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      marginHorizontal: 5,
                      borderWidth: 2,
                      borderColor: i === index ? palette.sun[400] : 'rgba(255,255,255,0.6)',
                    }}
                  />
                );
              })}
            </View>
            <VoiceToggle onUnmute={() => say(stem.spoken)} />
          </View>
        </SafeAreaView>
      </View>

      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <ScrollView key={q.id} className="flex-1" contentContainerClassName="gap-5 px-5 pb-4 pt-5">
          <Animated.View entering={FadeInRight.duration(260)} className="gap-4">
            <View className="flex-row items-center gap-3">
              {muted ? null : (
                <PressableScale
                  accessibilityLabel="Hear the question again"
                  onPress={() => say(stem.spoken)}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: theme.shadow,
                    shadowOpacity: 0.25,
                    shadowRadius: 0,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 2,
                  }}
                >
                  <Ionicons name="volume-high" size={28} color={theme.accent} />
                </PressableScale>
              )}
              <Text className="flex-1 font-display text-[24px] leading-[29px] text-ink">{stem.question}</Text>
            </View>
            {stem.picture ? (
              <Animated.View entering={ZoomIn.delay(120).springify().damping(12)} className="items-center rounded-[28px] bg-white px-4 py-5">
                <Text
                  accessible={false}
                  style={{
                    fontSize: pictureSize,
                    lineHeight: pictureSize * 1.25,
                    textAlign: 'center',
                    color: palette.ink.DEFAULT,
                  }}
                >
                  {stem.picture}
                </Text>
              </Animated.View>
            ) : null}
          </Animated.View>

          <View accessibilityRole="radiogroup" className="flex-row flex-wrap justify-between gap-y-3">
            {q.options.map((o, i) => (
              <Tile key={o.id} label={o.label} index={i} state={!chosen ? 'idle' : o.id === q.answerId ? 'right' : o.id === chosen ? 'wrong' : 'faded'} theme={theme} onPress={() => answer(o.id)} />
            ))}
          </View>

          {error ? <Banner tone="error" message={`${error} Tap the button to try again.`} /> : null}
        </ScrollView>

        {chosen && (!right || done) ? (
          <Animated.View entering={FadeInDown.springify()} className="px-5 pb-3 pt-2">
            <Pulse active={!submitting}>
              <GameButton label={index === questions.length - 1 ? 'See my stars' : 'Next'} size="xl" color={theme.accent} shadowColor={theme.shadow} loading={submitting} onPress={() => next(answers)} />
            </Pulse>
          </Animated.View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

/** Voice on or off, remembered on this phone; turning it back on reads the current question again. */
export function VoiceToggle({ onUnmute }: { onUnmute?: () => void }) {
  const { muted, toggle } = useVoice();
  return (
    <PressableScale
      accessibilityRole="switch"
      accessibilityState={{ checked: !muted }}
      accessibilityLabel={muted ? 'Voice is off. Turn it on' : 'Voice is on. Turn it off'}
      onPress={() => {
        toggle();
        if (muted) onUnmute?.();
      }}
      style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={22} color="#FFFFFF" />
    </PressableScale>
  );
}

type TileState = 'idle' | 'right' | 'wrong' | 'faded';

/** One big answer: a picture, a picture with its word, or a big number or letter. */
function Tile({ label, index, state, theme, onPress }: { label: string; index: number; state: TileState; theme: RoleTheme; onPress: () => void }) {
  const { picture, word } = parseNurseryLabel(label);
  const n = picture ? pictureCount(picture) : 0;
  const pictureSize = n <= 1 ? 64 : n <= 2 ? 48 : n <= 4 ? 36 : n <= 6 ? 28 : 24;
  const anim = useSharedValue(0);
  useEffect(() => {
    if (state === 'right') anim.set(withSequence(withTiming(1.08, { duration: 120 }), withSpring(1, { damping: 6, stiffness: 260 })));
    if (state === 'wrong') anim.set(withSequence(withTiming(-1, { duration: 60 }), withTiming(1, { duration: 60 }), withTiming(-1, { duration: 60 }), withTiming(0, { duration: 60 })));
  }, [state, anim]);
  const style = useAnimatedStyle(() => (state === 'wrong' ? { transform: [{ translateX: anim.value * 8 }] } : state === 'right' ? { transform: [{ scale: anim.value || 1 }] } : {}));

  const border = state === 'right' ? palette.mint[400] : state === 'wrong' ? palette.coral[500] : palette.ink[200];
  const bg = state === 'right' ? palette.mint[50] : state === 'wrong' ? palette.coral[50] : '#FFFFFF';
  return (
    <Animated.View entering={FadeInDown.delay(80 * index).duration(280)} style={[{ width: '48%', opacity: state === 'faded' ? 0.45 : 1 }, style]}>
      <PressableScale
        accessibilityRole="radio"
        accessibilityState={{
          checked: state === 'right' || state === 'wrong',
          disabled: state !== 'idle',
        }}
        accessibilityLabel={word ?? label}
        disabled={state !== 'idle'}
        onPress={onPress}
        style={{
          aspectRatio: 1,
          borderRadius: 26,
          borderWidth: 3,
          borderColor: border,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 10,
          gap: 4,
          borderBottomWidth: 6,
        }}
      >
        {picture ? (
          <Text
            style={{
              fontSize: pictureSize,
              lineHeight: pictureSize * 1.25,
              textAlign: 'center',
              color: palette.ink.DEFAULT,
            }}
          >
            {picture}
          </Text>
        ) : null}
        {word ? (
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{
              fontFamily: fonts.display,
              fontSize: picture ? 20 : 56,
              color: palette.ink.DEFAULT,
            }}
          >
            {word}
          </Text>
        ) : null}
        {state === 'right' || state === 'wrong' ? (
          <Animated.View
            entering={ZoomIn.springify().damping(9)}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 30,
              height: 30,
              borderRadius: 15,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: state === 'right' ? palette.mint[400] : palette.coral[500],
            }}
          >
            <Ionicons name={state === 'right' ? 'checkmark' : 'close'} size={20} color="#FFFFFF" />
          </Animated.View>
        ) : null}
      </PressableScale>
    </Animated.View>
  );
}

/** Stars, a cheer read aloud, and straight back into another round. */
export function NurseryResults({ result, theme, onNext }: { result: PracticeResult; theme: RoleTheme; onNext: () => void }) {
  const total = result.results.length;
  const correct = result.results.filter((r) => r.correct).length;
  const stars = Math.max(1, starsForScore(total ? (correct / total) * 100 : 0));
  const up = result.levelAfter > result.levelBefore || result.bossBeaten;
  const headline = stars === 3 ? 'Superstar!' : stars === 2 ? 'Well done!' : 'Good try!';
  const { rewards } = result;

  useEffect(() => {
    const t = setTimeout(() => say(`${headline} You got ${correct} out of ${total}.${up ? ' You moved up a level!' : ''}`), 600);
    return () => {
      clearTimeout(t);
      hush();
    };
  }, [headline, correct, total, up]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-8">
        <View className="items-center gap-4">
          <View className="items-center justify-center" style={{ minHeight: 120 }}>
            <Stars earned={stars} size={64} />
            {stars >= 2 || up ? <Confetti count={up ? 60 : 40} /> : null}
          </View>
          <Animated.View entering={FadeInDown.delay(900).springify()}>
            <Text accessibilityRole="header" className="text-center font-display text-[34px] text-ink">
              {headline}
            </Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(1050)}>
            <Body className="text-center text-[18px] text-ink-700">
              {correct} out of {total} right
              {up ? '. You moved up a level!' : '.'}
            </Body>
          </Animated.View>
          {result.xpEarned > 0 ? (
            <PopIn delay={1400}>
              <View accessibilityLabel={`${result.xpEarned} XP earned`} className="flex-row items-center gap-2 rounded-full bg-white px-5 py-3">
                <Ionicons name="flash" size={22} color={theme.accent} />
                <Text className="font-display text-[22px] text-ink">+</Text>
                <CountUp value={result.xpEarned} delay={1550} color={palette.ink.DEFAULT} />
                <Text className="font-display text-[22px] text-ink">XP</Text>
              </View>
            </PopIn>
          ) : null}
        </View>

        {rewards.streak.extended ? (
          <PopIn delay={1900}>
            <RewardCard tone="coral" icon={<Flame size={30} color={palette.coral[500]} />} title={rewards.streak.days === 1 ? 'Streak started!' : `${rewards.streak.days} days in a row!`} body="Come back tomorrow to keep it going." />
          </PopIn>
        ) : null}
        {rewards.newBadges.map((b, i) => (
          <PopIn key={b.code} delay={2300 + i * 450}>
            <RewardCard tone="sun" icon={<StickerFace icon={b.icon} rarity={b.rarity} size={48} />} title={`New sticker: ${b.name}`} body={b.description} />
          </PopIn>
        ))}

        <Animated.View entering={FadeIn.delay(1600)} className="gap-2.5">
          <Pulse>
            <GameButton label="Play again" size="xl" color={theme.accent} shadowColor={theme.shadow} onPress={onNext} />
          </Pulse>
          <GameButton label="All done" variant="outline" onPress={() => goBack('/student/practice')} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
