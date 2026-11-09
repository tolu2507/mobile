import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, PressableScale, ProgressBar, Screen, Skeleton } from '@/components/ui';
import { courseIcon, courseTone, useUniCourse } from '@/features/uni/api';
import { UNI } from '@/features/uni/components/classroom-theme';
import type { UniCourse, UniSection } from '@/features/uni/types';
import { fonts, palette } from '@/theme';
import { leave } from '@/features/uni/nav';

const LEVEL_NAMES = ['', 'Warm-up', 'Getting it', 'Applying it', 'Tricky ones', 'Lecturer level'];

function SectionRow({ s, tone, last }: { s: UniSection; tone: ReturnType<typeof courseTone>; last: boolean }) {
  const p = s.practice;
  const canPractise = p.unlocked && (p.fresh > 0 || p.answered > 0);
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {/* The path line down the unit */}
      <View style={{ alignItems: 'center', width: 30 }}>
        <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: s.lesson?.done ? tone.from : '#fff', borderWidth: 2, borderColor: s.lesson?.done ? tone.from : '#E4E1F2' }}>
          {s.lesson?.done ? <Ionicons name="checkmark" size={17} color="#fff" /> : <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#D5D1EA' }} />}
        </View>
        {!last ? <View style={{ flex: 1, width: 2, backgroundColor: '#E4E1F2' }} /> : null}
      </View>
      <View style={{ flex: 1, paddingBottom: last ? 0 : 16, gap: 8 }}>
        <Text style={{ color: palette.ink.DEFAULT, fontFamily: fonts.bodyBold, fontSize: 15.5, lineHeight: 20, marginTop: 4 }}>{s.name}</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {s.lesson ? (
            <PressableScale
              accessibilityLabel={`${s.lesson.done ? 'Watch again' : s.lesson.slide ? 'Continue' : 'Start'} class: ${s.lesson.title}, ${s.lesson.minutes} minutes`}
              onPress={() => router.push({ pathname: '/uni/lesson/[id]', params: { id: s.lesson!.id } })}
              style={{ flex: 1.25 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: s.lesson.done ? tone.soft : tone.from }}>
                <Ionicons name={s.lesson.done ? 'refresh' : 'play'} size={16} color={s.lesson.done ? tone.ink : '#fff'} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: s.lesson.done ? tone.ink : '#fff', fontFamily: fonts.bodyBold, fontSize: 13.5 }}>{s.lesson.done ? 'Watch again' : s.lesson.slide ? 'Continue class' : 'Start class'}</Text>
                  <Text style={{ color: s.lesson.done ? tone.ink : 'rgba(255,255,255,0.8)', fontFamily: fonts.body, fontSize: 11.5 }}>{s.lesson.minutes} min</Text>
                </View>
              </View>
            </PressableScale>
          ) : null}
          <PressableScale
            disabled={!canPractise}
            accessibilityState={{ disabled: !canPractise }}
            accessibilityLabel={!p.unlocked ? 'Practice locked: pass level 1 of the section before' : `Practice, level ${p.level}${p.bossBeaten ? ', boss beaten' : ''}`}
            onPress={() => router.push({ pathname: '/uni/practice/[topicId]', params: { topicId: s.id } })}
            style={{ flex: 1 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: canPractise ? '#E4E1F2' : '#F0EEF8', opacity: canPractise ? 1 : 0.6 }}>
              <MaterialCommunityIcons name={!p.unlocked ? 'lock' : p.bossBeaten ? 'crown' : p.level === 5 ? 'sword-cross' : 'target'} size={17} color={p.bossBeaten ? palette.sun[600] : tone.ink} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: palette.ink.DEFAULT, fontFamily: fonts.bodyBold, fontSize: 13.5 }}>{p.bossBeaten ? 'Mastered' : p.level === 5 ? 'Boss round' : 'Practise'}</Text>
                <Text numberOfLines={1} style={{ color: palette.ink[500], fontFamily: fonts.body, fontSize: 11.5 }}>
                  {!p.unlocked ? 'Locked' : p.fresh === 0 && p.answered === 0 ? 'Coming soon' : `Lv ${p.level} · ${LEVEL_NAMES[p.level]}`}
                </Text>
              </View>
            </View>
          </PressableScale>
        </View>
        {p.answered > 0 ? (
          <View style={{ flexDirection: 'row', gap: 3 }} accessibilityLabel={`Level ${p.level} of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <View key={n} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: n < p.level || p.bossBeaten ? tone.from : n === p.level ? tone.to : '#ECEAF6', opacity: n === p.level && !p.bossBeaten ? 0.55 : 1 }} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Unit({ u, tone, index, open, onToggle }: { u: UniCourse['units'][number]; tone: ReturnType<typeof courseTone>; index: number; open: boolean; onToggle: () => void }) {
  const done = u.sections.filter((s) => s.lesson?.done).length;
  const total = u.sections.filter((s) => s.lesson).length;
  return (
    <Animated.View entering={FadeInDown.delay(80 + Math.min(index, 8) * 50).springify().damping(17)} style={{ borderRadius: 24, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEAF6', overflow: 'hidden' }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: done === total && total ? tone.from : tone.soft, alignItems: 'center', justifyContent: 'center' }}>
          {done === total && total ? <Ionicons name="checkmark-done" size={22} color="#fff" /> : <Text style={{ color: tone.ink, fontFamily: fonts.display, fontSize: 18 }}>{u.number}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: palette.ink[500], fontFamily: fonts.bodyBold, fontSize: 11.5, letterSpacing: 0.8 }}>UNIT {u.number}</Text>
          <Text style={{ color: palette.ink.DEFAULT, fontFamily: fonts.display, fontSize: 17, lineHeight: 21 }}>{u.name}</Text>
          {open && u.summary ? <Text style={{ color: palette.ink[500], fontFamily: fonts.body, fontSize: 13, lineHeight: 18, marginTop: 4 }}>{u.summary}</Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={{ color: palette.ink[500], fontFamily: fonts.bodySemibold, fontSize: 12 }}>
            {done}/{total}
          </Text>
          <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={palette.ink[300]} />
        </View>
      </Pressable>
      {open ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          {u.sections.map((s, i) => (
            <SectionRow key={s.id} s={s} tone={tone} last={i === u.sections.length - 1} />
          ))}
        </View>
      ) : null}
    </Animated.View>
  );
}

export default function CourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = useUniCourse(id);
  const insets = useSafeAreaInsets();
  const [opened, setOpened] = useState<Set<string> | null>(null);
  const c = course.data;
  const tone = courseTone(c?.code ?? '');

  // The first unit not finished starts open.
  const firstOpen = c?.units.find((u) => u.sections.some((s) => s.lesson && !s.lesson.done))?.id ?? c?.units[0]?.id;
  const isOpen = (uid: string) => (opened ? opened.has(uid) : uid === firstOpen);
  const toggle = (uid: string) =>
    setOpened((prev) => {
      const next = new Set(prev ?? (firstOpen ? [firstOpen] : []));
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });

  const lessons = c?.units.flatMap((u) => u.sections.filter((s) => s.lesson)) ?? [];
  const done = lessons.filter((s) => s.lesson!.done).length;

  const header = (
    <LinearGradient colors={[tone.from, tone.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 22, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => leave()} hitSlop={12} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="chevron-back" size={22} color="#fff" />
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14 }}>
        <View style={{ width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name={courseIcon(c?.code ?? '')} size={32} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontFamily: fonts.bodyExtrabold, fontSize: 13, letterSpacing: 1 }}>{c?.code ?? ' '}</Text>
          <Text accessibilityRole="header" style={{ color: '#fff', fontFamily: fonts.display, fontSize: 23, lineHeight: 27 }}>{c?.title ?? ' '}</Text>
        </View>
      </View>
      {c ? (
        <View style={{ marginTop: 16, gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#fff', fontFamily: fonts.bodySemibold, fontSize: 13 }}>
              {done}/{lessons.length} classes · {c.units.length} units
            </Text>
            <Text style={{ color: '#fff', fontFamily: fonts.bodyBold, fontSize: 13 }}>{Math.round(c.mastery * 100)}% mastery</Text>
          </View>
          <ProgressBar value={lessons.length ? done / lessons.length : 0} color="#fff" track="rgba(255,255,255,0.25)" height={8} />
        </View>
      ) : null}
    </LinearGradient>
  );

  return (
    <Screen background={UNI.bg} header={header} refreshing={course.isRefetching} onRefresh={() => void course.refetch()} accent={tone.from}>
      {course.isError ? <ErrorState error={course.error} onRetry={() => void course.refetch()} color={UNI.accent} /> : null}
      {course.isPending ? [0, 1, 2, 3].map((i) => <Skeleton key={i} height={78} radius={24} />) : null}
      {c && !c.units.length ? <EmptyState icon="hourglass-outline" title="Classes on the way" message="We’re preparing this course’s classes and practice questions. Check back soon." /> : null}
      {c?.units.map((u, i) => (
        <Unit key={u.id} u={u} tone={tone} index={i} open={isOpen(u.id)} onToggle={() => toggle(u.id)} />
      ))}
    </Screen>
  );
}
