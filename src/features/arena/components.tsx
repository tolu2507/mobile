import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, FadeOut, FadeInDown, interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MathText } from '@/components/MathText';
import { PressableScale } from '@/components/ui';
import { goBack as back } from '@/lib/nav';
import { playSound } from '@/lib/sounds';
import { fonts } from '@/theme';
import { PHRASES, type ChatLine, type Phrase } from './api';

/** The arena's night-time look: cyan is you, orange is the other player. */
/** Back, or to the Arena tab when there's nothing to go back to (a reloaded page on web, a link). */
export const goBack = () => back('/student/arena');

export const ARENA = {
  bg: '#14122E',
  panel: '#221F48',
  raised: '#2B2760',
  ledge: '#17143D',
  text: '#FFFFFF',
  muted: '#C9C2FF',
  you: '#3DD6F5',
  youLedge: '#1A8FA8',
  youInk: '#06222B',
  them: '#FF8A3D',
  themLedge: '#B44A12',
  themInk: '#2A0E02',
  gold: '#FFD23F',
  goldLedge: '#C79D00',
  goldInk: '#2A2000',
  right: '#3EE08F',
  rightLedge: '#1E8A54',
  rightInk: '#0D2B1C',
  wrong: '#FF6B7F',
  wrongLedge: '#A3283A',
  wrongInk: '#3A0710',
};

export function ArenaShell({ children, edges = ['top', 'bottom'] }: { children: ReactNode; edges?: ('top' | 'bottom')[] }) {
  return (
    <View style={{ flex: 1, backgroundColor: ARENA.bg }}>
      <StatusBar style="light" />
      <SafeAreaView edges={edges} style={{ flex: 1 }}>
        {children}
      </SafeAreaView>
    </View>
  );
}

export function ArenaButton({ label, onPress, color = ARENA.you, ledge = ARENA.youLedge, ink = ARENA.youInk, icon, disabled, big }: { label: string; onPress: () => void; color?: string; ledge?: string; ink?: string; icon?: ReactNode; disabled?: boolean; big?: boolean }) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={{ minHeight: big ? 62 : 52, borderRadius: 20, backgroundColor: color, borderBottomWidth: 5, borderBottomColor: ledge, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, opacity: disabled ? 0.45 : 1 }}
    >
      {icon}
      <Text style={{ fontFamily: fonts.display, fontSize: big ? 22 : 17, color: ink }}>{label}</Text>
    </PressableScale>
  );
}

/** A player's round badge: their initial in their colour. */
export function Badge({ initial, ring, size = 46, dim }: { initial: string; ring: string; size?: number; dim?: boolean }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: ARENA.raised, borderWidth: 3, borderColor: ring, alignItems: 'center', justifyContent: 'center', opacity: dim ? 0.45 : 1 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: size * 0.42, color: ARENA.text }}>{initial}</Text>
    </View>
  );
}

