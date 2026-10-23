import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Pulse } from '@/components/game';
import { toast } from '@/components/reacticx/molecules/Toast';
import { PressableScale } from '@/components/ui';
import { useArenaLobby, useCreateRoom, useOlympiad, type ArenaLobby as ArenaLobbyData } from '@/features/arena/api';
import { ARENA, ArenaButton, ArenaShell, BackBar, goBack, Trophies } from '@/features/arena/components';
import { friendlyError } from '@/lib/api';
import { useNow } from '@/lib/useNow';
import { fonts } from '@/theme';

/** One subject's arena: race a ghost, open a room, or join a friend's. */
export default function ArenaLobby() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const lobby = useArenaLobby(subjectId);
  const createRoom = useCreateRoom(subjectId);
  const olympiad = useOlympiad(subjectId);
  const [code, setCode] = useState('');

  if (lobby.isPending)
    return (
      <ArenaShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={ARENA.you} size="large" />
        </View>
      </ArenaShell>
    );
  if (lobby.isError)
    return (
      <ArenaShell>
        <View style={{ padding: 20, gap: 20, flex: 1 }}>
          <BackBar onBack={goBack} kicker="Arena" title="Can’t open the arena" />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: ARENA.muted }}>{friendlyError(lobby.error)}</Text>
          <ArenaButton label="Try again" onPress={() => void lobby.refetch()} />
        </View>
      </ArenaShell>
    );

  const l = lobby.data;
  const out = l.matches.left === 0;
  const open = () =>
    createRoom.mutate(undefined, {
      onSuccess: (r) => router.push({ pathname: '/student/arena/room/[code]', params: { code: r.code } }),
      onError: (e) => toast.error(friendlyError(e)),
    });
  const join = () => {
    const c = code.trim().toUpperCase();
    if (c.length !== 6) return toast.error('Room codes have 6 letters and numbers.');
    router.push({ pathname: '/student/arena/room/[code]', params: { code: c } });
  };

  return (
    <ArenaShell>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
        <BackBar onBack={goBack} kicker={`${l.subject.name} arena`} title="The Arena" right={<Trophies count={l.me.trophies} />} />

        {l.openRoom ? <OpenRoom room={l.openRoom} /> : null}

        {l.matches.limit !== null ? (
          <View style={{ backgroundColor: ARENA.panel, borderRadius: 16, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Ionicons name="ticket-outline" size={20} color={ARENA.gold} />
            <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 14, color: ARENA.muted }}>
              {out ? 'You’ve played all your free matches today. More tomorrow!' : `${l.matches.left} of ${l.matches.limit} free ${l.matches.limit === 1 ? 'match' : 'matches'} left today`}
            </Text>
          </View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(60)}>
          <Pulse active={!out} scale={1.02}>
            <PressableScale
              disabled={out}
              onPress={() => router.push({ pathname: '/student/arena/quick/[subjectId]', params: { subjectId } })}
              accessibilityLabel={`Quick Match. Race a live player on ${l.subject.name} right now.`}
              style={{ backgroundColor: ARENA.you, borderRadius: 26, padding: 20, borderBottomWidth: 7, borderBottomColor: ARENA.youLedge, gap: 6, overflow: 'hidden', opacity: out ? 0.45 : 1 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0193A' }} />
                <Text style={{ fontFamily: fonts.bodyExtrabold, fontSize: 13, color: ARENA.youInk }}>LIVE</Text>
              </View>
              <Text style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 34, color: ARENA.youInk }}>Quick Match</Text>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: ARENA.youInk, maxWidth: 250 }}>
                Race a real player right now. Same {l.questions} questions, {l.seconds} seconds each. Fastest right answers win trophies.
              </Text>
              <MaterialCommunityIcons name="lightning-bolt" size={130} color={ARENA.youLedge} style={{ position: 'absolute', right: -16, bottom: -20 }} />
            </PressableScale>
          </Pulse>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(90)} style={{ flexDirection: 'row', gap: 12 }}>
          <PressableScale
            disabled={out}
            onPress={() => router.push({ pathname: '/student/arena/ghost/[subjectId]', params: { subjectId } })}
            accessibilityLabel="Ghost Race. Race a real player’s earlier run."
            style={{ flex: 1, minHeight: 150, backgroundColor: ARENA.raised, borderRadius: 22, padding: 16, borderBottomWidth: 6, borderBottomColor: ARENA.ledge, gap: 6, opacity: out ? 0.45 : 1 }}
          >
            <MaterialCommunityIcons name="ghost-outline" size={32} color={ARENA.muted} />
            <Text style={{ fontFamily: fonts.display, fontSize: 20, color: ARENA.text }}>Ghost Race</Text>
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: ARENA.muted }}>Race a real player’s earlier run. Always someone to beat.</Text>
          </PressableScale>
          <PressableScale
            onPress={() => router.push({ pathname: '/student/arena/olympiad/[subjectId]', params: { subjectId } })}
            accessibilityLabel="Daily Olympiad. Free every evening."
            style={{ flex: 1, minHeight: 150, backgroundColor: ARENA.gold, borderRadius: 22, padding: 16, borderBottomWidth: 6, borderBottomColor: ARENA.goldLedge, gap: 6 }}
          >
            <MaterialCommunityIcons name="trophy" size={32} color={ARENA.goldInk} />
            <Text style={{ fontFamily: fonts.display, fontSize: 20, color: ARENA.goldInk }}>Daily Olympiad</Text>
            <Text style={{ fontFamily: fonts.bodyExtrabold, fontSize: 13, color: ARENA.goldInk }}>
              {olympiad.data
                ? olympiad.data.status === 'open'
                  ? olympiad.data.me?.finished
                    ? `Live now · you’re #${olympiad.data.me.rank ?? '–'}`
                    : 'Live now! Free to play'
                  : olympiad.data.status === 'upcoming'
                    ? `Today at ${new Date(olympiad.data.opensAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · free`
                    : 'See today’s results'
                : 'Free every evening'}
            </Text>
          </PressableScale>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120)} style={{ backgroundColor: ARENA.panel, borderRadius: 24, padding: 18, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="people" size={26} color={ARENA.muted} />
            <Text style={{ fontFamily: fonts.display, fontSize: 22, color: ARENA.text }}>Play with friends</Text>
          </View>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: ARENA.muted }}>Open a room and share its code, up to 8 players. Everyone needs {l.subject.name} in their subjects.</Text>
          <ArenaButton label={createRoom.isPending ? 'Opening…' : l.openRoom ? 'Open another room' : 'Open a room'} onPress={open} disabled={out || createRoom.isPending} color={ARENA.them} ledge={ARENA.themLedge} ink={ARENA.themInk} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase())}
              placeholder="ROOM CODE"
              placeholderTextColor="#8F88C7"
              autoCapitalize="characters"
              autoCorrect={false}
              accessibilityLabel="Room code"
              onSubmitEditing={join}
              style={{ flex: 1, minHeight: 52, borderRadius: 16, backgroundColor: ARENA.raised, color: ARENA.text, fontFamily: fonts.display, fontSize: 20, letterSpacing: 3, paddingHorizontal: 16 }}
            />
            <ArenaButton label="Join" onPress={join} disabled={out || code.length !== 6} color={ARENA.raised} ledge={ARENA.ledge} ink={ARENA.text} />
          </View>
        </Animated.View>

        <PressableScale
          onPress={() => router.push({ pathname: '/student/arena/leaderboard/[subjectId]', params: { subjectId } })}
          accessibilityLabel="Trophy leaderboard"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: ARENA.panel, borderRadius: 18, padding: 14, minHeight: 56 }}
        >
          <MaterialCommunityIcons name="podium-gold" size={26} color={ARENA.gold} />
          <Text style={{ flex: 1, fontFamily: fonts.bodyExtrabold, fontSize: 16, color: ARENA.text }}>Trophy leaderboard</Text>
          <Ionicons name="chevron-forward" size={20} color={ARENA.muted} />
        </PressableScale>

        {l.played ? (
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: ARENA.muted, textAlign: 'center' }}>
            {l.played} {l.played === 1 ? 'match' : 'matches'} played · {l.won} won
          </Text>
        ) : null}

        <View style={{ borderRadius: 18, backgroundColor: ARENA.panel, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="shield-checkmark-outline" size={22} color={ARENA.right} />
          <Text style={{ flex: 1, fontFamily: fonts.bodyBold, fontSize: 13, color: ARENA.muted }}>Other players only see your first name and initial. Chat is ready-made phrases only.</Text>
        </View>
      </ScrollView>
    </ArenaShell>
  );
}

