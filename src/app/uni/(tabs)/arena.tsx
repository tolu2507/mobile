import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PressableScale } from '@/components/ui';
import { useArenaHub } from '@/features/arena/api';
import { ARENA, ArenaButton, ArenaShell, Trophies } from '@/features/arena/components';
import { useUniMe } from '@/features/uni/api';
import { friendlyError } from '@/lib/api';
import { fonts } from '@/theme';

/** The Arena tab for university students: one course at a time. */
export default function UniArenaTab() {
  const hub = useArenaHub();
  const me = useUniMe();
  const courses = me.data?.courses ?? [];
  const refresh = () => void Promise.all([hub.refetch(), me.refetch()]);
  const error = hub.error ?? me.error;

  return (
    <ArenaShell edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 16 }}
        refreshControl={<RefreshControl refreshing={hub.isRefetching || me.isRefetching} onRefresh={refresh} tintColor={ARENA.you} colors={[ARENA.you]} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 36, color: ARENA.text }}>
              The Arena
            </Text>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: ARENA.muted }}>Race real players on your courses. Fastest right answers win.</Text>
          </View>
          {hub.data ? <Trophies count={hub.data.trophies} /> : null}
        </View>

        {error ? (
          <View style={{ gap: 14, paddingTop: 20 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 23, color: ARENA.muted }}>{friendlyError(error)}</Text>
            <ArenaButton label="Try again" onPress={refresh} />
          </View>
        ) : !hub.data || !me.data ? (
          <ActivityIndicator color={ARENA.you} size="large" style={{ marginTop: 40 }} />
        ) : (
          <>
            {hub.data.matches.limit !== null ? (
              <View style={{ backgroundColor: ARENA.panel, borderRadius: 16, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Ionicons name="ticket-outline" size={20} color={ARENA.gold} />
                <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 14, color: ARENA.muted }}>
                  {hub.data.matches.left === 0
                    ? 'You’ve played all your free matches today. Come back tomorrow!'
                    : `${hub.data.matches.left} of ${hub.data.matches.limit} free ${hub.data.matches.limit === 1 ? 'match' : 'matches'} left today`}
                </Text>
              </View>
            ) : null}

            {courses.length ? (
              <View style={{ gap: 10 }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 20, color: ARENA.text }}>Your courses</Text>
                {courses.map((c, i) => (
                  <CourseRow key={c.id} id={c.id} code={c.code} title={c.title} index={i} />
                ))}
              </View>
            ) : (
              <View style={{ backgroundColor: ARENA.panel, borderRadius: 24, padding: 20, gap: 12 }}>
                <MaterialCommunityIcons name="sword-cross" size={34} color={ARENA.gold} />
                <Text style={{ fontFamily: fonts.display, fontSize: 22, color: ARENA.text }}>Register your courses first</Text>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 21, color: ARENA.muted }}>
                  Set up your department and courses. Each one gets its own arena with live matches and ghost races.
                </Text>
                <ArenaButton label="Set up my courses" onPress={() => router.push('/uni/setup')} />
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ArenaShell>
  );
}

function CourseRow({ id, code, title, index }: { id: string; code: string; title: string; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 50)}>
      <PressableScale
        onPress={() => router.push({ pathname: '/uni/arena/[courseId]', params: { courseId: id } })}
        accessibilityLabel={`${code} ${title} arena`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: ARENA.raised, borderRadius: 20, padding: 16, borderBottomWidth: 5, borderBottomColor: ARENA.ledge, minHeight: 72 }}
      >
        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: ARENA.panel, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialCommunityIcons name="book-open-variant" size={26} color={ARENA.you} />
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontFamily: fonts.bodyExtrabold, fontSize: 16, color: ARENA.text }}>
            {title}
          </Text>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: ARENA.muted }}>{code}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={ARENA.muted} />
      </PressableScale>
    </Animated.View>
  );
}
