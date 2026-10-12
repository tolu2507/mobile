import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CardListSkeleton, Skeleton } from '@/components/ui';

export function HomeSkeleton({ background }: { background: string }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background }}>
      <View accessibilityLabel="Loading your home" className="gap-5 p-5">
        <View className="flex-row items-center gap-3">
          <Skeleton width={48} height={48} radius={16} />
          <View className="flex-1 gap-2">
            <Skeleton width={90} height={12} />
            <Skeleton width={140} height={18} />
          </View>
        </View>
        <Skeleton height={110} radius={22} />
        <Skeleton height={76} radius={22} />
        <CardListSkeleton count={3} />
      </View>
    </SafeAreaView>
  );
}
