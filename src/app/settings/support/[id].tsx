import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { toast } from '@/components/reacticx/molecules/Toast';
import { Banner, Caption, CardListSkeleton, ErrorState, GameButton, Pill, Screen, ScreenHeader, TextField } from '@/components/ui';
import { useReplyToTicket, useTicket } from '@/features/support/api';
import { friendlyError } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { palette } from '@/theme';

export default function SupportConversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTicket(id);
  const reply = useReplyToTicket(id);
  const [body, setBody] = useState('');
  const send = () => {
    const text = body.trim();
    if (!text) return;
    reply.mutate(text, {
      onSuccess: () => {
        setBody('');
        toast.success('Sent');
      },
    });
  };

  return (
    <Screen background={palette.paper} edges={['top', 'bottom']} refreshing={t.isRefetching} onRefresh={t.refetch}>
      <ScreenHeader title={t.data?.subject ?? 'Your question'} subtitle={t.data?.child ? `About ${t.data.child}` : undefined} />
      {t.isPending ? (
        <CardListSkeleton count={3} height={64} />
      ) : t.isError ? (
        <ErrorState error={t.error} onRetry={t.refetch} />
      ) : (
        <>
          {t.data.status === 'RESOLVED' ? <Pill tone="mint" label="Resolved. Reply if you still need help." icon={<Ionicons name="checkmark-circle" size={14} color={palette.mint[700]} />} /> : null}
          <View className="gap-2">
            {t.data.messages.map((msg, i) => (
              <Animated.View key={msg.id} entering={FadeInDown.delay(i * 40).duration(250)} style={{ alignSelf: msg.fromStaff ? 'flex-start' : 'flex-end', maxWidth: '88%' }}>
                <View style={{ backgroundColor: msg.fromStaff ? '#FFFFFF' : palette.violet[100], borderRadius: 18, padding: 12 }}>
                  <Text className="mb-1 font-body-bold text-[13px] text-ink-500">{msg.fromStaff ? msg.author : 'You'}</Text>
                  <Text className="font-body text-[15px] leading-[22px] text-ink">{msg.body}</Text>
                </View>
                <Caption className={msg.fromStaff ? '' : 'text-right'}>{timeAgo(msg.createdAt)}</Caption>
              </Animated.View>
            ))}
          </View>
          {t.data.status === 'OPEN' && !t.data.messages[t.data.messages.length - 1]?.fromStaff ? <Caption>We’ve got your message and will reply here. You’ll get a notification.</Caption> : null}
          <TextField label="Add a message" value={body} onChangeText={setBody} multiline numberOfLines={4} placeholder="Type your reply" />
          {reply.isError ? <Banner tone="error" message={friendlyError(reply.error)} /> : null}
          <GameButton label="Send" loading={reply.isPending} disabled={!body.trim()} icon={<Ionicons name="send" size={18} color="#FFFFFF" />} onPress={send} />
        </>
      )}
    </Screen>
  );
}
