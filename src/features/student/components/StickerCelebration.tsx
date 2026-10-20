import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { AppState, Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Confetti, CountUp } from '@/components/game';
import { playSound } from '@/lib/sounds';
import { useVoice } from '@/lib/speech';
import { palette } from '@/theme';
import type { Badge } from '@/types/api';
import { useBadges, useMarkStickersSeen, useStickerStats, useStudentHome } from '../api';
import { useStickerReplay } from '../stickerReplay';
import { Coin, RARITY, RarityPill, StickerFace, nextUp } from './Sticker';

const SIZE = 168;

/** When each part of the unlock appears (ms). The whole thing runs about 10 seconds, then waits for "Collect!". */
const T = { backdrop: 0, sticker: 350, burst: 1400, title: 1800, name: 2500, about: 3000, coins: 3700, second: 5200, teaser: 6300, skip: 4000, collect: 8600 };

/**
 * Plays the unlock celebration for every sticker the child hasn't opened yet: straight after a round,
 * or the next time they open the app for stickers earned while away (mock ranks, league finishes).
 * Also replays it for a collected sticker the child taps in their sticker book.
 */
export function StickerCelebrations() {
  const badges = useBadges();
  const home = useStudentHome();
  const mark = useMarkStickersSeen();
  const replaying = useStickerReplay();
  const [opened, setOpened] = useState<string[]>([]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void badges.refetch();
    });
    return () => sub.remove();
  }, [badges]);

  if (replaying.badge) {
    const b = replaying.badge;
    return <Celebration key={`replay-${b.id}`} b={b} next={null} showCoins={!!home.data?.coins && b.coins > 0} more={0} replay onDone={replaying.stop} />;
  }

  const queue = (badges.data ?? []).filter((b) => b.earned && !b.seen && !opened.includes(b.id));
  const current = queue[0];
  if (!current) return null;

  return (
    <Celebration
      key={current.id}
      b={current}
      next={nextUp(badges.data)}
      showCoins={!!home.data?.coins && current.coins > 0}
      more={queue.length - 1}
      onDone={() => {
        setOpened((o) => [...o, current.id]);
        mark.mutate([current.id]);
      }}
    />
  );
}

