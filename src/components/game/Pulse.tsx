import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

/** Breathes its child gently to draw the eye to "do this next". */
export function Pulse({ children, active = true, scale = 1.06, style }: { children: ReactNode; active?: boolean; scale?: number; style?: StyleProp<ViewStyle> }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!active || reduced) {
      t.set(0);
      return;
    }
    t.set(withRepeat(withSequence(withTiming(1, { duration: 700, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 700, easing: Easing.inOut(Easing.sin) })), -1));
  }, [active, reduced, t]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: 1 + (scale - 1) * t.value }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
}
