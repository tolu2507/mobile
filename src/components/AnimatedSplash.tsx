import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { fonts, palette } from '@/theme';
import { LOGO_B, LOGO_HEAD, MARK_VIEWBOX } from './Logo';

/** Same size as the native splash image (app.json: expo-splash-screen imageWidth), so the hand-over is seamless. */
const SIZE = 140;

/**
 * Takes over from the native splash showing the exact same picture, then plays: the learner's head bounces,
 * the mark lifts and "BrainBox" slides in, and the whole thing fades away to reveal the app underneath.
 */
export function AnimatedSplash() {
  const [done, setDone] = useState(false);
  const reduced = useReducedMotion();
  const head = useSharedValue(0);
  const lift = useSharedValue(0);
  const word = useSharedValue(0);
  const fade = useSharedValue(1);

  useEffect(() => {
    const finish = () => setDone(true);
    // Never cover the app for long, even if an animation callback doesn't fire.
    const safety = setTimeout(finish, 2500);
    if (reduced) {
      word.set(withTiming(1, { duration: 200 }));
      fade.set(withDelay(600, withTiming(0, { duration: 250 }, (ok) => ok && scheduleOnRN(finish))));
      return () => clearTimeout(safety);
    }
    head.set(withSequence(withTiming(-22, { duration: 220, easing: Easing.out(Easing.quad) }), withSpring(0, { damping: 6, stiffness: 260 })));
    lift.set(withDelay(450, withSpring(1, { damping: 14, stiffness: 140 })));
    word.set(withDelay(550, withTiming(1, { duration: 380, easing: Easing.out(Easing.cubic) })));
    fade.set(withDelay(1300, withTiming(0, { duration: 320 }, (ok) => ok && scheduleOnRN(finish))));
    return () => clearTimeout(safety);
  }, [reduced, head, lift, word, fade]);

  const screen = useAnimatedStyle(() => ({ opacity: fade.value }));
  const mark = useAnimatedStyle(() => ({ transform: [{ translateY: -36 * lift.value }, { scale: 1 - 0.18 * lift.value }] }));
  const headStyle = useAnimatedStyle(() => ({ transform: [{ translateY: head.value }] }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: word.value, transform: [{ translateY: 16 * (1 - word.value) }] }));

  if (done) return null;
  return (
    // Hide the native splash only once this identical frame is on screen.
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.screen, screen]} onLayout={() => void SplashScreen.hideAsync()}>
      <Animated.View style={[{ width: SIZE, height: SIZE }, mark]}>
        <Svg width={SIZE} height={SIZE} viewBox={MARK_VIEWBOX} style={StyleSheet.absoluteFill}>
          <Path d={LOGO_B} fill="none" stroke="#FFFFFF" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
        <Animated.View style={[StyleSheet.absoluteFill, headStyle]}>
          <Svg width={SIZE} height={SIZE} viewBox={MARK_VIEWBOX}>
            <Circle {...LOGO_HEAD} fill={palette.sun[400]} />
          </Svg>
        </Animated.View>
      </Animated.View>
      <Animated.View style={[styles.word, wordStyle]}>
        <Text style={styles.wordText}>BrainBox</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: palette.violet[500], alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  word: { position: 'absolute', top: '50%', marginTop: 48 },
  wordText: { fontFamily: fonts.display, fontSize: 40, letterSpacing: -1.5, color: '#FFFFFF' },
});
