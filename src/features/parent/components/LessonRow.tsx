import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { toast } from '@/components/reacticx/molecules/Toast';
import { GameButton, Pill, TextField } from '@/components/ui';
import { usePayment } from '@/features/payments';
import { friendlyError } from '@/lib/api';
import { naira } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { roles } from '@/theme';
import type { LessonSession } from '@/types/api';
import { startSessionPayment, useSessionAction } from '../api';

const theme = roles.parent;
const when = (iso: string) => new Date(iso).toLocaleString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** One lesson, with whatever the parent can do next: pay, confirm it happened, or report a problem. */
export function LessonRow({ session }: { session: LessonSession }) {
  const pay = usePayment(startSessionPayment(session.id), [['parent', 'bookings']]);
  const action = useSessionAction();
  const [disputing, setDisputing] = useState(false);
  const [reason, setReason] = useState('');
  const now = useNow();
  const started = new Date(session.scheduledAt).getTime() < now;

  const payNow = () =>
    pay.mutate(undefined, {
      onSuccess: (status) => {
        if (status === 'SUCCESS') toast.success('Paid. We hold it safely until the lesson happens.');
        else if (status === 'PENDING') toast.info('Your bank is still processing. We’ll update this when it clears.');
        else if (status === 'FAILED') toast.error('The payment didn’t go through. No money was taken.');
      },
      onError: (e) => toast.error(friendlyError(e)),
    });

  const confirm = () =>
    Alert.alert('Did this lesson happen?', 'Confirming pays the teacher now.', [
      { text: 'Not yet', style: 'cancel' },
      { text: 'Yes, it happened', onPress: () => action.mutate({ sessionId: session.id, action: 'confirm' }, { onSuccess: () => toast.success('Thanks! The teacher has been paid.'), onError: (e) => toast.error(friendlyError(e)) }) },
    ]);

  const status = (() => {
    switch (session.escrowStatus) {
      case 'FREE': return <Pill label="Free trial" tone="mint" />;
      case 'UNPAID': return <Pill label="Not paid" tone="amber" />;
      case 'HELD': return <Pill label="Paid · held safely" tone="sky" />;
      case 'RELEASED': return <Pill label="Teacher paid" tone="mint" />;
      case 'DISPUTED': return <Pill label="Under review" tone="coral" />;
      case 'REFUNDED': return <Pill label="Refunded" tone="violet" />;
    }
  })();

  return (
    <View className="gap-2.5 rounded-2xl bg-white p-3.5" style={{ borderWidth: 1, borderColor: '#E3EFEB' }}>
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 font-body-bold text-[15px] text-ink">{when(session.scheduledAt)}</Text>
        {status}
      </View>
      <Text className="font-body text-[13px] text-ink-500">
        {session.durationMinutes} min
        {session.status === 'COMPLETED' ? ` · covered ${session.topicsCovered?.join(', ')}` : ''}
        {session.quiz ? ` · quiz ${session.quiz.status === 'COMPLETED' ? `${Math.round((session.quiz.score ?? 0) * 100)}%` : 'waiting for your child'}` : ''}
      </Text>

      {session.escrowStatus === 'UNPAID' ? (
        <GameButton label={`Pay ${naira(session.totalKobo ?? '0')}`} size="md" color={theme.accent} shadowColor={theme.shadow} loading={pay.isPending} onPress={payNow} />
      ) : null}

      {session.escrowStatus === 'HELD' && started && !disputing ? (
        <View className="flex-row gap-2">
          <View className="flex-[3]"><GameButton label="It happened" size="md" color={theme.accent} shadowColor={theme.shadow} loading={action.isPending && action.variables?.action === 'confirm'} onPress={confirm} /></View>
          <View className="flex-[2]"><GameButton label="Problem" size="md" variant="danger" onPress={() => setDisputing(true)} /></View>
        </View>
      ) : null}

      {disputing ? (
        <View className="gap-2">
          <TextField label="What went wrong?" value={reason} onChangeText={setReason} multiline accent={theme.accent} hint="We hold the payment while the Nexus team looks into it." />
          <View className="flex-row gap-2">
            <View className="flex-1"><GameButton label="Cancel" size="md" variant="outline" onPress={() => setDisputing(false)} /></View>
            <View className="flex-1">
              <GameButton
                label="Send"
                size="md"
                variant="danger"
                disabled={reason.trim().length < 5}
                loading={action.isPending && action.variables?.action === 'dispute'}
                onPress={() => action.mutate({ sessionId: session.id, action: 'dispute', reason: reason.trim() }, { onSuccess: () => { setDisputing(false); toast.success('Reported. We’ll contact you within 24 hours.'); }, onError: (e) => toast.error(friendlyError(e)) })}
              />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}
