import { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

/** Soft pulsing placeholder shaped like the content that is loading. */
export function Skeleton({ width = '100%', height = 16, radius = 12, className = '' }: { width?: DimensionValue; height?: number; radius?: number; className?: string }) {
  const opacity = useSharedValue(0.5);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [opacity]);
  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <View className={className}>
      <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: 'rgba(23,19,58,0.08)' }, pulse]} />
    </View>
  );
}

/** A ready-made skeleton for a list of cards. */
export function CardListSkeleton({ count = 3, height = 76 }: { count?: number; height?: number }) {
  return (
    <View accessibilityLabel="Loading" className="gap-3">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} height={height} radius={20} />
      ))}
    </View>
  );
}
