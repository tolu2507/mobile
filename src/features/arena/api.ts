import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { API_URL, api, freshAccessToken } from '@/lib/api';
import type { ExamBody, Question, Rewards } from '@/types/api';

type Option = Question['options'][number];

export type Phrase = 'gl' | 'gg' | 'wow' | 'close' | 'hard' | 'again';

export type ArenaLobby = {
  subject: { id: string; exam: ExamBody; slug: string; name: string };
  me: { name: string; initial: string; trophies: number; chatAllowed: boolean };
  played: number;
  won: number;
  matches: { limit: number | null; left: number | null };
  questions: number;
  seconds: number;
  phrases: Record<Phrase, string>;
  /** A friends' room this child still has a place in. `closesAt` is when their place (and an empty room) goes, while they're away. */
  openRoom: { code: string; players: number; here: number; closesAt: string | null } | null;
};

export type GhostStart = {
  matchId: string;
  questions: number;
  seconds: number;
  me: { name: string; initial: string; trophies: number };
  /** null: nobody has a run to race yet, so this one sets the first. */
  ghost: { name: string; initial: string; trophies: number; score: number; raced: string; timeline: { ms: number | null; correct: boolean; points: number }[] } | null;
};

export type ArenaQuestion = { index: number; prompt: string; options: Option[]; msLeft: number };

/** The end of a Ghost Race or an Olympiad run. In an Olympiad `place` is the place so far (final once it closes) out of `players`. */
export type GhostResult = { place: number | null; score: number; ghostScore: number | null; correct: number; questions: number; xp: number; trophies: number; trophiesTotal: number | null; rewards: Rewards; players?: number };
export type ArenaMark = { index: number; correct: boolean; timedOut: boolean; answerId: string; explanation: string; points: number; combo: boolean; score: number; finished: GhostResult | null };

export type ArenaHub = {
  trophies: number;
  matches: { limit: number | null; left: number | null };
  olympiad: { status: 'upcoming' | 'open' | 'closed'; opensAt: string; closesAt: string; prizes: boolean };
};

export function useArenaHub() {
  return useQuery({ queryKey: ['arena', 'hub'], queryFn: async () => (await api.get<ArenaHub>('/me/student/arena')).data });
}

export function useArenaLobby(subjectId: string) {
  // Always fresh, and kept fresh: it shows a room you left open and friends turning up in it.
  return useQuery({ queryKey: ['arena', 'lobby', subjectId], queryFn: async () => (await api.get<ArenaLobby>(`/me/student/arena/subjects/${subjectId}`)).data, refetchOnMount: 'always', refetchInterval: 15_000 });
}

export function useStartGhost(subjectId: string) {
  return useMutation({ mutationFn: async () => (await api.post<GhostStart>('/me/student/arena/ghost', { subjectId })).data });
}

export const ghostQuestion = async (matchId: string, index: number) => (await api.post<ArenaQuestion>(`/me/student/arena/matches/${matchId}/questions/${index}`)).data;
export const ghostAnswer = async (matchId: string, index: number, optionId: string | null) =>
  (await api.post<ArenaMark>(`/me/student/arena/matches/${matchId}/answers`, optionId ? { index, optionId } : { index })).data;

/** Clears what a finished match changes: the lobby, XP and streak on home, and the practice map (questions count as seen). */
export function useArenaFinished() {
  const qc = useQueryClient();
  return useCallback(() => {
    void qc.invalidateQueries({ queryKey: ['arena'] });
    void qc.invalidateQueries({ queryKey: ['student'] });
    void qc.invalidateQueries({ queryKey: ['practice', 'map'] });
  }, [qc]);
}

export type OlympiadToday = {
  subject: { id: string; name: string };
  status: 'upcoming' | 'open' | 'closed';
  opensAt: string;
  closesAt: string;
  questions: number;
  seconds: number;
  /** null: no cash prizes today, just the glory. */
  prizes: { naira: number[]; minPlayers: number } | null;
  settled: boolean;
  players: number;
  top: { rank: number; name: string; initial: string; score: number; you: boolean }[];
  me: { matchId: string; finished: boolean; score: number; correct: number; rank: number | null } | null;
};

/** Today's Olympiad for a subject. While it's open the board refreshes every 10 seconds. */
export function useOlympiad(subjectId: string) {
  return useQuery({
    queryKey: ['arena', 'olympiad', subjectId],
    queryFn: async () => (await api.get<OlympiadToday>(`/me/student/arena/subjects/${subjectId}/olympiad`)).data,
    refetchInterval: (q) => (q.state.data?.status === 'open' ? 10_000 : false),
  });
}

export function useEnterOlympiad(subjectId: string) {
  return useMutation({ mutationFn: async () => (await api.post<GhostStart>('/me/student/arena/olympiad', { subjectId })).data });
}

export type Leaderboard = {
  exam: ExamBody;
  top: { rank: number; name: string; initial: string; trophies: number; you: boolean }[];
  me: { name: string; trophies: number; rank: number | null };
};

export function useLeaderboard(subjectId: string) {
  return useQuery({ queryKey: ['arena', 'leaderboard', subjectId], queryFn: async () => (await api.get<Leaderboard>(`/me/student/arena/subjects/${subjectId}/leaderboard`)).data });
}

export function useCreateRoom(subjectId: string) {
  return useMutation({ mutationFn: async () => (await api.post<{ code: string; subject: { id: string; name: string } }>('/me/student/arena/rooms', { subjectId })).data });
}

