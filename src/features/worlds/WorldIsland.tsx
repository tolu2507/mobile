import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import { fonts } from '@/theme';
import type { World } from './worlds';

/** A world's island floating in its sea. `width` sets the size; the island bobs gently unless motion is reduced. */
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

  const h = width * 0.76;
  const land = { w: width * 0.76, h: width * 0.55 };
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ width, height: h, borderRadius: width, backgroundColor: world.sea, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            width: land.w,
            height: land.h,
            backgroundColor: world.land,
            borderTopLeftRadius: land.w * 0.5,
            borderTopRightRadius: land.w * 0.46,
            borderBottomLeftRadius: land.w * 0.42,
            borderBottomRightRadius: land.w * 0.52,
            borderBottomWidth: land.h * 0.14,
            borderBottomColor: world.ledge,
            alignItems: 'center',
            justifyContent: 'center',
          },
          float,
        ]}
      >
        {'text' in world.glyph ? (
          <Text style={{ fontFamily: fonts.display, fontSize: width * 0.24, color: world.ink }}>{world.glyph.text}</Text>
        ) : (
          <MaterialCommunityIcons name={world.glyph.icon} size={width * 0.3} color={world.ink} />
        )}
      </Animated.View>
    </View>
  );
}
