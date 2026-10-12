import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import AnimatedInput from '@/components/reacticx/base/animated-input-bar';
import { fonts, palette } from '@/theme';

type Props = Omit<TextInputProps, 'placeholder'> & {
  label: string;
  error?: string;
  hint?: string;
  accent?: string;
  secure?: boolean;
  /** One example, or several that take turns with Reacticx's letter-by-letter animation. */
  placeholder?: string | string[];
};

const HEIGHT = 54;

/**
 * Labelled input: animated focus ring, a shake + haptic when an error appears, and
 * rotating example placeholders. Multiline fields use a plain input (the animated
 * placeholder is single-line).
 */
export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, hint, accent = palette.violet[500], secure, style, onFocus, onBlur, placeholder, multiline, ...props },
  ref,
) {
  const [hidden, setHidden] = useState(true);
  const focus = useSharedValue(0);
  const invalid = useSharedValue(error ? 1 : 0);
  const shake = useSharedValue(0);
  const lastError = useRef(error);

  useEffect(() => {
    invalid.set(withTiming(error ? 1 : 0, { duration: 180 }));
    if (error && error !== lastError.current) {
      shake.set(withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }), withTiming(-5, { duration: 50 }), withTiming(5, { duration: 50 }), withTiming(0, { duration: 50 })));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    lastError.current = error;
  }, [error, invalid, shake]);

  const box = useAnimatedStyle(() => {
    const ring = interpolateColor(focus.value, [0, 1], [palette.ink[200], accent]);
    return {
      borderColor: interpolateColor(invalid.value, [0, 1], [ring, palette.coral[500]]),
      transform: [{ translateX: shake.value }],
      shadowOpacity: focus.value * 0.25,
    };
  });

  const placeholders = Array.isArray(placeholder) ? placeholder : placeholder ? [placeholder] : [];
  const inputStyle = { flex: 1, minHeight: HEIGHT, paddingHorizontal: 16, fontFamily: fonts.bodyMedium, fontSize: 16, color: palette.ink.DEFAULT };
  const handlers = {
    onFocus: (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      focus.set(withTiming(1, { duration: 160 }));
      onFocus?.(e);
    },
    onBlur: (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      focus.set(withTiming(0, { duration: 160 }));
      onBlur?.(e);
    },
  };

  return (
    <View className="gap-1.5">
      <Text className="font-body-bold text-[14px] text-ink">{label}</Text>
      <Animated.View
        style={[{ borderWidth: 2, borderRadius: 16, backgroundColor: palette.white, flexDirection: 'row', alignItems: 'center', shadowColor: accent, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, box]}
      >
        {multiline ? (
          <TextInput
            ref={ref}
            accessibilityLabel={label}
            accessibilityHint={hint}
            placeholder={placeholders[0]}
            placeholderTextColor={palette.ink[300]}
            multiline
            textAlignVertical="top"
            style={[inputStyle, { paddingTop: 14, paddingBottom: 14 }, style]}
            {...props}
            {...handlers}
          />
        ) : (
          <AnimatedInput
            ref={ref}
            accessibilityLabel={label}
            accessibilityHint={hint}
            placeholders={placeholders}
            secureTextEntry={secure && hidden}
            containerStyle={{ flex: 1, marginVertical: 0 }}
            inputWrapperStyle={{ paddingHorizontal: 0, paddingVertical: 0, minHeight: HEIGHT }}
            placeholderStyle={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: palette.ink[300], fontWeight: undefined }}
            inputStyle={[inputStyle, { paddingHorizontal: 18 }, style]}
            {...props}
            {...handlers}
          />
        )}
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            onPress={() => setHidden((h) => !h)}
            hitSlop={8}
            className="h-[54px] w-12 items-center justify-center"
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={22} color={palette.ink[500]} />
          </Pressable>
        ) : null}
      </Animated.View>
      {error ? (
        // NativeWind classes don't reach Animated.Text, so animate a wrapper instead.
        <Animated.View key={error} entering={FadeInDown.duration(180)} exiting={FadeOut.duration(120)}>
          <Text accessibilityLiveRegion="polite" className="font-body-semibold text-[13px] text-coral-700">
            {error}
          </Text>
        </Animated.View>
      ) : hint ? (
        <Text className="font-body text-[13px] text-ink-500">{hint}</Text>
      ) : null}
    </View>
  );
});
