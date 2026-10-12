import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { View } from 'react-native';

import { Avatar, Caption, CardListSkeleton, EmptyState, ErrorState, GameButton, Label, PressableScale, Screen, ScreenHeader } from '@/components/ui';
import { useChildren } from '@/features/parent/api';
import { initials } from '@/lib/format';
import { palette, roles } from '@/theme';

const theme = roles.parent;

export default function Children() {
  const { data, isPending, isError, error, refetch, isRefetching } = useChildren();
  return (
    <Screen background={theme.bg} edges={['top', 'bottom']} accent={theme.accent} refreshing={isRefetching} onRefresh={refetch}>
      <ScreenHeader title="My children" />
      {isPending ? (
        <CardListSkeleton count={2} height={76} />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} color={theme.accent} />
      ) : data.length === 0 ? (
        <EmptyState icon="people-outline" title="No children yet" message="Add your child to give them their own login." />
      ) : (
        <View className="gap-3">
          {data.map((c) => (
            <PressableScale
              key={c.id}
              accessibilityLabel={`${c.firstName}, ${c.className}`}
              onPress={() => router.push({ pathname: '/parent/children/[id]', params: { id: c.id } })}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 14 }}
            >
              <Avatar initials={initials(c.firstName, c.lastName)} size={48} />
              <View className="flex-1">
                <Label>{c.firstName} {c.lastName}</Label>
                <Caption>{c.className}{c.schoolName ? ` · ${c.schoolName}` : ''} · @{c.username}</Caption>
              </View>
              <Ionicons name="chevron-forward" size={18} color={palette.ink[300]} />
            </PressableScale>
          ))}
        </View>
      )}
      <GameButton label="Add a child" color={theme.accent} shadowColor={theme.shadow} icon={<Ionicons name="add" size={20} color="#FFFFFF" />} onPress={() => router.push('/parent/children/new')} />
    </Screen>
  );
}
