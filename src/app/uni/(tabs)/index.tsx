import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorState, PressableScale, ProgressBar, Screen, Skeleton } from '@/components/ui';
import { courseIcon, courseTone, useUniMe } from '@/features/uni/api';
import { CLASS, UNI } from '@/features/uni/components/classroom-theme';
import type { UniCourseSummary } from '@/features/uni/types';
import { useAuth } from '@/store/auth';
import { fonts } from '@/theme';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function CourseCard({ c, index }: { c: UniCourseSummary; index: number }) {
  const tone = courseTone(c.code);
  const ready = c.lessons > 0;
  return (
    <Animated.View entering={FadeInDown.delay(120 + index * 70).springify().damping(16)}>
      <PressableScale accessibilityLabel={`${c.code}, ${c.title}. ${c.lessonsDone} of ${c.lessons} classes done`} onPress={() => router.push({ pathname: '/uni/course/[id]', params: { id: c.id } })}>
        <View style={{ borderRadius: 24, backgroundColor: '#fff', overflow: 'hidden', borderWidth: 1, borderColor: '#ECEAF6' }}>
          <LinearGradient colors={[tone.from, tone.to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name={courseIcon(c.code)} size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontFamily: fonts.bodyExtrabold, fontSize: 12, letterSpacing: 1 }}>{c.code}</Text>
              <Text numberOfLines={2} style={{ color: '#fff', fontFamily: fonts.display, fontSize: 18, lineHeight: 22 }}>{c.title}</Text>
            </View>
            {c.reviewsDue ? (
              <View style={{ borderRadius: 999, backgroundColor: '#fff', paddingHorizontal: 9, paddingVertical: 4 }}>
                <Text style={{ color: tone.ink, fontFamily: fonts.bodyExtrabold, fontSize: 11 }}>{c.reviewsDue} to review</Text>
              </View>
            ) : null}
          </LinearGradient>
          <View style={{ padding: 14, gap: 10 }}>
            {ready ? (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#5A5680', fontFamily: fonts.bodySemibold, fontSize: 13 }}>
                    {c.lessonsDone}/{c.lessons} classes · {c.units} units
                  </Text>
                  <Text style={{ color: tone.ink, fontFamily: fonts.bodyBold, fontSize: 13 }}>{Math.round(c.mastery * 100)}% mastery</Text>
                </View>
                <ProgressBar value={c.lessons ? c.lessonsDone / c.lessons : 0} color={tone.from} height={8} accessibilityLabel={`${c.lessonsDone} of ${c.lessons} classes done`} />
              </>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="hourglass-outline" size={16} color="#8A85B0" />
                <Text style={{ flex: 1, color: '#5A5680', fontFamily: fonts.body, fontSize: 13 }}>Classes for this course are being prepared. We’ll have them ready soon.</Text>
              </View>
            )}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

export default function UniHome() {
  const me = useUniMe();
  const firstName = useAuth((s) => s.user?.firstName);
  const insets = useSafeAreaInsets();
  if (me.data && !me.data.courses.length) return <Redirect href="/uni/setup" />;
  const d = me.data;

  const header = (
    <LinearGradient colors={[CLASS.bgTop, CLASS.bg]} style={{ paddingHorizontal: 20, paddingBottom: 24, paddingTop: insets.top + 18, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
      <Text style={{ color: CLASS.muted, fontFamily: fonts.bodySemibold, fontSize: 14 }}>{greeting()},</Text>
      <Text accessibilityRole="header" style={{ color: '#fff', fontFamily: fonts.display, fontSize: 30 }}>{firstName ?? 'there'}</Text>
      {d?.department ? (
        <Text style={{ color: CLASS.soft, fontFamily: fonts.body, fontSize: 14, marginTop: 2 }}>
          {d.department.name} · {d.level}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <View accessibilityLabel={`${d?.streak ?? 0} day streak`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <MaterialCommunityIcons name="fire" size={18} color="#FF8A3D" />
          <Text style={{ color: '#fff', fontFamily: fonts.bodyBold, fontSize: 14 }}>{d?.streak ?? 0} day streak</Text>
        </View>
        <View accessibilityLabel={`${d?.xp ?? 0} XP`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.1)' }}>
          <Ionicons name="flash" size={16} color={CLASS.sun} />
          <Text style={{ color: '#fff', fontFamily: fonts.bodyBold, fontSize: 14 }}>{(d?.xp ?? 0).toLocaleString()} XP</Text>
        </View>
      </View>

      {d?.continue ? (
        <Animated.View entering={FadeInDown.delay(80).springify().damping(16)} style={{ marginTop: 18 }}>
          <PressableScale accessibilityLabel={`Continue class: ${d.continue.title}`} onPress={() => router.push({ pathname: '/uni/lesson/[id]', params: { id: d.continue!.lessonId } })}>
            <LinearGradient colors={[CLASS.accent, '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="play" size={24} color={CLASS.accent} style={{ marginLeft: 3 }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: fonts.bodyExtrabold, fontSize: 11.5, letterSpacing: 0.8 }}>
                  {d.continue.slide > 0 ? 'CONTINUE CLASS' : 'NEXT CLASS'} · {d.continue.courseCode}
                </Text>
                <Text numberOfLines={2} style={{ color: '#fff', fontFamily: fonts.display, fontSize: 18, lineHeight: 22 }}>{d.continue.title}</Text>
              </View>
            </LinearGradient>
          </PressableScale>
        </Animated.View>
      ) : null}
    </LinearGradient>
  );

  return (
    <Screen background={UNI.bg} header={header} refreshing={me.isRefetching} onRefresh={() => void me.refetch()} accent={UNI.accent}>
      {me.isError ? <ErrorState error={me.error} onRetry={() => void me.refetch()} color={UNI.accent} /> : null}
      {me.isPending ? (
        <View style={{ gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={150} radius={24} />
          ))}
        </View>
      ) : null}
      {d ? (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text accessibilityRole="header" style={{ color: '#17133A', fontFamily: fonts.display, fontSize: 22 }}>My courses</Text>
            <Text accessibilityRole="link" onPress={() => router.push('/uni/setup')} style={{ color: UNI.accent, fontFamily: fonts.bodyBold, fontSize: 14, paddingVertical: 6 }}>
              Change
            </Text>
          </View>
          {d.courses.map((c, i) => (
            <CourseCard key={c.id} c={c} index={i} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}
