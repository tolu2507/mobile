import * as Haptics from 'expo-haptics';
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & { className?: string; haptic?: boolean; scaleTo?: number };

/** Anything tappable that isn't a button: cards, list rows, tiles. Shrinks slightly and ticks on press. */
export function PressableScale({ haptic = true, scaleTo = 0.97, style, onPressIn, onPressOut, onPress, ...props }: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      accessibilityRole="button"
      onPressIn={(e) => {
        scale.set(withSpring(scaleTo, { damping: 18, stiffness: 400 }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, { damping: 14, stiffness: 300 }));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      style={[animated, style as object]}
      {...props}
    />
  );
}
