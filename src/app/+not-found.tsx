import { router } from 'expo-router';
import { View } from 'react-native';

import { EmptyState, GameButton, Screen } from '@/components/ui';
import { palette } from '@/theme';

export default function NotFound() {
  return (
    <Screen background={palette.paper} scroll={false}>
      <View className="flex-1 justify-center">
        <EmptyState
          icon="compass-outline"
          title="This page wandered off"
          message="Let's get you back somewhere useful."
          action={<GameButton label="Go home" className="mt-2 self-stretch" onPress={() => router.replace('/')} />}
        />
      </View>
    </Screen>
  );
}
