import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GameButton } from '@/components/ui';
import { palette } from '@/theme';

/** A slowly bobbing shape for the hero — playful without being busy. */
function Floater({ size, color, top, left, delay, rounded = 999 }: { size: number; color: string; top: number; left: number; delay: number; rounded?: number }) {
  const y = useSharedValue(0);
  useEffect(() => {
    const t = setTimeout(() => {
      y.value = withRepeat(withTiming(-14, { duration: 2200, easing: Easing.inOut(Easing.sin) }), -1, true);
    }, delay);
    return () => clearTimeout(t);
  }, [y, delay]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[{ position: 'absolute', top, left, width: size, height: size, borderRadius: rounded, backgroundColor: color }, style]} />;
}

export default function Welcome() {
  return (
    <View style={{ flex: 1, backgroundColor: palette.violet[500] }}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', inset: 0 }}>
        <Floater size={120} color={palette.sun[400]} top={90} left={-30} delay={0} />
        <Floater size={70} color={palette.mint[400]} top={180} left={280} delay={400} rounded={22} />
        <Floater size={46} color={palette.coral[400]} top={330} left={60} delay={800} rounded={14} />
        <Floater size={90} color={palette.sky[400]} top={300} left={250} delay={1200} />
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View className="flex-1 justify-end gap-8 px-6 pb-6">
          <Animated.View entering={FadeInDown.duration(600)} className="gap-4">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white">
              <Ionicons name="sparkles" size={28} color={palette.violet[500]} />
            </View>
            <Text accessibilityRole="header" className="font-display text-[44px] leading-[46px] text-white">
              Learning that feels like play.
            </Text>
            <Text className="font-body text-[17px] leading-[25px] text-violet-100">
              Quests and leagues for students. Weekly progress reports for parents. Approved lesson teachers when you need extra help.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(600)} className="gap-3">
            <GameButton label="I’m a student" variant="sun" size="xl" onPress={() => router.push('/student-login')} />
            <GameButton
              label="I'm a parent"
              variant="white"
              color={palette.violet[700]}
              size="lg"
              onPress={() => router.push({ pathname: '/signup', params: { role: 'PARENT' } })}
            />
            <View className="flex-row justify-center gap-6 py-2">
              <Text accessibilityRole="link" onPress={() => router.push({ pathname: '/signup', params: { role: 'TUTOR' } })} className="py-2 font-body-bold text-[15px] text-white underline">
                Teach with Nexus
              </Text>
              <Text accessibilityRole="link" onPress={() => router.push('/login')} className="py-2 font-body-bold text-[15px] text-white underline">
                I have an account
              </Text>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}