/** A friends' room the child left to do something else: still open, with the way back in. */
function OpenRoom({ room }: { room: NonNullable<ArenaLobbyData['openRoom']> }) {
  const now = useNow(15_000);
  const minutes = room.closesAt ? Math.max(1, Math.ceil((new Date(room.closesAt).getTime() - now) / 60_000)) : null;
  const friends = room.here;
  return (
    <Animated.View entering={FadeInDown}>
      <PressableScale
        onPress={() => router.push({ pathname: '/student/arena/room/[code]', params: { code: room.code } })}
        accessibilityLabel={`Your room ${room.code} is still open. Go back to it.`}
        style={{ backgroundColor: ARENA.them, borderRadius: 22, padding: 16, borderBottomWidth: 6, borderBottomColor: ARENA.themLedge, flexDirection: 'row', alignItems: 'center', gap: 14 }}
      >
        <Ionicons name="people" size={30} color={ARENA.themInk} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 19, color: ARENA.themInk }}>Room {room.code} is still open</Text>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: ARENA.themInk }}>
            {friends ? `${friends} ${friends === 1 ? 'friend is' : 'friends are'} in it now` : 'Nobody in it yet'}
            {minutes ? ` · closes in ${minutes} min unless you go back` : ''}
          </Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={32} color={ARENA.themInk} />
      </PressableScale>
    </Animated.View>
  );
}

