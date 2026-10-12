import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { palette } from '@/theme';
import { PressableScale } from './PressableScale';
import { Caption, Display } from './Text';

/** Back button + big title used at the top of every pushed screen. */
export function ScreenHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack?: () => void }) {
  return (
    <View className="gap-3">
      <PressableScale
        accessibilityLabel="Back"
        onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
        style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="chevron-back" size={22} color={palette.ink.DEFAULT} />
      </PressableScale>
      <View className="gap-1">
        <Display className="text-[30px] leading-[34px]">{title}</Display>
        {subtitle ? <Caption className="text-[15px] leading-[22px]">{subtitle}</Caption> : null}
      </View>
    </View>
  );
}
