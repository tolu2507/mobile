import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { palette } from '@/theme';

const rewardTones = {
  coral: { bg: palette.coral[50], badge: palette.coral[100], border: palette.coral[100] },
  violet: { bg: palette.violet[50], badge: palette.violet[500], border: palette.violet[100] },
  sun: { bg: palette.sun[50], badge: palette.sun[400], border: palette.sun[100] },
};

/** A celebration card on results screens: streaks, level-ups, badges. */
export function RewardCard({ tone, icon, title, body }: { tone: keyof typeof rewardTones; icon: ReactNode; title: string; body: string }) {
  const t = rewardTones[tone];
  return (
    <View accessibilityRole="summary" className="flex-row items-center gap-4 rounded-[22px] p-4" style={{ backgroundColor: t.bg, borderWidth: 2, borderColor: t.border }}>
      <View className="h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: t.badge }}>
        {icon}
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-display text-[19px] text-ink">{title}</Text>
        <Text className="font-body text-[14px] leading-[20px] text-ink-700">{body}</Text>
      </View>
    </View>
  );
}
