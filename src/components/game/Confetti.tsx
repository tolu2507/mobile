import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { palette } from '@/theme';

const COLORS = [palette.violet[500], palette.sun[400], palette.mint[400], palette.coral[400], palette.sky[400]];

/** Stable pseudo-random in [0, 1) so the burst looks random but renders the same every time. */
const rand = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

type Piece = { angle: number; distance: number; size: number; color: string; spin: number; delay: number; round: boolean };

function Particle({ p, duration }: { p: Piece; duration: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.set(withDelay(p.delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) })));
  }, [p.delay, duration, t]);
  const style = useAnimatedStyle(() => {
    const x = Math.cos(p.angle) * p.distance * t.value;
    // Burst out, then gravity pulls the piece down.
    const y = Math.sin(p.angle) * p.distance * t.value + 260 * t.value * t.value;
    return {
      opacity: t.value < 0.75 ? 1 : 1 - (t.value - 0.75) / 0.25,
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${p.spin * t.value}deg` }, { scale: 1 - 0.3 * t.value }],
    };
  });
  return (
    <Animated.View
      style={[{ position: 'absolute', width: p.size, height: p.round ? p.size : p.size * 1.6, borderRadius: p.round ? p.size : 3, backgroundColor: p.color }, style]}
    />
  );
}

/** A one-shot burst of confetti from the centre of its parent. Re-fire by changing `key`. */
export function Confetti({ count = 36, duration = 1400, spread = 190 }: { count?: number; duration?: number; spread?: number }) {
  const reduced = useReducedMotion();
  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        angle: -Math.PI / 2 + (rand(i, 0) - 0.5) * Math.PI * 1.6,
        distance: spread * (0.45 + rand(i, 1) * 0.75),
        size: 7 + rand(i, 2) * 6,
        color: COLORS[i % COLORS.length],
        spin: (rand(i, 3) - 0.5) * 900,
        delay: rand(i, 4) * 120,
        round: i % 4 === 0,
      })),
    [count, spread],
  );
  if (reduced) return null;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      {pieces.map((p, i) => (
        <Particle key={i} p={p} duration={duration} />
      ))}
    </View>
  );
}
