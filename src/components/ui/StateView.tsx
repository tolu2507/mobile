import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { friendlyError } from '@/lib/api';
import { palette } from '@/theme';
import { GameButton } from './GameButton';
import { Body, Title } from './Text';

/** Every screen that loads data shows this when it fails — never a blank page. */
export function ErrorState({ error, onRetry, color }: { error: unknown; onRetry: () => void; color?: string }) {
  return (
    <View className="items-center gap-3 px-6 py-10">
      <View className="h-16 w-16 items-center justify-center rounded-3xl bg-coral-100">
        <Ionicons name="cloud-offline-outline" size={30} color={palette.coral[700]} />
      </View>
      <Title className="text-center">That didn’t load</Title>
      <Body className="text-center text-ink-500">{friendlyError(error)}</Body>
      <GameButton label="Try again" onPress={onRetry} size="md" variant="accent" color={color} className="mt-2 self-stretch" />
    </View>
  );
}

/** Friendly empty state with a next step. */
export function EmptyState({
  icon = 'sparkles-outline',
  title,
  message,
  action,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="items-center gap-3 px-6 py-10">
      <View className="h-16 w-16 items-center justify-center rounded-3xl bg-violet-100">
        <Ionicons name={icon} size={30} color={palette.violet[700]} />
      </View>
      <Title className="text-center">{title}</Title>
      <Body className="text-center text-ink-500">{message}</Body>
      {action}
    </View>
  );
}
