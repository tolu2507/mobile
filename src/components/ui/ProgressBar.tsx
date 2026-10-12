import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';

type Props = {
  value: number; // 0–1
  color: string;
  track?: string;
  height?: number;
  accessibilityLabel?: string;
};

/** Fills from 0 on mount so progress always feels earned. */
export function ProgressBar({ value, color, track = 'rgba(0,0,0,0.08)', height = 10, accessibilityLabel }: Props) {
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withTiming(Math.max(0, Math.min(1, value)), { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [value, width]);
  const fill = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={{ height, borderRadius: 999, backgroundColor: track, overflow: 'hidden' }}
    >
      <Animated.View style={[{ height: '100%', borderRadius: 999, backgroundColor: color }, fill]} />
    </View>
  );
}
