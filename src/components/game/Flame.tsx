import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

/** A streak flame that flickers gently while it's alive (static when the streak is 0 or motion is reduced). */
export function Flame({ size = 18, color = '#FF8A3D', alive = true }: { size?: number; color?: string; alive?: boolean }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!alive || reduced) return;
    t.set(withRepeat(withSequence(withTiming(1, { duration: 420, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: 520, easing: Easing.inOut(Easing.sin) })), -1));
  }, [alive, reduced, t]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: 1 + t.value * 0.12 }, { scaleX: 1 - t.value * 0.05 }, { rotate: `${(t.value - 0.5) * 8}deg` }] }));
  return (
    <Animated.View style={[{ transformOrigin: 'bottom' }, style]}>
      <MaterialCommunityIcons name="fire" size={size} color={alive ? color : 'rgba(255,255,255,0.45)'} />
    </Animated.View>
  );
}
