import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Caption, CardListSkeleton, ErrorState, PressableScale } from '@/components/ui';
import { palette, type RoleTheme } from '@/theme';
import type { Badge, StickerRarity } from '@/types/api';
import { useBadges, useStudentHome } from '../api';
import { useStickerReplay } from '../stickerReplay';
import { CoinBar } from './CoinBar';
import { Coin, RARITY, RarityPill, StickerFace, StickerProgress } from './Sticker';

const ORDER: StickerRarity[] = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];

/** Every sticker, grouped by rarity: collected ones in colour, the rest greyed out with how close they are. */
export function StickerBook({ theme }: { theme: RoleTheme }) {
  const { data, isPending, isError, error, refetch } = useBadges();
  const home = useStudentHome();
  const coins = !!home.data?.coins;
  if (isPending) return <CardListSkeleton count={3} height={150} />;
  if (isError) return <ErrorState error={error} onRetry={refetch} color={theme.accent} />;
  const earned = data.filter((b) => b.earned).length;

  return (
    <View className="gap-5">
      <Caption className="text-[15px]">
        {earned} of {data.length} collected.{earned < data.length ? ' Harder stickers are rarer and worth more!' : ' You’ve collected them all!'}
      </Caption>
      {home.data?.coins ? <CoinBar coins={home.data.coins} /> : null}
      {ORDER.map((rarity) => {
        const group = data.filter((b) => b.rarity === rarity);
        if (!group.length) return null;
        return (
          <View key={rarity} className="gap-3">
            <View className="flex-row items-center justify-between">
              <RarityPill rarity={rarity} />
              <Text className="font-body-bold text-[13px] text-ink-500">
                {group.filter((b) => b.earned).length} / {group.length}
                {coins ? ` · ${group[0].coins.toLocaleString()} coins each` : ''}
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-3">
              {group.map((b, i) => (
                <StickerTile key={b.id} b={b} i={i} coins={coins} />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Collected stickers can be tapped to watch their unlock again, with their perks. */
function StickerTile({ b, i, coins }: { b: Badge; i: number; coins: boolean }) {
  const r = RARITY[b.rarity];
  const replay = useStickerReplay((s) => s.replay);
  return (
    <Animated.View entering={ZoomIn.delay(Math.min(i, 8) * 40).springify()} style={{ width: '31%' }}>
      <PressableScale
        disabled={!b.earned}
        onPress={() => replay(b)}
        accessibilityRole={b.earned ? 'button' : undefined}
        accessibilityLabel={`${b.name}, ${r.label}. ${b.description}.${b.earned ? ' Collected. Tap to watch it again.' : b.progress?.target ? ` ${b.progress.current} of ${b.progress.target}.` : ' Not collected yet.'}`}
        style={{
          width: '100%',
          minHeight: 168,
          borderRadius: 22,
          backgroundColor: palette.white,
          alignItems: 'center',
          gap: 6,
          paddingVertical: 12,
          paddingHorizontal: 6,
          borderWidth: b.earned ? 2 : 0,
          borderColor: b.earned ? r.ring : 'transparent',
        }}
      >
        <StickerFace icon={b.icon} rarity={b.rarity} earned={b.earned} size={58} />
        <Text numberOfLines={2} className="text-center font-body-bold text-[13px] leading-[17px] text-ink">
          {b.name}
        </Text>
        <Text numberOfLines={3} className="text-center font-body text-[11px] leading-[14px] text-ink-500">
          {b.description}
        </Text>
        <View className="mt-auto w-full items-center gap-1">
          {b.earned ? (
            <>
              <Text className="font-body-semibold text-[11px]" style={{ color: r.text }}>
                Collected {b.awardedAt ? new Date(b.awardedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : ''}
              </Text>
              <View className="flex-row items-center gap-1">
                <Ionicons name="play-circle" size={13} color={r.face} />
                <Text className="font-body-bold text-[11px]" style={{ color: r.face }}>
                  Replay
                </Text>
              </View>
            </>
          ) : (
            <StickerProgress b={b} color={r.face} />
          )}
          {coins && !b.earned ? (
            <View className="flex-row items-center gap-1">
              <Coin size={12} />
              <Text className="font-body-bold text-[11px] text-sun-800">+{b.coins.toLocaleString()}</Text>
            </View>
          ) : null}
        </View>
      </PressableScale>
    </Animated.View>
  );
}
