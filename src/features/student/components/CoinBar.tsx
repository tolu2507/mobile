import { Text, View } from 'react-native';

import { naira } from '@/lib/format';
import { palette } from '@/theme';
import type { StudentHome } from '@/types/api';
import { Coin } from './Sticker';

/** Earn while you learn: how close the child is to the next ₦1,000 for their family. */
export function CoinBar({ coins }: { coins: NonNullable<StudentHome['coins']> }) {
  const pct = Math.min(1, coins.balance / coins.target);
  const earned = Number(coins.earnedKobo);
  return (
    <View
      accessibilityLabel={`${coins.balance} of ${coins.target} coins. At ${coins.target}, your family gets ${naira(coins.rewardKobo)} of airtime or data.`}
      style={{ backgroundColor: '#2B1D00', borderRadius: 22, padding: 16, gap: 10 }}
    >
      <View className="flex-row items-center gap-2.5">
        <Coin size={26} />
        <View className="flex-1">
          <Text className="font-display text-[20px]" style={{ color: palette.sun[400] }}>
            {coins.balance.toLocaleString()} <Text className="font-body-semibold text-[14px]" style={{ color: '#FFE7A3' }}>/ {coins.target.toLocaleString()} coins</Text>
          </Text>
          <Text className="font-body text-[13px]" style={{ color: '#FFE7A3' }}>
            Fill the bar and your family gets {naira(coins.rewardKobo)} of airtime or data!
          </Text>
        </View>
      </View>
      <View style={{ height: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
        <View style={{ width: `${Math.max(pct * 100, pct > 0 ? 3 : 0)}%`, height: 12, borderRadius: 12, backgroundColor: palette.sun[400] }} />
      </View>
      {earned > 0 ? (
        <Text className="font-body-semibold text-[13px]" style={{ color: '#FFE7A3' }}>
          You’ve earned {naira(earned)} for your family so far. Brilliant!
        </Text>
      ) : (
        <Text className="font-body text-[12px]" style={{ color: 'rgba(255,231,163,0.75)' }}>
          {coins.perCorrect} coins for every new question you get right, and more for every sticker.
        </Text>
      )}
    </View>
  );
}
