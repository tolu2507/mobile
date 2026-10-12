import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Caption, Label, Pill, PressableScale, ProgressBar, SubjectIcon, toneColors } from '@/components/ui';
import type { Quest } from '@/types/api';

export function QuestCard({ quest, index, onPress }: { quest: Quest; index: number; onPress: () => void }) {
  const done = quest.progress >= 1;
  return (
    <Animated.View entering={FadeInDown.delay(80 * index).springify().damping(16)}>
      <PressableScale
        onPress={onPress}
        accessibilityLabel={`${quest.title}, ${Math.round(quest.progress * 100)}% done, ${quest.xpReward} XP`}
        style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#2A1E7A', shadowOpacity: 0.06, shadowRadius: 0, shadowOffset: { width: 0, height: 2 }, elevation: 1 }}
      >
        <SubjectIcon icon={quest.icon} tone={quest.tone} />
        <View className="flex-1 gap-1.5">
          <Label numberOfLines={1}>{quest.title}</Label>
          {quest.subtitle ? (
            <Caption numberOfLines={1}>{quest.subtitle}</Caption>
          ) : (
            <ProgressBar value={quest.progress} color={toneColors[quest.tone].bar} height={8} />
          )}
        </View>
        <Pill label={done ? 'Done' : `+${quest.xpReward} XP`} tone={done ? 'mint' : 'sun'} />
      </PressableScale>
    </Animated.View>
  );
}
