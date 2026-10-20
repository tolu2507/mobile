import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Pulse } from '@/components/game';
import { PressableScale } from '@/components/ui';
import { palette, type RoleTheme } from '@/theme';
import type { StudentHome } from '@/types/api';
import { useBadges } from '../api';
import { CoinBar } from './CoinBar';
import { RARITY, StickerFace, nextUp } from './Sticker';

/** Top of the home screen: coins towards the family's next ₦1,000, the closest sticker, and (free plan) today's questions. */
export function HomeRewards({ home, theme, primary }: { home: StudentHome; theme: RoleTheme; primary: boolean }) {
  const badges = useBadges();
  const next = nextUp(badges.data);
  const collected = badges.data?.filter((b) => b.earned).length ?? 0;
  const { limit, left } = home.practice;

  return (
    <View className="gap-3">
      {home.coins ? <CoinBar coins={home.coins} /> : null}

      {next ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Next sticker: ${next.name}. ${next.progress!.current} of ${next.progress!.target}. Open my stickers`}
          onPress={() => router.push(primary ? '/student/wallet' : '/student/stickers')}
          style={{ backgroundColor: '#FFFFFF', borderRadius: 22, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}
        >
          <Pulse scale={1.06}>
            <StickerFace icon={next.icon} rarity={next.rarity} earned={false} size={52} />
          </Pulse>
          <View className="flex-1 gap-1">
            <Text className="font-body-bold text-[15px] text-ink">Next sticker: {next.name}</Text>
            <View style={{ height: 8, borderRadius: 8, backgroundColor: palette.ink[100], overflow: 'hidden' }}>
              <View style={{ width: `${Math.max(5, (next.progress!.current / next.progress!.target!) * 100)}%`, height: 8, borderRadius: 8, backgroundColor: RARITY[next.rarity].face }} />
            </View>
            <Text className="font-body text-[12px] text-ink-500">
              {(next.progress!.target! - next.progress!.current).toLocaleString()} to go · {collected} collected
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={palette.ink[300]} />
        </PressableScale>
      ) : null}

      {limit != null ? (
        <View className="flex-row items-center gap-2.5 rounded-[18px] bg-white p-3.5">
          <Ionicons name={left ? 'flash' : 'moon'} size={20} color={left ? theme.accent : palette.ink[500]} />
          <Text className="flex-1 font-body-semibold text-[14px] text-ink">
            {left ? `${left} of your ${limit} questions left today` : `You’ve done today’s ${limit} questions. More tomorrow!`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
