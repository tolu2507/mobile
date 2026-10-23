import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, SlideInLeft, SlideInRight, ZoomIn } from 'react-native-reanimated';

import { Confetti } from '@/components/game';
import { ghostAnswer, ghostQuestion, useArenaFinished, useEnterOlympiad, useStartGhost, type ArenaMark, type ArenaQuestion, type GhostResult, type GhostStart } from '@/features/arena/api';
import { Answers, ARENA, ArenaButton, ArenaShell, BackBar, Badge, Countdown, Dots, Gain, goBack, QuestionCard, ScoreSide, TimerBar } from '@/features/arena/components';
import { friendlyError } from '@/lib/api';
import { playSound } from '@/lib/sounds';
import { fonts } from '@/theme';

type Phase = 'loading' | 'error' | 'intro' | 'countdown' | 'question' | 'reveal' | 'results';
const REVEAL_MS = 1800;

/**
 * A Ghost Race: five questions against a real player's recorded run, timed by the server.
 * With `mode=olympiad` it's the child's run in today's Daily Olympiad instead: ten questions, no ghost, a place on the board.
 */
export default function GhostRace() {
  const { subjectId, mode } = useLocalSearchParams<{ subjectId: string; mode?: string }>();
  const olympiad = mode === 'olympiad';
  const ghostStart = useStartGhost(subjectId);
  const olympiadStart = useEnterOlympiad(subjectId);
  const start = olympiad ? olympiadStart : ghostStart;
  const finished = useArenaFinished();
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState('');
  const [race, setRace] = useState<GhostStart | null>(null);
  const [q, setQ] = useState<ArenaQuestion | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [mark, setMark] = useState<ArenaMark | null>(null);
  const [score, setScore] = useState(0);
  const [ghostScore, setGhostScore] = useState(0);
  const [ghostAnswered, setGhostAnswered] = useState(false);
  const [result, setResult] = useState<GhostResult | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const busy = useRef(false);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => clear, []);

  const fail = (e: unknown) => {
    clear();
    setError(friendlyError(e));
    setPhase('error');
  };

  const launch = useCallback(() => {
    start.mutate(undefined, {
      onSuccess: (r) => {
        setRace(r);
        setPhase('intro');
      },
      onError: fail,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(launch, [launch]);

  const again = () => {
    clear();
    setPhase('loading');
    setScore(0);
    setGhostScore(0);
    setResult(null);
    launch();
  };

  const submit = async (r: GhostStart, index: number, optionId: string | null) => {
    if (busy.current) return;
    busy.current = true;
    clear();
    setPicked(optionId);
    try {
      const m = await ghostAnswer(r.matchId, index, optionId);
      setMark(m);
      setScore(m.score);
      setGhostScore((s) => s + (r.ghost?.timeline[index]?.points ?? 0));
      setGhostAnswered(true);
      setPhase('reveal');
      Haptics.notificationAsync(m.correct ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
      if (m.correct) playSound(m.combo ? 'coin' : 'chime');
      later(() => {
        if (m.finished) {
          setResult(m.finished);
          setPhase('results');
          finished();
          if (m.finished.place === 1) playSound('fanfare');
        } else void ask(r, index + 1);
      }, REVEAL_MS);
    } catch (e) {
      fail(e);
    } finally {
      busy.current = false;
    }
  };

  const ask = async (r: GhostStart, index: number) => {
    try {
      const next = await ghostQuestion(r.matchId, index);
      setQ(next);
      setPicked(null);
      setMark(null);
      setGhostAnswered(false);
      setPhase('question');
      later(() => void submit(r, index, null), next.msLeft);
      const ghostMs = r.ghost?.timeline[index]?.ms;
      if (ghostMs !== null && ghostMs !== undefined) later(() => setGhostAnswered(true), ghostMs);
    } catch (e) {
      fail(e);
    }
  };

  if (phase === 'loading')
    return (
      <ArenaShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <ActivityIndicator color={ARENA.you} size="large" />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: ARENA.muted }}>{olympiad ? 'Opening today’s Olympiad…' : 'Finding a real run to race…'}</Text>
        </View>
      </ArenaShell>
    );

  if (phase === 'error' || !race)
    return (
      <ArenaShell>
        <View style={{ padding: 20, gap: 20 }}>
          <BackBar onBack={goBack} kicker={olympiad ? 'Daily Olympiad' : 'Ghost Race'} title="Can’t race right now" />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 23, color: ARENA.muted }}>{error}</Text>
          <ArenaButton label="Back to the arena" onPress={goBack} />
        </View>
      </ArenaShell>
    );

  const g = race.ghost;
  if (phase === 'intro')
    return (
      <ArenaShell>
        <View style={{ flex: 1, padding: 24, justifyContent: 'center', gap: 22 }}>
          <Animated.View entering={SlideInLeft.springify().damping(14)} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: ARENA.you, borderRadius: 26, padding: 18, borderBottomWidth: 7, borderBottomColor: ARENA.youLedge }}>
            <Badge initial={race.me.initial} ring={ARENA.youInk} size={72} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 28, color: ARENA.youInk }}>{race.me.name}</Text>
              <Text style={{ fontFamily: fonts.bodyExtrabold, fontSize: 14, color: ARENA.youInk }}>{race.me.trophies} trophies</Text>
            </View>
          </Animated.View>
          {olympiad ? (
            <Animated.View entering={SlideInRight.springify().damping(14)} style={{ alignItems: 'center', gap: 8, backgroundColor: ARENA.gold, borderRadius: 26, padding: 20, borderBottomWidth: 7, borderBottomColor: ARENA.goldLedge }}>
              <MaterialCommunityIcons name="trophy" size={48} color={ARENA.goldInk} />
              <Text style={{ fontFamily: fonts.display, fontSize: 28, color: ARENA.goldInk }}>Daily Olympiad</Text>
              <Text style={{ fontFamily: fonts.bodyExtrabold, fontSize: 14, textAlign: 'center', color: ARENA.goldInk }}>
                {race.questions} questions, {race.seconds} seconds each. Everyone today gets the same ones. One go only, so make it count!
              </Text>
            </Animated.View>
          ) : null}
          {olympiad ? null : (
          <Animated.Text entering={ZoomIn.delay(350).springify()} style={{ alignSelf: 'center', fontFamily: fonts.display, fontSize: 42, color: ARENA.text }}>
            VS
          </Animated.Text>
          )}
          {olympiad ? null : (
          <Animated.View entering={SlideInRight.springify().damping(14)} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 16, backgroundColor: g ? ARENA.them : ARENA.raised, borderRadius: 26, padding: 18, borderBottomWidth: 7, borderBottomColor: g ? ARENA.themLedge : ARENA.ledge }}>
            {g ? <Badge initial={g.initial} ring={ARENA.themInk} size={72} /> : <MaterialCommunityIcons name="flag-checkered" size={60} color={ARENA.gold} />}
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 28, color: g ? ARENA.themInk : ARENA.text }}>{g ? g.name : 'First run!'}</Text>
              <Text style={{ fontFamily: fonts.bodyExtrabold, fontSize: 14, textAlign: 'right', color: g ? ARENA.themInk : ARENA.muted }}>
                {g ? `Ghost of a real run · ${g.score} points to beat` : 'Nobody has raced these yet. Set the score others will chase.'}
              </Text>
            </View>
          </Animated.View>
          )}
          <Animated.View entering={FadeInDown.delay(600)} style={{ marginTop: 16 }}>
            <ArenaButton big label="I’m ready" onPress={() => setPhase('countdown')} color={ARENA.gold} ledge={ARENA.goldLedge} ink={ARENA.goldInk} />
          </Animated.View>
        </View>
      </ArenaShell>
    );

  if (phase === 'countdown')
    return (
      <ArenaShell>
        <Countdown onDone={() => void ask(race, 0)} />
      </ArenaShell>
    );

  if (phase === 'results' && result) {
    const won = result.place === 1;
    if (olympiad) return <OlympiadDone result={result} subjectId={subjectId} />;
    return (
      <ArenaShell>
        {won ? <Confetti count={48} /> : null}
        <ScrollView contentContainerStyle={{ padding: 22, gap: 18, alignItems: 'stretch' }}>
          <Animated.Text entering={ZoomIn.springify()} accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 44, lineHeight: 48, color: ARENA.gold, textAlign: 'center', marginTop: 12 }}>
            {!g ? 'Run set!' : won ? 'You win!' : 'So close!'}
          </Animated.Text>
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: ARENA.muted, textAlign: 'center' }}>
            {!g ? 'Your run is now a ghost for other players to chase.' : won ? `You beat ${g.name}’s run.` : `${g.name}’s run was faster this time. Race again!`}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Final label="You" score={result.score} color={ARENA.you} ink={ARENA.youInk} top={won} />
            {g ? <Final label={g.name} score={result.ghostScore ?? 0} color={ARENA.them} ink={ARENA.themInk} top={!won} /> : null}
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Stat value={`${result.correct}/${result.questions}`} label="Right" color={ARENA.right} />
            <Stat value={`+${result.xp}`} label="XP" color={ARENA.you} />
            <Stat value={`${result.trophies >= 0 ? '+' : ''}${result.trophies}`} label={`Trophies (${result.trophiesTotal})`} color={ARENA.gold} />
          </View>
          <View style={{ gap: 12, marginTop: 8 }}>
            <ArenaButton big label="Race again" onPress={again} />
            <ArenaButton label="Back to the arena" onPress={goBack} color={ARENA.raised} ledge={ARENA.ledge} ink={ARENA.text} />
          </View>
        </ScrollView>
      </ArenaShell>
    );
  }

  // Question or reveal
  if (!q) return null;
  const gain = mark ? (mark.correct ? `+${mark.points}` : mark.timedOut ? 'Time up!' : 'Oops!') : null;
  return (
    <ArenaShell>
      <View style={{ flex: 1, padding: 20, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ScoreSide label="YOU" name="You" initial={race.me.initial} score={score} ring={ARENA.you} align="left" />
          <Text style={{ fontFamily: fonts.display, fontSize: 16, color: ARENA.muted }}>
            {q.index + 1}/{race.questions}
          </Text>
          {g ? <ScoreSide label={g.name.toUpperCase()} name={g.name} initial={g.initial} score={ghostScore} ring={ARENA.them} align="right" note={ghostAnswered && phase === 'question' ? 'answered!' : null} /> : <View style={{ flex: 1 }} />}
        </View>
        <Dots total={race.questions} current={q.index} />
        <TimerBar key={q.index} msLeft={q.msLeft} total={race.seconds * 1000} running={phase === 'question'} />
        <View style={{ marginTop: 26 }}>
          <QuestionCard prompt={q.prompt} label={`QUESTION ${q.index + 1}`} />
          {gain ? <Gain key={`g${q.index}`} text={gain} color={mark?.correct ? ARENA.right : ARENA.wrong} /> : null}
        </View>
        {mark?.combo ? (
          <Animated.Text entering={ZoomIn} style={{ alignSelf: 'center', backgroundColor: ARENA.them, color: ARENA.themInk, fontFamily: fonts.display, fontSize: 17, paddingHorizontal: 16, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' }}>
            COMBO +50
          </Animated.Text>
        ) : null}
        <View style={{ flex: 1 }} />
        <Answers options={q.options} picked={picked} answerId={mark?.answerId ?? null} locked={phase !== 'question' || picked !== null} onPick={(id) => void submit(race, q.index, id)} />
        {mark && !mark.correct ? (
          <Animated.Text entering={FadeIn} numberOfLines={3} style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: ARENA.muted, textAlign: 'center' }}>
            {mark.explanation}
          </Animated.Text>
        ) : null}
      </View>
    </ArenaShell>
  );
}

function Final({ label, score, color, ink, top }: { label: string; score: number; color: string; ink: string; top: boolean }) {
  return (
    <Animated.View entering={FadeInDown.springify()} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
      {top ? <MaterialCommunityIcons name="crown" size={36} color={ARENA.gold} /> : null}
      <View style={{ alignSelf: 'stretch', height: top ? 150 : 110, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: color, alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <Text numberOfLines={1} style={{ fontFamily: fonts.bodyExtrabold, fontSize: 14, color: ink }}>
          {label}
        </Text>
        <Text style={{ fontFamily: fonts.display, fontSize: 34, color: ink }}>{score}</Text>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: ink }}>points</Text>
      </View>
    </Animated.View>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: ARENA.panel, borderRadius: 16, paddingVertical: 12, alignItems: 'center', gap: 2 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 22, color }}>{value}</Text>
      <Text numberOfLines={1} style={{ fontFamily: fonts.bodyExtrabold, fontSize: 12, color: ARENA.muted }}>
        {label}
      </Text>
    </View>
  );
}

