import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Easing, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { CircularProgress } from '@/components/reacticx/organisms/circular-progress';
import { palette } from '@/theme';
import { CountUp } from './CountUp';

/** The score as a ring that sweeps round while the percentage counts up. */
export function ScoreRing({ percent, color, size = 148, delay = 250 }: { percent: number; color: string; size?: number; delay?: number }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.set(withDelay(delay, withTiming(percent, { duration: 1100, easing: Easing.out(Easing.cubic) })));
  }, [percent, delay, progress]);
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={`Score ${percent} percent`}>
      <CircularProgress
        progress={progress}
        size={size}
        strokeWidth={14}
        gap={6}
        outerCircleColor={palette.ink[100]}
        progressCircleColor={color}
        backgroundColor="#FFFFFF"
        renderIcon={() => (
          <View className="flex-row items-baseline">
            <CountUp value={percent} delay={delay} fontSize={36} color={palette.ink.DEFAULT} />
            <Text className="font-display text-[20px] text-ink">%</Text>
          </View>
        )}
      />
    </View>
  );
}
