import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { palette } from '@/theme';

function Star({ on, index, size, delay }: { on: boolean; index: number; size: number; delay: number }) {
  const s = useSharedValue(0);
  const at = delay + index * 280;
  useEffect(() => {
    s.set(withDelay(at, withSequence(withSpring(1.35, { damping: 6, stiffness: 260 }), withSpring(1, { damping: 9 }))));
    if (!on) return;
    const t = setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}), at);
    return () => clearTimeout(t);
  }, [at, on, s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }, { rotate: `${(1 - Math.min(s.value, 1)) * -40}deg` }] }));
  // Middle star sits higher and bigger, like a podium.
  const big = index === 1;
  return (
    <Animated.View style={[{ marginTop: big ? 0 : size * 0.25 }, style]}>
      <Ionicons name="star" size={big ? size * 1.25 : size} color={on ? '#FFB800' : palette.ink[200]} />
    </Animated.View>
  );
}

/** 1–3 stars that pop in one after another. */
export function Stars({ earned, size = 48, delay = 400 }: { earned: number; size?: number; delay?: number }) {
  return (
    <View accessibilityLabel={`${earned} of 3 stars`} className="flex-row items-start justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <Star key={i} index={i} on={i < earned} size={size} delay={delay} />
      ))}
    </View>
  );
}

export const starsForScore = (percent: number) => (percent >= 100 ? 3 : percent >= 75 ? 2 : percent >= 40 ? 1 : 0);

/** Fades children in with a pop after `delay` (for staged reward reveals). */
export function PopIn({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  const s = useSharedValue(0);
  useEffect(() => {
    s.set(withDelay(delay, withSpring(1, { damping: 11, stiffness: 180 })));
  }, [delay, s]);
  const style = useAnimatedStyle(() => ({ opacity: withTiming(s.value > 0.05 ? 1 : 0, { duration: 120 }), transform: [{ scale: 0.6 + 0.4 * s.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
