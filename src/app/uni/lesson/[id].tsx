import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInLeft, SlideInRight, ZoomIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState, GameButton } from '@/components/ui';
import { useLessonProgress, useUniLesson } from '@/features/uni/api';
import { CLASS } from '@/features/uni/components/classroom-theme';
import { SlideView, slideSpeech } from '@/features/uni/components/Slides';
import type { LessonDone, UniLesson } from '@/features/uni/types';
import { playSound } from '@/lib/sounds';
import { fonts } from '@/theme';
import { leave } from '@/features/uni/nav';

function Segment({ state }: { state: 'done' | 'now' | 'todo' }) {
  const fill = useAnimatedStyle(() => ({ width: withTiming(state === 'todo' ? '0%' : '100%', { duration: 350 }) }));
  return (
    <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
      <Animated.View style={[{ height: 4, borderRadius: 2, backgroundColor: state === 'now' ? CLASS.sun : CLASS.soft }, fill]} />
    </View>
  );
}

function Cover({ lesson, onStart }: { lesson: UniLesson; onStart: (from: number) => void }) {
  const resume = lesson.progress.slide > 0 && !lesson.progress.done && lesson.progress.slide < lesson.slides.length;
  return (
    <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 18 }}>
      <View style={{ gap: 18, paddingTop: 24 }}>
        <Animated.View entering={FadeInDown.duration(400)} style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <View style={{ borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: CLASS.sunSoft }}>
            <Text style={{ color: CLASS.sun, fontFamily: fonts.bodyExtrabold, fontSize: 12, letterSpacing: 0.8 }}>{lesson.course.code}</Text>
          </View>
          <View style={{ borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: CLASS.card }}>
            <Text style={{ color: CLASS.soft, fontFamily: fonts.bodySemibold, fontSize: 12 }}>
              Unit {lesson.unit.number} · {lesson.minutes} min class
            </Text>
          </View>
        </Animated.View>
        <Animated.Text entering={FadeInDown.delay(100).duration(450)} accessibilityRole="header" style={{ color: '#fff', fontFamily: fonts.display, fontSize: 36, lineHeight: 40 }}>
          {lesson.title}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(180).duration(450)} style={{ color: CLASS.muted, fontFamily: fonts.bodySemibold, fontSize: 14 }}>
          {lesson.unit.name}
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(320).springify().damping(16)} style={{ borderRadius: 24, padding: 20, backgroundColor: CLASS.card, borderWidth: 1, borderColor: CLASS.line, gap: 10 }}>
          <Ionicons name="chatbubble-ellipses" size={24} color={CLASS.sun} />
          <Text style={{ color: CLASS.text, fontFamily: fonts.bodySemibold, fontSize: 18, lineHeight: 27 }}>{lesson.hook}</Text>
        </Animated.View>
        <Animated.View entering={FadeIn.delay(520)} style={{ flexDirection: 'row', gap: 16 }}>
          {[
            { icon: 'layers-outline' as const, label: `${lesson.slides.length} steps` },
            { icon: 'help-circle-outline' as const, label: `${lesson.slides.filter((s) => s.kind === 'check').length} quick checks` },
            { icon: 'flash-outline' as const, label: 'Earn XP' },
          ].map((x) => (
            <View key={x.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name={x.icon} size={16} color={CLASS.muted} />
              <Text style={{ color: CLASS.muted, fontFamily: fonts.body, fontSize: 13 }}>{x.label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>
      <Animated.View entering={FadeInDown.delay(600).duration(400)} style={{ gap: 10 }}>
        <GameButton label={resume ? `Continue from step ${lesson.progress.slide + 1}` : lesson.progress.done ? 'Take this class again' : 'Start class'} variant="sun" size="xl" onPress={() => onStart(resume ? lesson.progress.slide : 0)} />
        {resume ? (
          <Text accessibilityRole="button" onPress={() => onStart(0)} style={{ color: CLASS.soft, fontFamily: fonts.bodyBold, fontSize: 15, textAlign: 'center', paddingVertical: 8 }}>
            Start from the beginning
          </Text>
        ) : null}
      </Animated.View>
    </View>
  );
}

function Done({ lesson, right, total, result }: { lesson: UniLesson; right: number; total: number; result: LessonDone | null }) {
  useEffect(() => {
    playSound('fanfare');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);
  const stars = [
    { x: -110, y: -40, s: 18, d: 200 },
    { x: 100, y: -60, s: 26, d: 320 },
    { x: -70, y: 70, s: 14, d: 440 },
    { x: 120, y: 50, s: 16, d: 380 },
    { x: 0, y: -110, s: 20, d: 260 },
  ];
  return (
    <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 18 }}>
      <View style={{ alignItems: 'center', gap: 16, paddingTop: 48 }}>
        <View style={{ width: 160, height: 160, alignItems: 'center', justifyContent: 'center' }}>
          {stars.map((st, i) => (
            <Animated.View key={i} entering={ZoomIn.delay(st.d).springify().damping(8)} style={{ position: 'absolute', transform: [{ translateX: st.x }, { translateY: st.y }] }}>
              <Ionicons name="sparkles" size={st.s} color={CLASS.sun} />
            </Animated.View>
          ))}
          <Animated.View entering={ZoomIn.springify().damping(9)} style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: CLASS.sun, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="school" size={58} color={CLASS.ink} />
          </Animated.View>
        </View>
        <Animated.Text entering={FadeInDown.delay(250)} accessibilityRole="header" style={{ color: '#fff', fontFamily: fonts.display, fontSize: 32, textAlign: 'center' }}>
          Class complete!
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(350)} style={{ color: CLASS.soft, fontFamily: fonts.body, fontSize: 16, textAlign: 'center', lineHeight: 23 }}>
          You’ve finished “{lesson.title}”. Now lock it in with practice questions set the way your lecturer would set them.
        </Animated.Text>
        <Animated.View entering={FadeInDown.delay(450)} style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
          {total ? (
            <View style={{ alignItems: 'center', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 18, backgroundColor: CLASS.card }}>
              <Text style={{ color: CLASS.mint, fontFamily: fonts.display, fontSize: 26 }}>
                {right}/{total}
              </Text>
              <Text style={{ color: CLASS.muted, fontFamily: fonts.body, fontSize: 12 }}>quick checks</Text>
            </View>
          ) : null}
          <View style={{ alignItems: 'center', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 18, backgroundColor: CLASS.card, minWidth: 100 }}>
            <Text style={{ color: CLASS.sun, fontFamily: fonts.display, fontSize: 26 }}>{result ? `+${result.xpEarned}` : '…'}</Text>
            <Text style={{ color: CLASS.muted, fontFamily: fonts.body, fontSize: 12 }}>XP</Text>
          </View>
          {result?.rewards.streak.extended ? (
            <View style={{ alignItems: 'center', borderRadius: 20, paddingVertical: 12, paddingHorizontal: 18, backgroundColor: CLASS.card }}>
              <Text style={{ color: '#FF8A3D', fontFamily: fonts.display, fontSize: 26 }}>{result.rewards.streak.days}</Text>
              <Text style={{ color: CLASS.muted, fontFamily: fonts.body, fontSize: 12 }}>day streak</Text>
            </View>
          ) : null}
        </Animated.View>
      </View>
      <Animated.View entering={FadeInDown.delay(600)} style={{ gap: 10 }}>
        <GameButton label="Practise this section" variant="sun" size="xl" onPress={() => router.replace({ pathname: '/uni/practice/[topicId]', params: { topicId: lesson.section.id } })} />
        {lesson.next ? (
          <GameButton label={`Next class: ${lesson.next.title}`} variant="white" color={CLASS.accentDeep} size="md" onPress={() => router.replace({ pathname: '/uni/lesson/[id]', params: { id: lesson.next!.id } })} />
        ) : null}
        <Text accessibilityRole="button" onPress={() => leave({ pathname: '/uni/course/[id]', params: { id: lesson.course.id } })} style={{ color: CLASS.soft, fontFamily: fonts.bodyBold, fontSize: 15, textAlign: 'center', paddingVertical: 8 }}>
          Back to the course
        </Text>
      </Animated.View>
    </View>
  );
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useUniLesson(id);
  const save = useLessonProgress(id);
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState<'cover' | 'class' | 'done'>('cover');
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [voice, setVoice] = useState(false);
  const [result, setResult] = useState<LessonDone | null>(null);
  const furthest = useRef(0);
  const scroller = useRef<ScrollView>(null);
  const lesson = q.data;

  // Read the slide aloud when the voice is on.
  useEffect(() => {
    Speech.stop();
    if (voice && phase === 'class' && lesson) Speech.speak(slideSpeech(lesson.slides[index]), { rate: 0.98 });
  }, [voice, phase, index, lesson]);
  useEffect(() => () => void Speech.stop(), []);

  if (q.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: CLASS.bg, justifyContent: 'center', paddingTop: insets.top }}>
        <ErrorState error={q.error} onRetry={() => void q.refetch()} />
      </View>
    );
  }
  if (!lesson) {
    return (
      <View style={{ flex: 1, backgroundColor: CLASS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View entering={FadeIn} style={{ alignItems: 'center', gap: 12 }}>
          <Ionicons name="school-outline" size={42} color={CLASS.muted} />
          <Text style={{ color: CLASS.muted, fontFamily: fonts.bodySemibold, fontSize: 15 }}>Getting the classroom ready…</Text>
        </Animated.View>
      </View>
    );
  }

  const slide = lesson.slides[index];
  const checkIdx = lesson.slides.map((s, i) => (s.kind === 'check' ? i : -1)).filter((i) => i >= 0);
  const checksAnswered = checkIdx.filter((i) => answers[i] !== undefined);
  const checksRight = checksAnswered.filter((i) => {
    const s = lesson.slides[i];
    return s.kind === 'check' && answers[i] === s.answerIndex;
  }).length;
  const blocked = slide?.kind === 'check' && answers[index] === undefined;
  const last = index === lesson.slides.length - 1;

  const go = (to: number) => {
    setDir(to > index ? 1 : -1);
    setIndex(to);
    scroller.current?.scrollTo({ y: 0, animated: false });
    if (to > furthest.current) {
      furthest.current = to;
      save.mutate({ slide: to, checksRight, checksTotal: checksAnswered.length, completed: false });
    }
  };
  const finish = () => {
    Speech.stop();
    setPhase('done');
    save.mutate({ slide: lesson.slides.length, checksRight, checksTotal: checksAnswered.length, completed: true }, { onSuccess: setResult });
  };

  return (
    <LinearGradient colors={[CLASS.bgTop, CLASS.bg, CLASS.bg]} style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Top bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Leave class" onPress={() => leave({ pathname: '/uni/course/[id]', params: { id: lesson.course.id } })} hitSlop={12} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: CLASS.card, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="close" size={22} color={CLASS.text} />
        </Pressable>
        {phase === 'class' ? (
          <View style={{ flex: 1, flexDirection: 'row', gap: 3 }} accessibilityLabel={`Step ${index + 1} of ${lesson.slides.length}`}>
            {lesson.slides.map((_, i) => (
              <Segment key={i} state={i < index ? 'done' : i === index ? 'now' : 'todo'} />
            ))}
          </View>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        {phase === 'class' ? (
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: voice }}
            accessibilityLabel="Read aloud"
            onPress={() => setVoice(!voice)}
            hitSlop={12}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: voice ? CLASS.sun : CLASS.card, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name={voice ? 'volume-high' : 'volume-mute'} size={19} color={voice ? CLASS.ink : CLASS.text} />
          </Pressable>
        ) : null}
      </View>

      {phase === 'cover' ? (
        <Cover
          lesson={lesson}
          onStart={(from) => {
            furthest.current = Math.max(furthest.current, from);
            setIndex(from);
            setPhase('class');
            playSound('whoosh');
          }}
        />
      ) : null}

      {phase === 'class' && slide ? (
        <>
          <ScrollView ref={scroller} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
            <Animated.View key={index} entering={(dir === 1 ? SlideInRight : SlideInLeft).springify().damping(20).mass(0.8)}>
              <SlideView slide={slide} answered={answers[index] ?? null} onAnswer={(i) => setAnswers((a) => ({ ...a, [index]: i }))} />
            </Animated.View>
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, borderTopWidth: 1, borderTopColor: CLASS.line }}>
            {index > 0 ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Previous step" onPress={() => go(index - 1)} style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: CLASS.card, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="arrow-back" size={22} color={CLASS.text} />
              </Pressable>
            ) : null}
            <View style={{ flex: 1 }}>
              <GameButton label={blocked ? 'Answer to continue' : last ? 'Finish class' : 'Next'} variant="sun" disabled={blocked} onPress={() => (last ? finish() : go(index + 1))} />
            </View>
          </View>
        </>
      ) : null}

      {phase === 'done' ? <Done lesson={lesson} right={checksRight} total={checksAnswered.length} result={result} /> : null}
    </LinearGradient>
  );
}
