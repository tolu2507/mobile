import { Image } from 'expo-image';
import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { WORLD_ART } from './art';
import type { World } from './worlds';

/** A world's island art. `width` sets the size; the island bobs gently unless motion is reduced. */
export function WorldIsland({ world, width = 120, bob = true, delay = 0 }: { world: World; width?: number; bob?: boolean; delay?: number }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!bob || reduced) {
      t.set(0);
      return;
    }
    const half = { duration: 1200, easing: Easing.inOut(Easing.sin) };
    t.set(withDelay(delay, withRepeat(withSequence(withTiming(1, half), withTiming(0, half)), -1)));
  }, [bob, reduced, delay, t]);
  const float = useAnimatedStyle(() => ({ transform: [{ translateY: -6 * t.value }] }));

  return (
    <Animated.View accessible={false} importantForAccessibility="no-hide-descendants" style={[{ width, height: width }, float]}>
      <Image source={WORLD_ART[world.key].island} style={{ width, height: width }} contentFit="contain" />
    </Animated.View>
  );
}
