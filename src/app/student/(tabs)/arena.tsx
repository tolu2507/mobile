import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PressableScale } from '@/components/ui';
import { useArenaHub } from '@/features/arena/api';
import { ARENA, ArenaButton, ArenaShell, Trophies } from '@/features/arena/components';
import { useExamCatalog, useMyExams } from '@/features/exams/api';
import { worldFor } from '@/features/worlds/worlds';
import { friendlyError } from '@/lib/api';
import { fonts } from '@/theme';

/** The arena's front door: every subject the student picked, one tap from competing. Nursery has no arena. */
export default function ArenaTab() {
  const hub = useArenaHub();
  const mine = useMyExams();
  const catalog = useExamCatalog();
  const exams = mine.data?.filter((e) => e.exam !== 'NURSERY' && e.subjects.length) ?? [];
  const label = (exam: string) => catalog.data?.find((e) => e.exam === exam)?.fullName ?? exam;
  const refresh = () => void Promise.all([hub.refetch(), mine.refetch()]);
  const error = hub.error ?? mine.error;

  return (
    <ArenaShell edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 16 }}
        refreshControl={<RefreshControl refreshing={hub.isRefetching || mine.isRefetching} onRefresh={refresh} tintColor={ARENA.you} colors={[ARENA.you]} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 36, color: ARENA.text }}>
              The Arena
            </Text>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: ARENA.muted }}>Race real players in your subjects. Fastest right answers win.</Text>
          </View>
          {hub.data ? <Trophies count={hub.data.trophies} /> : null}
        </View>

        {error ? (
          <View style={{ gap: 14, paddingTop: 20 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 23, color: ARENA.muted }}>{friendlyError(error)}</Text>
            <ArenaButton label="Try again" onPress={refresh} />
          </View>
        ) : !hub.data || !mine.data ? (
          <ActivityIndicator color={ARENA.you} size="large" style={{ marginTop: 40 }} />
        ) : (
          <>
            <Olympiad o={hub.data.olympiad} />

            {hub.data.matches.limit !== null ? (
              <View style={{ backgroundColor: ARENA.panel, borderRadius: 16, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Ionicons name="ticket-outline" size={20} color={ARENA.gold} />
                <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 14, color: ARENA.muted }}>
                  {hub.data.matches.left === 0
                    ? 'You’ve played all your free matches today. The Olympiad is still free!'
                    : `${hub.data.matches.left} of ${hub.data.matches.limit} free ${hub.data.matches.limit === 1 ? 'match' : 'matches'} left today`}
                </Text>
              </View>
            ) : null}

            {exams.length ? (
              exams.map((exam) => (
                <View key={exam.exam} style={{ gap: 10 }}>
                  <Text style={{ fontFamily: fonts.display, fontSize: 20, color: ARENA.text }}>
                    {label(exam.exam)}
                    {exam.targetYear ? ` · ${exam.targetYear}` : ''}
                  </Text>
                  {exam.subjects.map((s, i) => (
                    <SubjectRow key={s.id} id={s.id} slug={s.slug} name={s.name} index={i} />
                  ))}
                </View>
              ))
            ) : (
              <View style={{ backgroundColor: ARENA.panel, borderRadius: 24, padding: 20, gap: 12 }}>
                <MaterialCommunityIcons name="sword-cross" size={34} color={ARENA.gold} />
                <Text style={{ fontFamily: fonts.display, fontSize: 22, color: ARENA.text }}>Pick your subjects first</Text>
                <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, lineHeight: 21, color: ARENA.muted }}>
                  Tell us your exam and subjects. Each one gets its own arena, with live matches, ghost races and a Daily Olympiad.
                </Text>
                <ArenaButton label="Choose my subjects" onPress={() => router.push('/student/exams')} />
              </View>
            )}

            {exams.length ? (
              <PressableScale
                onPress={() => router.push('/student/practice')}
                accessibilityLabel="Explore your worlds. Practise each subject topic by topic."
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: ARENA.panel, borderRadius: 18, padding: 14, minHeight: 56 }}
              >
                <MaterialCommunityIcons name="island" size={26} color={ARENA.you} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bodyExtrabold, fontSize: 16, color: ARENA.text }}>Explore your worlds</Text>
                  <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: ARENA.muted }}>Practise topic by topic to get faster here.</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={ARENA.muted} />
              </PressableScale>
            ) : null}
          </>
        )}
      </ScrollView>
    </ArenaShell>
  );
}

function Olympiad({ o }: { o: { status: 'upcoming' | 'open' | 'closed'; opensAt: string; prizes: boolean } }) {
  const at = new Date(o.opensAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return (
    <View style={{ backgroundColor: ARENA.gold, borderRadius: 22, padding: 16, borderBottomWidth: 6, borderBottomColor: ARENA.goldLedge, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <MaterialCommunityIcons name="trophy" size={34} color={ARENA.goldInk} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 19, color: ARENA.goldInk }}>{o.status === 'open' ? 'The Daily Olympiad is live!' : 'Daily Olympiad'}</Text>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: ARENA.goldInk }}>
          {o.status === 'open' ? 'Pick a subject below and play it now. Free.' : o.status === 'upcoming' ? `Tonight at ${at}. Free for everyone${o.prizes ? ', with prizes' : ''}.` : `Closed for today. Back tomorrow at ${at}.`}
        </Text>
      </View>
    </View>
  );
}

function SubjectRow({ id, slug, name, index }: { id: string; slug: string; name: string; index: number }) {
  const world = worldFor(slug);
  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 50)}>
      <PressableScale
        onPress={() => router.push({ pathname: '/student/arena/[subjectId]', params: { subjectId: id } })}
        accessibilityLabel={`${name} arena, ${world.name}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: ARENA.raised, borderRadius: 20, padding: 12, borderBottomWidth: 5, borderBottomColor: ARENA.ledge, minHeight: 72 }}
      >
        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: world.land, borderBottomWidth: 4, borderBottomColor: world.ledge, alignItems: 'center', justifyContent: 'center' }}>
          {'text' in world.glyph ? (
            <Text style={{ fontFamily: fonts.display, fontSize: 17, color: world.ink }}>{world.glyph.text}</Text>
          ) : (
            <MaterialCommunityIcons name={world.glyph.icon} size={26} color={world.ink} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={{ fontFamily: fonts.bodyExtrabold, fontSize: 16, color: ARENA.text }}>
            {name}
          </Text>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: ARENA.muted }}>{world.name}</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={ARENA.muted} />
      </PressableScale>
    </Animated.View>
  );
}
