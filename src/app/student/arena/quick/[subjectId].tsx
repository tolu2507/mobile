import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { SlideInLeft, SlideInRight, ZoomIn } from 'react-native-reanimated';

import { useArenaLobby, useQuickMatch } from '@/features/arena/api';
import { ARENA, ArenaButton, ArenaShell, BackBar, Badge, goBack, Radar } from '@/features/arena/components';
import { playSound } from '@/lib/sounds';
import { fonts } from '@/theme';

/** Quick Match: look for a live opponent on this subject, then go straight into the match. */
export default function QuickMatch() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const lobby = useArenaLobby(subjectId);
  const quick = useQuickMatch(subjectId);
  const me = lobby.data?.me;
  const subject = lobby.data?.subject.name ?? 'this subject';

  useEffect(() => {
    if (!quick.found) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    playSound('whoosh');
    const code = quick.found.code;
    const t = setTimeout(() => router.replace({ pathname: '/student/arena/room/[code]', params: { code } }), 1800);
    return () => clearTimeout(t);
  }, [quick.found]);

  if (quick.found)
    return (
      <ArenaShell>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 22 }}>
          <Animated.View entering={SlideInLeft.springify().damping(14)} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: ARENA.you, borderRadius: 26, padding: 18, borderBottomWidth: 7, borderBottomColor: ARENA.youLedge }}>
            <Badge initial={me?.initial ?? '?'} ring={ARENA.youInk} size={72} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 28, color: ARENA.youInk }}>{me?.name ?? 'You'}</Text>
              <Text style={{ fontFamily: fonts.bodyExtrabold, fontSize: 14, color: ARENA.youInk }}>{me?.trophies ?? 0} trophies</Text>
            </View>
          </Animated.View>
          <Animated.Text entering={ZoomIn.delay(350).springify()} style={{ alignSelf: 'center', fontFamily: fonts.display, fontSize: 42, color: ARENA.text }}>
            VS
          </Animated.Text>
          <Animated.View entering={SlideInRight.springify().damping(14)} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 16, backgroundColor: ARENA.them, borderRadius: 26, padding: 18, borderBottomWidth: 7, borderBottomColor: ARENA.themLedge }}>
            <Badge initial={quick.found.opponent.initial} ring={ARENA.themInk} size={72} />
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 28, color: ARENA.themInk }}>{quick.found.opponent.name}</Text>
              <Text style={{ fontFamily: fonts.bodyExtrabold, fontSize: 14, color: ARENA.themInk }}>{quick.found.opponent.trophies} trophies · live now</Text>
            </View>
          </Animated.View>
        </View>
      </ArenaShell>
    );

  return (
    <ArenaShell>
      <View style={{ flex: 1, padding: 20, gap: 16 }}>
        <BackBar onBack={goBack} kicker={`${subject} · live`} title="Quick Match" />
        {quick.error ? (
          <View style={{ gap: 16, marginTop: 20 }}>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 23, color: ARENA.muted }}>{quick.error}</Text>
            <ArenaButton label="Back to the arena" onPress={goBack} />
          </View>
        ) : quick.timedOut ? (
          <View style={{ flex: 1, justifyContent: 'center', gap: 14 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: ARENA.text, textAlign: 'center' }}>Nobody’s free right now</Text>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: ARENA.muted, textAlign: 'center' }}>No one else is looking for a {subject} match. Race a real player’s ghost instead, or keep looking.</Text>
            <View style={{ gap: 12, marginTop: 12 }}>
              <ArenaButton big label="Race a ghost" onPress={() => router.replace({ pathname: '/student/arena/ghost/[subjectId]', params: { subjectId } })} />
              <ArenaButton label="Keep looking" onPress={quick.retry} color={ARENA.raised} ledge={ARENA.ledge} ink={ARENA.text} />
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
            <Radar initial={me?.initial ?? '?'} />
            <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.display, fontSize: 26, color: ARENA.text, textAlign: 'center' }}>
              Finding a player…
            </Text>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: ARENA.muted, textAlign: 'center' }}>Someone close to your trophies, on {subject}. 5 questions, fastest right answers win.</Text>
            <View style={{ alignSelf: 'stretch', marginTop: 12 }}>
              <ArenaButton label="Cancel" onPress={goBack} color={ARENA.raised} ledge={ARENA.ledge} ink={ARENA.text} />
            </View>
          </View>
        )}
      </View>
    </ArenaShell>
  );
}
