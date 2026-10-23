import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Confetti } from '@/components/game';
import { toast } from '@/components/reacticx/molecules/Toast';
import { PressableScale } from '@/components/ui';
import { useArenaFinished, useRoom, type RoomPlayer, type RoomState } from '@/features/arena/api';
import { Answers, ARENA, ArenaButton, ArenaShell, BackBar, Badge, ChatBubbles, Countdown, Dots, Gain, goBack, QuestionCard, QuickChat, TimerBar } from '@/features/arena/components';
import { playSound } from '@/lib/sounds';
import { fonts } from '@/theme';

/** A live room: friends join with the code, the host starts, everyone gets the same question at the same moment. */
export default function Room() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const room = useRoom(code);
  const finished = useArenaFinished();
  const { state, you, error } = room;

  // Errors after joining are passing problems (a refused start, a dropped answer): show and move on.
  useEffect(() => {
    if (error && state) {
      toast.error(error);
      room.clearError();
    }
  }, [error, state, room]);

  useEffect(() => {
    if (!room.results) return;
    finished();
    if (room.results.players.find((p) => p.id === you)?.place === 1) playSound('fanfare');
  }, [room.results, you, finished]);

  const nameOf = (id: string) => state?.players.find((p) => p.id === id)?.name ?? 'A player';

  if (!state)
    return (
      <ArenaShell>
        <View style={{ flex: 1, padding: 20, gap: 20 }}>
          <BackBar onBack={goBack} kicker="Room" title={code} />
          {error ? (
            <>
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 23, color: ARENA.muted }}>{error}</Text>
              <ArenaButton label="Back" onPress={goBack} />
            </>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <ActivityIndicator color={ARENA.you} size="large" />
              <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: ARENA.muted }}>Joining the room…</Text>
            </View>
          )}
        </View>
      </ArenaShell>
    );

  if (room.results) return <Results room={room} you={you} />;
  if (room.startingAt && !room.question)
    return (
      <ArenaShell>
        <Countdown onDone={() => {}} />
      </ArenaShell>
    );
  if (state.status === 'lobby' || !room.question) return <Lobby room={room} state={state} you={you} nameOf={nameOf} />;
  return <Match room={room} state={state} you={you} />;
}

type RoomHook = ReturnType<typeof useRoom>;

function Lobby({ room, state, you, nameOf }: { room: RoomHook; state: RoomState; you: string | null; nameOf: (id: string) => string }) {
  const host = state.host === you;
  const here = state.players.filter((p) => p.connected).length;
  if (state.kind === 'LIVE')
    return (
      <ArenaShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
          <ActivityIndicator color={ARENA.gold} size="large" />
          <Text style={{ fontFamily: fonts.display, fontSize: 26, color: ARENA.text, textAlign: 'center' }}>Get ready…</Text>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: ARENA.muted, textAlign: 'center' }}>Your Quick Match on {state.subject.name} starts in a moment.</Text>
          <QuickChat onSay={room.say} phrases={['gl', 'wow']} />
          <ChatBubbles lines={room.chat} nameOf={nameOf} you={you} />
        </View>
      </ArenaShell>
    );
  const share = () => void Share.share({ message: `Race me on BrainBox! Open the arena for ${state.subject.name} and join room ${state.code}.` }).catch(() => {});
  return (
    <ArenaShell>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <BackBar onBack={goBack} kicker={`${state.subject.name} · private room`} title="Room lobby" />
        <View style={{ backgroundColor: ARENA.panel, borderRadius: 24, padding: 18, alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: fonts.bodyExtrabold, fontSize: 13, color: ARENA.muted }}>ROOM CODE</Text>
          <Text selectable accessibilityLabel={`Room code ${state.code.split('').join(' ')}`} style={{ fontFamily: fonts.display, fontSize: 44, letterSpacing: 6, color: ARENA.gold }}>
            {state.code}
          </Text>
          <PressableScale onPress={share} accessibilityLabel="Share the room code" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 16, borderRadius: 999, backgroundColor: ARENA.raised }}>
            <Ionicons name="share-social" size={18} color={ARENA.text} />
            <Text style={{ fontFamily: fonts.bodyExtrabold, fontSize: 15, color: ARENA.text }}>Share code</Text>
          </PressableScale>
        </View>

        <Text style={{ fontFamily: fonts.display, fontSize: 20, color: ARENA.text }}>
          Players · {state.players.length}/8
        </Text>
        <View style={{ gap: 10 }}>
          {state.players.map((p, i) => (
            <Animated.View key={p.id} entering={FadeInDown.delay(i * 40)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: ARENA.panel, borderRadius: 18, padding: 12 }}>
              <Badge initial={p.initial} ring={p.id === you ? ARENA.you : ARENA.them} dim={!p.connected} />
              <Text style={{ flex: 1, fontFamily: fonts.bodyExtrabold, fontSize: 16, color: ARENA.text }}>
                {p.name}
                {p.id === you ? ' (you)' : ''}
              </Text>
              {p.id === state.host ? <MaterialCommunityIcons name="crown" size={22} color={ARENA.gold} accessibilityLabel="Host" /> : null}
              {!p.connected ? <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: ARENA.muted }}>away</Text> : null}
            </Animated.View>
          ))}
        </View>

        <ChatBubbles lines={room.chat} nameOf={nameOf} you={you} />
        <QuickChat onSay={room.say} phrases={['gl', 'wow', 'hard', 'gg']} />

        {host ? (
          <View style={{ gap: 8, marginTop: 6 }}>
            <ArenaButton big label="Start the match" onPress={room.start} disabled={here < 2} color={ARENA.gold} ledge={ARENA.goldLedge} ink={ARENA.goldInk} />
            {here < 2 ? <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: ARENA.muted, textAlign: 'center' }}>Share the code. You can start once a friend is here.</Text> : null}
            {here < state.players.length && here >= 2 ? <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: ARENA.muted, textAlign: 'center' }}>Anyone away when you start sits this one out.</Text> : null}
          </View>
        ) : (
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: ARENA.muted, textAlign: 'center', marginTop: 6 }}>Waiting for the host to start…</Text>
        )}
        {!room.connected ? <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: ARENA.wrong, textAlign: 'center' }}>Connection lost. Reconnecting…</Text> : null}
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: ARENA.muted, textAlign: 'center' }}>You can leave to do something else. The room stays open for 10 minutes; come back from the arena.</Text>
      </ScrollView>
    </ArenaShell>
  );
}