function Celebration({ b, next, showCoins, more, replay = false, onDone }: { b: Badge; next: Badge | null; showCoins: boolean; more: number; replay?: boolean; onDone: () => void }) {
  const reduced = useReducedMotion();
  const r = RARITY[b.rarity];
  const big = b.rarity === 'EPIC' || b.rarity === 'LEGENDARY';
  const at = (ms: number) => (reduced ? 0 : ms);
  const [bursts, setBursts] = useState(0);
  const [canSkip, setCanSkip] = useState(reduced || replay);
  const [canCollect, setCanCollect] = useState(reduced);
  const { muted, toggle } = useVoice();

  const backdrop = useSharedValue(0);
  const rays = useSharedValue(0);
  const glow = useSharedValue(0);
  const scale = useSharedValue(reduced ? 1 : 0);
  const spin = useSharedValue(reduced ? 0 : 900);
  const shine = useSharedValue(-1);

  useEffect(() => {
    backdrop.set(withTiming(1, { duration: at(400) }));
    if (reduced) {
      playSound('chime');
      return;
    }
    rays.set(withRepeat(withTiming(360, { duration: 14_000, easing: Easing.linear }), -1));
    glow.set(withDelay(T.burst, withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0.55, { duration: 900 })), -1, true)));
    scale.set(withDelay(T.sticker, withSequence(withTiming(1.25, { duration: 900, easing: Easing.out(Easing.back(2)) }), withSpring(1, { damping: 9, stiffness: 140 }))));
    spin.set(withDelay(T.sticker, withTiming(0, { duration: 1050, easing: Easing.out(Easing.cubic) })));
    shine.set(withDelay(T.burst + 200, withSequence(withTiming(1, { duration: 700 }), withDelay(3000, withSequence(withTiming(-1, { duration: 0 }), withTiming(1, { duration: 700 }))))));

    const timers = [
      setTimeout(() => playSound('whoosh'), T.sticker),
      ...(showCoins ? [setTimeout(() => playSound('coin'), T.coins + 250)] : []),
      setTimeout(() => {
        setBursts(1);
        playSound('chime');
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }, T.burst),
      setTimeout(() => setCanSkip(true), T.skip),
      setTimeout(() => setCanCollect(true), T.collect),
      ...(big
        ? [
            setTimeout(() => {
              setBursts(2);
              playSound('fanfare');
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
            }, T.second),
          ]
        : []),
      ...(b.rarity === 'LEGENDARY' ? [T.burst + 180, T.burst + 360].map((ms) => setTimeout(() => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), ms)) : []),
    ];
    return () => timers.forEach(clearTimeout);
    // Runs once per sticker; the component is keyed by sticker id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const raysStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rays.value}deg` }], opacity: 0.18 + 0.12 * glow.value }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.25 + 0.45 * glow.value, transform: [{ scale: 0.9 + 0.2 * glow.value }] }));
  const stickerStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 800 }, { rotateY: `${spin.value}deg` }, { scale: scale.value }] }));
  const shineStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shine.value * SIZE }, { rotate: '20deg' }], opacity: shine.value > -1 && shine.value < 1 ? 0.55 : 0 }));

  const collect = () => {
    void Haptics.selectionAsync().catch(() => {});
    onDone();
  };

  return (
    <Modal visible transparent statusBarTranslucent animationType="none" onRequestClose={canSkip ? collect : () => {}}>
      <Animated.View style={[{ flex: 1, backgroundColor: r.backdrop }, backdropStyle]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View className="h-12 flex-row items-center justify-between px-4">
            <Pressable accessibilityRole="button" accessibilityLabel={muted ? 'Turn sounds on' : 'Turn sounds off'} onPress={toggle} hitSlop={12} className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}>
              <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={18} color="#FFFFFF" />
            </Pressable>
            {canSkip && !canCollect ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Skip" onPress={collect} hitSlop={12} className="rounded-full px-3 py-1.5" style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}>
                <Text className="font-body-bold text-[13px] text-white">Skip</Text>
              </Pressable>
            ) : null}
          </View>

          <View className="flex-1 items-center justify-center px-6" accessibilityLiveRegion="polite">
            {/* Light rays and glow behind the sticker */}
            <View style={{ width: SIZE * 2.4, height: SIZE * 2.4, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View style={[{ position: 'absolute', width: SIZE * 2.4, height: SIZE * 2.4, alignItems: 'center', justifyContent: 'center' }, raysStyle]}>
                {Array.from({ length: 12 }, (_, i) => (
                  <View key={i} style={{ position: 'absolute', width: 22, height: SIZE * 2.4, borderRadius: 11, backgroundColor: r.glow, transform: [{ rotate: `${i * 15}deg` }] }} />
                ))}
              </Animated.View>
              <Animated.View style={[{ position: 'absolute', width: SIZE * 1.5, height: SIZE * 1.5, borderRadius: SIZE, backgroundColor: r.glow }, glowStyle]} />

              <Animated.View style={stickerStyle}>
                <View style={{ width: SIZE, height: SIZE, borderRadius: SIZE, overflow: 'hidden' }}>
                  <StickerFace icon={b.icon} rarity={b.rarity} size={SIZE} />
                  <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: -SIZE / 2, left: SIZE / 2 - 22, width: 44, height: SIZE * 2, backgroundColor: '#FFFFFF' }, shineStyle]} />
                </View>
              </Animated.View>

              {bursts >= 1 ? <Confetti key="a" count={big ? 70 : 44} spread={SIZE * 1.6} duration={1700} /> : null}
              {bursts >= 2 ? <Confetti key="b" count={80} spread={SIZE * 1.9} duration={1900} /> : null}
            </View>

            <View className="mt-2 w-full items-center gap-2">
              <Reveal at={at(T.title)}>
                <Text style={{ color: r.glow, letterSpacing: 3 }} className="text-center font-body-extrabold text-[14px] uppercase">
                  {replay ? 'Your sticker' : 'New sticker!'}
                </Text>
              </Reveal>
              <Reveal at={at(T.title + 150)}>
                <RarityPill rarity={b.rarity} dark />
              </Reveal>
              <Reveal at={at(T.name)}>
                <Text className="text-center font-display text-[34px] leading-[40px] text-white">{b.name}</Text>
              </Reveal>
              <Reveal at={at(T.about)}>
                <Text className="text-center font-body text-[16px] leading-[22px]" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {b.description}
                </Text>
              </Reveal>
              {showCoins ? (
                <Reveal at={at(T.coins)}>
                  <View className="mt-1 flex-row items-center gap-2 rounded-full px-4 py-2" style={{ backgroundColor: 'rgba(255,197,61,0.18)' }}>
                    <Coin size={22} />
                    <Text className="font-display text-[22px]" style={{ color: palette.sun[400] }}>
                      +
                    </Text>
                    <CountUp value={b.coins} delay={at(T.coins) + 250} fontSize={22} color={palette.sun[400]} />
                    <Text className="font-body-bold text-[16px]" style={{ color: palette.sun[400] }}>
                      coins
                    </Text>
                  </View>
                </Reveal>
              ) : null}
            </View>
          </View>

          <View className="gap-3 px-6 pb-4">
            <Reveal at={at(T.teaser)} full>
              <Perks b={b} showCoins={showCoins} next={next && next.id !== b.id ? next : null} />
            </Reveal>
            <Reveal at={at(T.collect)} show={canCollect} full>
              <Pressable
                accessibilityRole="button"
                onPress={collect}
                disabled={!canCollect}
                style={{ backgroundColor: r.face, borderRadius: 20, paddingVertical: 17, alignItems: 'center', borderBottomWidth: 5, borderBottomColor: r.text }}
              >
                <Text className="font-display text-[20px] text-white">{replay ? 'Done' : more ? `Collect! (${more} more to open)` : 'Collect!'}</Text>
              </Pressable>
            </Reveal>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const ordinal = (n: number) => {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n.toLocaleString()}${s}`;
};

/** What this sticker gives and how rare it is: coins, who else has it, and where the child's collection ranks. */
function Perks({ b, showCoins, next }: { b: Badge; showCoins: boolean; next: Badge | null }) {
  const stats = useStickerStats(b.id);
  const s = stats.data;
  const chips: { icon: React.ReactNode; text: string }[] = [
    showCoins
      ? { icon: <Coin size={16} />, text: `+${b.coins.toLocaleString()} coins` }
      : { icon: <Ionicons name="sparkles" size={16} color={RARITY[b.rarity].glow} />, text: `${RARITY[b.rarity].label} sticker` },
  ];
  if (s) {
    chips.push(
      { icon: <Ionicons name="people" size={16} color="#FFFFFF" />, text: s.owners === 1 ? 'Only you have it!' : `${s.percent}% of collectors have it` },
      { icon: <Ionicons name="flag" size={16} color="#FFFFFF" />, text: `${ordinal(s.unlockedOrder)} to unlock it` },
      { icon: <Ionicons name="trophy" size={16} color={palette.sun[400]} />, text: `#${s.collectorRank.toLocaleString()} of ${s.collectors.toLocaleString()} collectors` },
    );
  }
  return (
    <View className="gap-2.5 rounded-[20px] p-3" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
      <View className="flex-row flex-wrap gap-2">
        {chips.map((c) => (
          <View key={c.text} className="flex-row items-center gap-1.5 rounded-xl px-2.5 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.08)', width: '48.5%' }}>
            {c.icon}
            <Text numberOfLines={2} className="flex-1 font-body-bold text-[12px] leading-[16px] text-white">
              {c.text}
            </Text>
          </View>
        ))}
      </View>
      {s ? (
        <Text className="font-body text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
          You have {s.myStickers} {s.myStickers === 1 ? 'sticker' : 'stickers'}. Collect more to climb the collectors’ leaderboard.
        </Text>
      ) : null}
      {next ? (
        <View className="flex-row items-center gap-2.5">
          <StickerFace icon={next.icon} rarity={next.rarity} earned={false} size={34} />
          <View className="flex-1 gap-1">
            <Text className="font-body-bold text-[13px] text-white">
              Next up: {next.name} · {(next.progress!.target! - next.progress!.current).toLocaleString()} to go
            </Text>
            <View style={{ height: 5, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
              <View style={{ width: `${Math.max(6, (next.progress!.current / next.progress!.target!) * 100)}%`, height: 5, backgroundColor: RARITY[next.rarity].glow }} />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

/** Fades and lifts its children in at `at` ms. `show` lets the parent hold it back until something is ready. */
function Reveal({ at, show = true, full = false, children }: { at: number; show?: boolean; full?: boolean; children: React.ReactNode }) {
  const v = useSharedValue(0);
  useEffect(() => {
    if (show) v.set(withDelay(at, withSpring(1, { damping: 14, stiffness: 160 })));
  }, [at, show, v]);
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, v.value), transform: [{ translateY: 14 * (1 - v.value) }, { scale: 0.92 + 0.08 * v.value }] }));
  return <Animated.View style={[{ alignSelf: 'stretch', alignItems: full ? 'stretch' : 'center' }, style]}>{children}</Animated.View>;
}
