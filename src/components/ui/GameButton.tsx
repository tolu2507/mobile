import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { palette } from '@/theme';

type Variant = 'sun' | 'accent' | 'white' | 'outline' | 'danger';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  /** Role accent for variant="accent" (pass the role theme's accent + shadow). */
  color?: string;
  shadowColor?: string;
  size?: 'md' | 'lg' | 'xl';
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  accessibilityHint?: string;
};

const DEPTH = 4;

/**
 * The signature BrainBox button: chunky, with a solid "ledge" under it that the face
 * presses down into. Used for every primary action across the apps.
 */
export function GameButton({
  label,
  onPress,
  variant = 'accent',
  color = palette.violet[500],
  shadowColor = palette.violet[700],
  size = 'lg',
  icon,
  loading,
  disabled,
  className = '',
  accessibilityHint,
}: Props) {
  const pressed = useSharedValue(0);
  const face = useAnimatedStyle(() => ({ transform: [{ translateY: pressed.value * DEPTH }] }));

  const styles: Record<Variant, { bg: string; ledge: string; text: string; border?: string }> = {
    sun: { bg: palette.sun[400], ledge: palette.sun[600], text: palette.ink.DEFAULT },
    accent: { bg: color, ledge: shadowColor, text: palette.white },
    white: { bg: palette.white, ledge: 'rgba(0,0,0,0.15)', text: color },
    outline: { bg: palette.white, ledge: palette.ink[200], text: palette.ink.DEFAULT, border: palette.ink[200] },
    danger: { bg: palette.white, ledge: '#F3C1B2', text: palette.coral[700], border: '#F3C1B2' },
  };
  const s = styles[variant];
  const height = size === 'xl' ? 60 : size === 'lg' ? 56 : 48;
  const fontSize = size === 'xl' ? 20 : size === 'lg' ? 17 : 15;
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={inactive}
      onPressIn={() => pressed.set(withTiming(1, { duration: 70 }))}
      onPressOut={() => pressed.set(withTiming(0, { duration: 120 }))}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress?.();
      }}
      className={className}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <View style={{ borderRadius: 18, backgroundColor: s.ledge, paddingBottom: DEPTH }}>
        {/* The animated view only moves; a plain view inside carries the look (mixing the two drops styles on Android). */}
        <Animated.View style={face}>
          <View
            style={{
              height,
              borderRadius: 18,
              backgroundColor: s.bg,
              borderWidth: s.border ? 2 : 0,
              borderColor: s.border,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              paddingHorizontal: 18,
            }}
          >
          {loading ? (
            <ActivityIndicator color={s.text} />
          ) : (
            <>
              {icon}
              <Text style={{ color: s.text, fontSize }} className="font-body-extrabold">
                {label}
              </Text>
            </>
          )}
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
}