function Match({ room, state, you }: { room: RoomHook; state: RoomState; you: string | null }) {
  const q = room.question!;
  const [picked, setPicked] = useState<{ index: number; id: string } | null>(null);
  const mine = picked?.index === q.index ? picked.id : null;
  const reveal = room.reveal?.index === q.index ? room.reveal : null;
  const marked = room.marked?.index === q.index ? room.marked : null;
  const me = state.players.find((p) => p.id === you);
  const ranked = [...state.players].sort((a, b) => b.score - a.score);
  const myResult = reveal?.results.find((r) => r.id === you);

  useEffect(() => {
    if (!reveal || !myResult) return;
    Haptics.notificationAsync(myResult.correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
    if (myResult.correct) playSound(marked?.combo ? 'coin' : 'chime');
  }, [reveal, myResult, marked?.combo]);

  const pick = (id: string) => {
    if (mine || reveal) return;
    setPicked({ index: q.index, id });
    room.answer(q.index, id);
  };
  const gain = myResult ? (myResult.correct ? `+${myResult.points}` : myResult.answered ? 'Oops!' : 'Time up!') : null;

  return (
    <ArenaShell>
      <View style={{ flex: 1, padding: 20, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontFamily: fonts.bodyExtrabold, fontSize: 12, color: ARENA.you }}>YOU · #{ranked.findIndex((p) => p.id === you) + 1}</Text>
            <Text style={{ fontFamily: fonts.display, fontSize: 28, color: ARENA.text }}>{me?.score ?? 0}</Text>
          </View>
          <Text style={{ fontFamily: fonts.display, fontSize: 16, color: ARENA.muted }}>
            {q.index + 1}/{state.questions}
          </Text>
        </View>
        <PlayerStrip players={ranked} you={you} reveal={reveal?.results ?? null} />
        <Dots total={state.questions} current={q.index} />
        <TimerBar key={q.index} msLeft={q.msLeft} total={state.seconds * 1000} running={!reveal} />
        <View style={{ marginTop: 26 }}>
          <QuestionCard prompt={q.prompt} label={`QUESTION ${q.index + 1}`} />
          {gain ? <Gain key={`g${q.index}`} text={gain} color={myResult?.correct ? ARENA.right : ARENA.wrong} /> : null}
        </View>
        {mine && !reveal ? (
          <Animated.Text entering={FadeIn} style={{ alignSelf: 'center', fontFamily: fonts.bodyExtrabold, fontSize: 14, color: ARENA.muted }}>
            Locked in! Waiting for the others…
          </Animated.Text>
        ) : null}
        {reveal && marked?.combo ? (
          <Animated.Text entering={ZoomIn} style={{ alignSelf: 'center', backgroundColor: ARENA.them, color: ARENA.themInk, fontFamily: fonts.display, fontSize: 17, paddingHorizontal: 16, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' }}>
            COMBO +50
          </Animated.Text>
        ) : null}
        <View style={{ flex: 1 }} />
        <Answers options={q.options} picked={mine} answerId={reveal?.answerId ?? null} locked={!!mine || !!reveal} onPick={pick} />
      </View>
    </ArenaShell>
  );
}

/** Everyone's badge, best first: a tick when they've answered, their points when the answer is shown. */
function PlayerStrip({ players, you, reveal }: { players: RoomPlayer[]; you: string | null; reveal: { id: string; correct: boolean; points: number }[] | null }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
      {players.map((p) => {
        const r = reveal?.find((x) => x.id === p.id);
        return (
          <View key={p.id} accessibilityLabel={`${p.name}, ${p.score} points${p.answered ? ', answered' : ''}`} style={{ alignItems: 'center', gap: 2, width: 56 }}>
            <View>
              <Badge initial={p.initial} ring={p.id === you ? ARENA.you : ARENA.them} size={42} dim={!p.connected} />
              {p.answered && !reveal ? (
                <View style={{ position: 'absolute', right: -4, bottom: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: ARENA.right, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={13} color={ARENA.rightInk} />
                </View>
              ) : null}
            </View>
            <Text numberOfLines={1} style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: ARENA.muted }}>
              {p.name.split(' ')[0]}
            </Text>
            <Text style={{ fontFamily: fonts.bodyExtrabold, fontSize: 12, color: r ? (r.correct ? ARENA.right : ARENA.wrong) : ARENA.text }}>{r ? (r.correct ? `+${r.points}` : '+0') : p.score}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function Results({ room, you }: { room: RoomHook; you: string | null }) {
  const r = room.results!;
  const me = r.players.find((p) => p.id === you);
  const won = me?.place === 1;
  const nameOf = (id: string) => r.players.find((p) => p.id === id)?.name ?? 'A player';
  return (
    <ArenaShell>
      {won ? <Confetti count={48} /> : null}
      <ScrollView contentContainerStyle={{ padding: 22, gap: 16 }}>
        <Animated.Text entering={ZoomIn.springify()} accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 42, lineHeight: 46, color: ARENA.gold, textAlign: 'center', marginTop: 10 }}>
          {won ? 'You win!' : me ? `You came #${me.place}` : 'Match over'}
        </Animated.Text>
        {me ? (
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: ARENA.muted, textAlign: 'center' }}>
            {me.correct}/{r.questions} right · {me.score} points · +{me.xp} XP
            {me.trophies !== null ? ` · ${me.trophies >= 0 ? '+' : ''}${me.trophies} trophies` : ''}
          </Text>
        ) : null}
        <View style={{ gap: 10, marginTop: 6 }}>
          {r.players.map((p, i) => (
            <Animated.View key={p.id} entering={FadeInDown.delay(i * 80)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: p.place === 1 ? ARENA.gold : ARENA.panel, borderRadius: 18, padding: 12 }}>
              <Text style={{ width: 34, fontFamily: fonts.display, fontSize: 24, textAlign: 'center', color: p.place === 1 ? ARENA.goldInk : ARENA.muted }}>{p.place}</Text>
              <Badge initial={p.initial} ring={p.id === you ? ARENA.you : ARENA.them} size={40} />
              <Text style={{ flex: 1, fontFamily: fonts.bodyExtrabold, fontSize: 16, color: p.place === 1 ? ARENA.goldInk : ARENA.text }}>
                {p.name}
                {p.id === you ? ' (you)' : ''}
              </Text>
              <Text style={{ fontFamily: fonts.display, fontSize: 20, color: p.place === 1 ? ARENA.goldInk : ARENA.text }}>{p.score}</Text>
            </Animated.View>
          ))}
        </View>
        <ChatBubbles lines={room.chat} nameOf={nameOf} you={you} />
        <QuickChat onSay={room.say} phrases={['gg', 'close', 'wow', 'again']} />
        <ArenaButton big label="Done" onPress={goBack} />
      </ScrollView>
    </ArenaShell>
  );
}
