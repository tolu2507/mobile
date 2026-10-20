import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { toast } from '@/components/reacticx/molecules/Toast';
import { Caption, Card, GameButton, Label, Pill, ProgressBar, TextField, Title } from '@/components/ui';
import { startFeePayment, useChildInvoices } from '@/features/parent/api';
import { usePayment } from '@/features/payments';
import { friendlyError } from '@/lib/api';
import { naira } from '@/lib/format';
import { palette, roles } from '@/theme';
import type { FeeInvoice } from '@/types/api';

const theme = roles.parent;
const STATUS = { UNPAID: { label: 'Not paid', tone: 'coral' }, PART_PAID: { label: 'Part paid', tone: 'sun' }, PAID: { label: 'Paid', tone: 'mint' } } as const;

/** School fee bills for one child. Hidden entirely for children who aren't in a BrainBox school. */
export function SchoolFees({ studentId, childName }: { studentId: string; childName: string }) {
  const invoices = useChildInvoices(studentId);
  if (!invoices.data?.length) return null;
  return (
    <View className="gap-3">
      <Title>School fees</Title>
      {invoices.data.map((inv, i) => (
        <Animated.View key={inv.id} entering={FadeInDown.delay(60 * i)}>
          <Invoice invoice={inv} studentId={studentId} childName={childName} />
        </Animated.View>
      ))}
    </View>
  );
}

function Invoice({ invoice, studentId, childName }: { invoice: FeeInvoice; studentId: string; childName: string }) {
  const total = Number(invoice.totalKobo);
  const paid = Number(invoice.paidKobo);
  const owed = total - paid;
  const [open, setOpen] = useState(invoice.status !== 'PAID');
  const [partial, setPartial] = useState(false);
  const [naira_, setNaira] = useState('');
  const [error, setError] = useState<string>();
  const partKobo = Math.round(Number(naira_.replace(/[^0-9]/g, '')) * 100);
  const amount = partial ? partKobo : owed;
  const pay = usePayment(startFeePayment(invoice.id, partial ? partKobo : undefined), [['parent', 'invoices', studentId]]);
  const due = new Date(invoice.dueDate);
  const overdue = invoice.status !== 'PAID' && due < new Date();

  const submit = () => {
    if (partial && (partKobo < 100_000 || partKobo > owed)) return setError(`Enter between ₦1,000 and ${naira(owed)}.`);
    setError(undefined);
    pay.mutate(undefined, {
      onSuccess: (status) => {
        if (status === 'SUCCESS') toast.success(`${naira(amount)} paid to ${invoice.schoolName}`);
        else if (status === 'PENDING') toast.info('Your bank is still processing. The bill updates when it clears.');
        else if (status === 'FAILED') toast.error('The payment didn’t go through. No money was taken.');
      },
      onError: (e) => toast.error(friendlyError(e)),
    });
  };

  return (
    <Card className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <Label>{invoice.schoolName}</Label>
          <Caption>{invoice.term} · {childName}</Caption>
        </View>
        <Pill label={STATUS[invoice.status].label} tone={STATUS[invoice.status].tone} />
      </View>

      <View className="gap-2">
        <View className="flex-row items-baseline justify-between">
          <Text className="font-display text-[26px] text-ink">{naira(owed > 0 ? owed : total)}</Text>
          <Caption>{owed > 0 ? `owed of ${naira(total)}` : 'paid in full'}</Caption>
        </View>
        <ProgressBar value={total ? paid / total : 0} color={theme.accent} track={palette.ink[100]} accessibilityLabel={`${Math.round((paid / total) * 100)}% paid`} />
        {invoice.status !== 'PAID' ? (
          <Caption className={overdue ? 'text-coral-700' : undefined}>
            {overdue ? 'Was due' : 'Due'} {due.toLocaleDateString('en-NG', { day: 'numeric', month: 'long' })}
          </Caption>
        ) : null}
      </View>

      <Text accessibilityRole="button" onPress={() => setOpen((o) => !o)} className="font-body-bold text-[14px] text-mint-700">
        {open ? 'Hide breakdown' : 'See breakdown'}
      </Text>
      {open ? (
        <View className="gap-1.5 rounded-2xl bg-paper p-3">
          {invoice.items.map((it) => (
            <View key={it.label} className="flex-row justify-between">
              <Text className="font-body text-[14px] text-ink-700">{it.label}</Text>
              <Text className="font-body-bold text-[14px] text-ink">{naira(Number(it.amountKobo))}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {owed > 0 ? (
        <>
          {partial ? (
            <TextField label="Amount to pay (₦)" value={naira_} onChangeText={setNaira} keyboardType="number-pad" placeholder={['50000', '100000']} accent={theme.accent} error={error} hint={`Up to ${naira(owed)}`} />
          ) : null}
          <GameButton
            label={partial ? (partKobo >= 100_000 ? `Pay ${naira(partKobo)}` : 'Pay part') : `Pay ${naira(owed)}`}
            color={theme.accent}
            shadowColor={theme.shadow}
            loading={pay.isPending}
            onPress={submit}
            icon={<Ionicons name="lock-closed" size={16} color="#FFFFFF" />}
          />
          <Text
            accessibilityRole="button"
            onPress={() => {
              setPartial((p) => !p);
              setError(undefined);
            }}
            className="text-center font-body-bold text-[14px] text-mint-700"
          >
            {partial ? 'Pay the full balance instead' : 'Pay part of it now'}
          </Text>
        </>
      ) : null}
    </Card>
  );
}