/** The end of an Olympiad run: the place so far, and the board. Final places come when it closes. */
function OlympiadDone({ result, subjectId }: { result: GhostResult; subjectId: string }) {
  const top3 = result.place !== null && result.place <= 3;
  return (
    <ArenaShell>
      {top3 ? <Confetti count={48} /> : null}
      <ScrollView contentContainerStyle={{ padding: 22, gap: 18 }}>
        <Animated.Text entering={ZoomIn.springify()} accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 44, lineHeight: 48, color: ARENA.gold, textAlign: 'center', marginTop: 12 }}>
          {result.place ? `#${result.place} so far!` : 'Run complete!'}
        </Animated.Text>
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: ARENA.muted, textAlign: 'center' }}>
          {result.players ? `Out of ${result.players} ${result.players === 1 ? 'player' : 'players'} so far. ` : ''}Final places come when the Olympiad closes.
        </Text>
        <Final label="You" score={result.score} color={ARENA.you} ink={ARENA.youInk} top={top3} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Stat value={`${result.correct}/${result.questions}`} label="Right" color={ARENA.right} />
          <Stat value={`+${result.xp}`} label="XP" color={ARENA.you} />
          <Stat value={result.place ? `#${result.place}` : '–'} label="Place" color={ARENA.gold} />
        </View>
        <View style={{ gap: 12, marginTop: 8 }}>
          <ArenaButton big label="See the leaderboard" onPress={() => router.replace({ pathname: '/student/arena/olympiad/[subjectId]', params: { subjectId } })} color={ARENA.gold} ledge={ARENA.goldLedge} ink={ARENA.goldInk} />
          <ArenaButton label="Back to the arena" onPress={goBack} color={ARENA.raised} ledge={ARENA.ledge} ink={ARENA.text} />
        </View>
      </ScrollView>
    </ArenaShell>
  );
}