/** Shrinks from full to empty over the time left; turns red near the end. Freezes when `running` goes false. */
export function TimerBar({ msLeft, total, running }: { msLeft: number; total: number; running: boolean }) {
  const w = useSharedValue(Math.max(0, Math.min(1, msLeft / total)));
  useEffect(() => {
    if (running) w.set(withTiming(0, { duration: Math.max(0, msLeft), easing: Easing.linear }));
    else cancelAnimation(w);
  }, [running, msLeft, w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%`, backgroundColor: interpolateColor(w.value, [0, 0.3, 0.31, 1], [ARENA.wrong, ARENA.wrong, ARENA.you, ARENA.you]) }));
  return (
    <View accessibilityRole="progressbar" accessibilityLabel="Time left" style={{ height: 14, borderRadius: 7, backgroundColor: ARENA.raised, overflow: 'hidden' }}>
      <Animated.View style={[{ height: 14, borderRadius: 7 }, fill]} />
    </View>
  );
}

/** 3, 2, 1 — then `onDone`. */
export function Countdown({ onDone, from = 3 }: { onDone: () => void; from?: number }) {
  const [n, setN] = useState(from);
  useEffect(() => {
    Haptics.impactAsync(n > 0 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    if (n === 0) {
      playSound('whoosh');
      const t = setTimeout(onDone, 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((x) => x - 1), 900);
    return () => clearTimeout(t);
  }, [n, onDone]);
  return (
    <View accessibilityLiveRegion="assertive" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: ARENA.muted }}>Get ready…</Text>
      <Animated.Text key={n} entering={ZoomIn.springify().damping(12)} exiting={FadeOut.duration(150)} style={{ fontFamily: fonts.display, fontSize: 160, lineHeight: 180, color: ARENA.gold }}>
        {n || 'GO!'}
      </Animated.Text>
    </View>
  );
}

export function QuestionCard({ prompt, label }: { prompt: string; label: string }) {
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 26, paddingVertical: 24, paddingHorizontal: 20, borderBottomWidth: 7, borderBottomColor: '#8C7CFF', gap: 8 }}>
      <Text style={{ fontFamily: fonts.bodyExtrabold, fontSize: 13, color: '#5B3DF5', textAlign: 'center' }}>{label}</Text>
      <MathText text={prompt} size={prompt.length > 90 ? 18 : 22} fontFamily={fonts.bodyBold} color="#14122E" style={{ justifyContent: 'center' }} />
    </View>
  );
}

/**
 * The answer buttons. Short answers sit two by two; long ones stack.
 * After the answer is known: right one green, a wrong pick red, the rest fade.
 */
export function Answers({ options, picked, answerId, locked, onPick }: { options: { id: string; label: string }[]; picked: string | null; answerId: string | null; locked: boolean; onPick: (id: string) => void }) {
  const grid = options.every((o) => o.label.length <= 14);
  return (
    <View style={{ flexDirection: grid ? 'row' : 'column', flexWrap: 'wrap', gap: 12 }}>
      {options.map((o) => {
        const right = answerId !== null && o.id === answerId;
        const wrong = answerId !== null && o.id === picked && !right;
        const dim = answerId !== null ? !right && !wrong : locked && o.id !== picked;
        const bg = right ? ARENA.right : wrong ? ARENA.wrong : o.id === picked ? ARENA.you : ARENA.raised;
        const ledge = right ? ARENA.rightLedge : wrong ? ARENA.wrongLedge : o.id === picked ? ARENA.youLedge : ARENA.ledge;
        const ink = right ? ARENA.rightInk : wrong ? ARENA.wrongInk : o.id === picked ? ARENA.youInk : ARENA.text;
        return (
          <PressableScale
            key={o.id}
            disabled={locked}
            onPress={() => onPick(o.id)}
            accessibilityRole="button"
            accessibilityLabel={`${o.label}${right ? ', right answer' : wrong ? ', wrong' : ''}`}
            style={{ width: grid ? '47.8%' : '100%', minHeight: 64, borderRadius: 18, backgroundColor: bg, borderBottomWidth: 5, borderBottomColor: ledge, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 12, opacity: dim ? 0.35 : 1 }}
          >
            <MathText text={o.label} size={grid ? 22 : 17} fontFamily={fonts.bodyExtrabold} color={ink} style={{ justifyContent: 'center' }} />
          </PressableScale>
        );
      })}
    </View>
  );
}

/** "+240" floating up from the question card. */
export function Gain({ text, color }: { text: string; color: string }) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  const o = useSharedValue(1);
  useEffect(() => {
    if (reduced) return;
    y.set(withTiming(-50, { duration: 1100, easing: Easing.out(Easing.cubic) }));
    o.set(withSequence(withTiming(1, { duration: 600 }), withTiming(0, { duration: 500 })));
  }, [reduced, y, o]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: o.value }));
  return (
    <Animated.Text accessibilityLiveRegion="polite" style={[{ position: 'absolute', alignSelf: 'center', top: -34, fontFamily: fonts.display, fontSize: 38, color }, style]}>
      {text}
    </Animated.Text>
  );
}

/** One side of the scoreboard. */
export function ScoreSide({ label, name, initial, score, ring, align, note }: { label: string; name: string; initial: string; score: number; ring: string; align: 'left' | 'right'; note?: string | null }) {
  return (
    <View style={{ flex: 1, flexDirection: align === 'left' ? 'row' : 'row-reverse', alignItems: 'center', gap: 8 }}>
      <Badge initial={initial} ring={ring} />
      <View style={{ alignItems: align === 'left' ? 'flex-start' : 'flex-end', flexShrink: 1 }}>
        <Text numberOfLines={1} style={{ fontFamily: fonts.bodyExtrabold, fontSize: 12, color: ring }}>
          {label}
        </Text>
        <Text accessibilityLabel={`${name}: ${score} points`} style={{ fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: ARENA.text }}>
          {score}
        </Text>
        {note ? (
          <Animated.Text entering={FadeIn} style={{ fontFamily: fonts.bodyBold, fontSize: 11, color: ARENA.muted }}>
            {note}
          </Animated.Text>
        ) : null}
      </View>
    </View>
  );
}

/** One dot per question: done, current, to come. */
export function Dots({ total, current }: { total: number; current: number }) {
  return (
    <View accessibilityLabel={`Question ${current + 1} of ${total}`} style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i < current ? ARENA.you : i === current ? ARENA.text : ARENA.raised }} />
      ))}
    </View>
  );
}

/** Ready-made phrases: the only way players talk. */
export function QuickChat({ onSay, phrases = ['gl', 'gg', 'wow', 'again'] }: { onSay: (p: Phrase) => void; phrases?: Phrase[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
      {phrases.map((p) => (
        <PressableScale key={p} onPress={() => onSay(p)} accessibilityLabel={`Say ${PHRASES[p]}`} style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 999, backgroundColor: ARENA.raised, justifyContent: 'center' }}>
          <Text style={{ fontFamily: fonts.bodyExtrabold, fontSize: 14, color: ARENA.text }}>{PHRASES[p]}</Text>
        </PressableScale>
      ))}
    </View>
  );
}

/** The last few chat lines, newest at the bottom. */
export function ChatBubbles({ lines, nameOf, you }: { lines: ChatLine[]; nameOf: (id: string) => string; you: string | null }) {
  return (
    <View accessibilityLiveRegion="polite" style={{ gap: 6 }}>
      {lines.map((l) => (
        <Animated.View key={l.key} entering={FadeIn} style={{ alignSelf: l.from === you ? 'flex-end' : 'flex-start', backgroundColor: l.from === you ? ARENA.you : '#FFFFFF', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 }}>
          <Text style={{ fontFamily: fonts.bodyExtrabold, fontSize: 14, color: l.from === you ? ARENA.youInk : ARENA.bg }}>
            {l.from === you ? '' : `${nameOf(l.from)}: `}
            {l.text}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
}

export function BackBar({ onBack, title, kicker, right }: { onBack: () => void; title: string; kicker: string; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <PressableScale onPress={onBack} accessibilityLabel="Back" style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: ARENA.raised, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="chevron-back" size={22} color={ARENA.text} />
      </PressableScale>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontFamily: fonts.bodyExtrabold, fontSize: 12, color: ARENA.them, letterSpacing: 0.5 }}>
          {kicker.toUpperCase()}
        </Text>
        <Text accessibilityRole="header" numberOfLines={1} style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: ARENA.text }}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

export function Trophies({ count }: { count: number }) {
  return (
    <View accessibilityLabel={`${count} trophies`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: ARENA.raised, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
      <Ionicons name="trophy" size={16} color={ARENA.gold} />
      <Text style={{ fontFamily: fonts.bodyExtrabold, fontSize: 15, color: ARENA.text }}>{count}</Text>
    </View>
  );
}

/** Rings pulsing out from the player while the server looks for an opponent. */
export function Radar({ initial }: { initial: string }) {
  return (
    <View accessible={false} style={{ width: 300, height: 300, alignItems: 'center', justifyContent: 'center' }}>
      {[0, 1, 2].map((i) => (
        <Ring key={i} delay={i * 660} />
      ))}
      <Badge initial={initial} ring={ARENA.you} size={96} />
    </View>
  );
}

function Ring({ delay }: { delay: number }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!reduced) t.set(withDelay(delay, withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }), -1)));
  }, [reduced, delay, t]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 0.6 + 2 * t.value }], opacity: reduced ? 0.3 : 0.9 * (1 - t.value) }));
  return <Animated.View style={[{ position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: ARENA.you }, style]} />;
}

/** One line of a leaderboard: medal colours for the top three, outlined when it's you. */
export function BoardRow({ rank, name, initial, value, you, index }: { rank: number; name: string; initial: string; value: string; you: boolean; index: number }) {
  const medal = rank === 1 ? ARENA.gold : rank === 2 ? '#D9DCE8' : rank === 3 ? '#E8A46A' : null;
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 10) * 40)}
      accessibilityLabel={`Number ${rank}, ${name}${you ? ' (you)' : ''}, ${value}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: you ? ARENA.raised : ARENA.panel, borderRadius: 16, padding: 10, borderWidth: you ? 2 : 0, borderColor: ARENA.you }}
    >
      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: medal ?? 'transparent', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 16, color: medal ? ARENA.goldInk : ARENA.muted }}>{rank}</Text>
      </View>
      <Badge initial={initial} ring={you ? ARENA.you : ARENA.them} size={38} />
      <Text numberOfLines={1} style={{ flex: 1, fontFamily: fonts.bodyExtrabold, fontSize: 15, color: ARENA.text }}>
        {name}
        {you ? ' (you)' : ''}
      </Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 18, color: ARENA.text }}>{value}</Text>
    </Animated.View>
  );
}