// ── Live rooms ─────────────────────────────────────────

export type RoomPlayer = { id: string; name: string; initial: string; score: number; connected: boolean; answered: boolean };
export type RoomState = { kind: 'ROOM' | 'LIVE'; code: string; subject: { id: string; name: string }; status: 'lobby' | 'playing' | 'finished'; host: string | null; index: number; questions: number; seconds: number; players: RoomPlayer[] };
export type RoomMark = { index: number; correct: boolean; timedOut: boolean; points: number; combo: boolean; score: number };
export type RoomReveal = { index: number; answerId: string; explanation: string; results: { id: string; correct: boolean; points: number; answered: boolean }[] };
/** `trophies` is set for Quick Match (won or lost); null in a friends' room. */
export type RoomResults = { players: { id: string; name: string; initial: string; score: number; correct: number; place: number; xp: number; trophies: number | null }[]; questions: number };
export type ChatLine = { key: number; from: string; text: string };

/** A connection to the /arena socket, logged in with a fresh token (and again on every reconnect). */
async function connectArena(): Promise<Socket | null> {
  const token = await freshAccessToken();
  if (!token) return null;
  return io(`${API_URL}/arena`, { transports: ['websocket'], auth: (cb) => void freshAccessToken().then((t) => cb({ token: t ?? token })) });
}

/**
 * Quick Match: waits in the queue for someone on the same subject.
 * `found` carries the match's code once paired; `timedOut` when nobody turned up.
 */
export function useQuickMatch(subjectId: string) {
  const [found, setFound] = useState<{ code: string; opponent: { name: string; initial: string; trophies: number } } | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let s: Socket | null = null;
    void connectArena().then((socket) => {
      if (cancelled || !socket) return socket?.disconnect();
      s = socket;
      s.on('connect', () => s?.emit('quick:search', { subjectId }));
      s.on('quick:matched', (m: { code: string; opponent: { name: string; initial: string; trophies: number } }) => setFound(m));
      s.on('quick:timeout', () => setTimedOut(true));
      s.on('room:error', (e: { message: string }) => setError(e.message));
    });
    return () => {
      cancelled = true;
      s?.emit('quick:cancel');
      s?.disconnect();
    };
  }, [subjectId, attempt]);

  return {
    found,
    timedOut,
    error,
    retry: () => {
      setTimedOut(false);
      setError(null);
      setAttempt((n) => n + 1);
    },
  };
}

/**
 * One live room over the /arena socket. Reconnects by itself (and rejoins) if the connection drops.
 * Everything the server says lands in this hook's state; the screen just renders it.
 */
export function useRoom(code: string) {
  const qc = useQueryClient();
  const socket = useRef<Socket | null>(null);
  const [state, setState] = useState<RoomState | null>(null);
  const [you, setYou] = useState<string | null>(null);
  const [startingAt, setStartingAt] = useState<number | null>(null);
  const [question, setQuestion] = useState<ArenaQuestion | null>(null);
  const [marked, setMarked] = useState<RoomMark | null>(null);
  const [reveal, setReveal] = useState<RoomReveal | null>(null);
  const [results, setResults] = useState<RoomResults | null>(null);
  const [chat, setChat] = useState<ChatLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let s: Socket | null = null;
    void (async () => {
      s = await connectArena();
      if (cancelled || !s) return s?.disconnect();
      socket.current = s;
      s.on('connect', () => {
        setConnected(true);
        s?.emit('room:join', { code });
      });
      s.on('disconnect', () => setConnected(false));
      s.on('room:joined', (d: { you: string }) => setYou(d.you));
      s.on('room:state', (d: RoomState) => setState(d));
      s.on('room:starting', (d: { msLeft: number }) => setStartingAt(Date.now() + d.msLeft));
      s.on('room:question', (q: ArenaQuestion) => {
        setStartingAt(null);
        setMarked(null);
        setReveal(null);
        setQuestion(q);
      });
      s.on('room:marked', (m: RoomMark) => setMarked(m));
      s.on('room:reveal', (r: RoomReveal) => setReveal(r));
      s.on('room:results', (r: RoomResults) => setResults(r));
      s.on('room:chat', (c: { from: string; text: string }) => setChat((xs) => [...xs.slice(-3), { key: Date.now() + Math.random(), from: c.from, text: c.text }]));
      s.on('room:error', (e: { message: string }) => setError(e.message));
    })();
    return () => {
      cancelled = true;
      s?.emit('room:leave', { code });
      s?.disconnect();
      socket.current = null;
      void qc.invalidateQueries({ queryKey: ['arena', 'lobby'] }); // the arena now offers the way back in
    };
  }, [code, qc]);

  const emit = useCallback((event: string, body: object = {}) => socket.current?.emit(event, { code, ...body }), [code]);
  return {
    state,
    you,
    connected,
    startingAt,
    question,
    marked,
    reveal,
    results,
    chat,
    error,
    clearError: () => setError(null),
    start: () => emit('room:start'),
    answer: (index: number, optionId: string | null) => emit('room:answer', { index, optionId }),
    say: (phrase: Phrase) => emit('room:chat', { phrase }),
  };
}

export const PHRASES: Record<Phrase, string> = { gl: 'Good luck!', gg: 'Good game!', wow: 'Wow!', close: 'That was close!', hard: 'That one was hard!', again: 'Rematch?' };
