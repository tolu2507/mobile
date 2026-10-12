import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/tabs';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/theme';

export type TabIcon = keyof typeof Ionicons.glyphMap;

type Props = BottomTabBarProps & {
  accent: string;
  icons: Record<string, TabIcon>;
  /** "playful" = floating dark bar with big icons and no labels (primary-school kids). */
  variant?: 'standard' | 'playful';
};

function TabButton({ focused, label, icon, accent, variant, onPress, onLongPress }: {
  focused: boolean; label: string; icon: TabIcon; accent: string; variant: 'standard' | 'playful'; onPress: () => void; onLongPress: () => void;
}) {
  const bubble = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused ? 1 : 0.6, { damping: 14 }) }],
    opacity: withSpring(focused ? 1 : 0),
  }));
  const playful = variant === 'playful';
  const iconColor = playful ? (focused ? palette.ink.DEFAULT : palette.white) : focused ? accent : palette.ink[500];

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      className="flex-1 items-center justify-center"
      style={{ minHeight: 56 }}
    >
      <View className="items-center justify-center" style={{ width: playful ? 54 : 64, height: playful ? 54 : 32 }}>
        <Animated.View
          style={[
            { position: 'absolute', inset: 0, borderRadius: playful ? 18 : 999, backgroundColor: playful ? palette.sun[400] : `${accent}1F` },
            bubble,
          ]}
        />
        <Ionicons name={focused ? (icon.replace('-outline', '') as TabIcon) : icon} size={playful ? 26 : 23} color={iconColor} />
      </View>
      {playful ? null : (
        <Text style={{ color: focused ? accent : palette.ink[500] }} className={`mt-1 text-[12px] ${focused ? 'font-body-bold' : 'font-body-semibold'}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

/** One tab bar for all roles, themed by the role's accent. */
export function TabBar({ state, descriptors, navigation, accent, icons, variant = 'standard' }: Props) {
  const insets = useSafeAreaInsets();
  const playful = variant === 'playful';
  const routes = state.routes.filter((r) => icons[r.name]);

  return (
    <View
      style={
        playful
          ? { position: 'absolute', left: 20, right: 20, bottom: Math.max(insets.bottom, 16), height: 72, borderRadius: 26, backgroundColor: palette.ink.DEFAULT, flexDirection: 'row', paddingHorizontal: 8 }
          : { flexDirection: 'row', backgroundColor: palette.white, borderTopWidth: 1, borderTopColor: palette.ink[100], paddingTop: 8, paddingBottom: Math.max(insets.bottom, 10), paddingHorizontal: 8 }
      }
      accessibilityRole="tablist"
    >
      {routes.map((route) => {
        const index = state.routes.indexOf(route);
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = (options.title ?? route.name) as string;
        return (
          <TabButton
            key={route.key}
            focused={focused}
            label={label}
            icon={icons[route.name]}
            accent={accent}
            variant={variant}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                Haptics.selectionAsync().catch(() => {});
                navigation.navigate(route.name, route.params);
              }
            }}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
          />
        );
      })}
    </View>
  );
}
