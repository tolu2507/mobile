import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Banner, Body, Caption, Display, GameButton, PressableScale, TextField } from '@/components/ui';
import { Keypad } from '@/features/tuckshop/Keypad';
import { newRequestId, useCharge } from '@/features/tuckshop/api';
import { friendlyError } from '@/lib/api';
import { initials, naira } from '@/lib/format';
import { palette, roles } from '@/theme';
import type { ShopReceipt } from '@/types/api';

const theme = roles.tuckshop;
const MIN_NAIRA = 50;
const MAX_NAIRA = 20_000;
const QUICK = [100, 200, 500, 1000];
const PIN_LENGTH = 4;

type Step = 'amount' | 'pin' | 'done';

/**
 * One sale: staff type the price, hand the phone to the child, the child types their PIN.
 * The child never sees the staff screens, and staff never see the balance until the PIN is right.
 */
export default function Sell() {
  const p = useLocalSearchParams<{ id: string; firstName: string; lastName: string; className: string; hasPin: string }>();
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState<ShopReceipt | null>(null);
  // One id per sale: if the reply is lost and we send again, the server knows it's the same sale.
  const [requestId] = useState(newRequestId);

  const nairaAmount = Number(amount || '0');
  const amountError = amount && nairaAmount < MIN_NAIRA ? `The smallest sale is ₦${MIN_NAIRA}.` : nairaAmount > MAX_NAIRA ? `The largest sale is ₦${MAX_NAIRA.toLocaleString('en-NG')}.` : undefined;

  if (p.hasPin === '0') {
    return (
      <Shell>
        <Header firstName={p.firstName} lastName={p.lastName} className={p.className} onClose={() => router.back()} />
        <Banner tone="error" title={`${p.firstName} doesn’t have a PIN yet`} message="A parent can set one in the Nexus app (Wallet → Change PIN), or the school office can print a new one." />
        <GameButton label="Back to the counter" variant="outline" onPress={() => router.back()} />
      </Shell>
    );
  }

  if (step === 'done' && receipt) return <Done receipt={receipt} firstName={p.firstName} />;

  if (step === 'pin') {
    return (
      <PinStep
        firstName={p.firstName}
        lastName={p.lastName}
        amountNaira={nairaAmount}
        note={note.trim()}
        studentId={p.id}
        requestId={requestId}
        onPaid={(r) => {
          setReceipt(r);
          setStep('done');
        }}
        onCancel={() => setStep('amount')}
      />
    );
  }

  return (
    <Shell>
      <Header firstName={p.firstName} lastName={p.lastName} className={p.className} onClose={() => router.back()} />
      <View style={{ alignItems: 'center', gap: 2, paddingVertical: 4 }}>
        <Caption>Amount</Caption>
        <Text accessibilityLabel={`${nairaAmount} naira`} className="font-display text-[52px] leading-[60px]" style={{ color: amount ? palette.ink.DEFAULT : palette.ink[300] }}>
          ₦{nairaAmount.toLocaleString('en-NG')}
        </Text>
        {amountError ? <Text className="font-body-semibold text-[13px] text-coral-700">{amountError}</Text> : null}
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {QUICK.map((q) => (
          <PressableScale
            key={q}
            accessibilityLabel={`${q} naira`}
            onPress={() => setAmount(String(q))}
            style={{ flex: 1, minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.accentSoft }}
          >
            <Text className="font-body-extrabold text-[15px]" style={{ color: theme.shadow }}>
              ₦{q.toLocaleString('en-NG')}
            </Text>
          </PressableScale>
        ))}
      </View>
      <Keypad
        extra="00"
        onKey={(k) => setAmount((a) => (k === 'back' ? a.slice(0, -1) : `${a}${k}`.replace(/^0+/, '').slice(0, 6)))}
      />
      <TextField label="What are they buying? (optional)" placeholder={['Jollof rice', 'Meat pie and juice', 'Exercise book']} value={note} onChangeText={setNote} maxLength={60} accent={theme.accent} />
      <GameButton
        label="Next: child types PIN"
        color={theme.accent}
        shadowColor={theme.shadow}
        disabled={!amount || !!amountError}
        onPress={() => setStep('pin')}
        icon={<Ionicons name="phone-portrait-outline" size={20} color={palette.white} />}
      />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 16, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 32 }}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Header({ firstName, lastName, className, onClose }: { firstName: string; lastName: string; className: string; onClose: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Avatar initials={initials(firstName, lastName)} size={48} radius={16} />
      <View style={{ flex: 1 }}>
        <Text className="font-display-bold text-[20px] text-ink" numberOfLines={1}>
          {firstName} {lastName}
        </Text>
        {className ? <Caption>{className}</Caption> : null}
      </View>
      <PressableScale accessibilityLabel="Cancel sale" onPress={onClose} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="close" size={22} color={palette.ink.DEFAULT} />
      </PressableScale>
    </View>
  );
}

/** The child's turn: a dark, simple screen with only their name, the price and the PIN pad. */
function PinStep({ firstName, lastName, amountNaira, note, studentId, requestId, onPaid, onCancel }: {
  firstName: string; lastName: string; amountNaira: number; note: string; studentId: string; requestId: string; onPaid: (r: ShopReceipt) => void; onCancel: () => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<{ message: string; final: boolean } | null>(null);
  const charge = useCharge();
  const shake = useSharedValue(0);
  const dots = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const submit = (code: string) =>
    charge.mutate(
      { studentId, amountKobo: amountNaira * 100, pin: code, note: note || undefined, requestId },
      {
        onSuccess: (r) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          onPaid(r);
        },
        onError: (e) => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
          shake.set(withSequence(withTiming(-10, { duration: 50 }), withTiming(10, { duration: 50 }), withTiming(-6, { duration: 50 }), withTiming(6, { duration: 50 }), withTiming(0, { duration: 50 })));
          setPin('');
          const message = friendlyError(e);
          // Wrong PIN: try again. Locked, no money, no connection: staff need to step in.
          const wrongPin = isAxiosError(e) && e.response?.status === 400 && /Wrong PIN/.test(message);
          setError({ message, final: !wrongPin });
        },
      },
    );

  const onKey = (k: string | 'back') => {
    if (charge.isPending) return;
    if (error?.final) return;
    setError(null);
    if (k === 'back') return setPin((v) => v.slice(0, -1));
    const next = `${pin}${k}`.slice(0, PIN_LENGTH);
    setPin(next);
    if (next.length === PIN_LENGTH) submit(next);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.ink.DEFAULT }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', gap: 6, paddingTop: 12 }}>
          <Text className="font-body-bold text-[13px] uppercase tracking-wider" style={{ color: '#FFC98A' }}>
            Hand the phone to {firstName}
          </Text>
          <Text className="font-display text-[28px] text-white text-center">Hi {firstName}! Type your PIN</Text>
          <Text className="font-body text-[16px] text-center" style={{ color: palette.ink[200] }}>
            to pay <Text className="font-body-extrabold text-white">₦{amountNaira.toLocaleString('en-NG')}</Text>
            {note ? ` for ${note}` : ''}
          </Text>
        </View>

        <View style={{ alignItems: 'center', gap: 14 }}>
          <Animated.View style={dots}>
            <View style={{ flexDirection: 'row', gap: 18 }} accessibilityLabel={`${pin.length} of ${PIN_LENGTH} digits entered`}>
              {Array.from({ length: PIN_LENGTH }, (_, i) => (
                <View key={i} style={{ width: 22, height: 22, borderRadius: 999, borderWidth: 2, borderColor: error ? palette.coral[400] : palette.white, backgroundColor: i < pin.length ? palette.white : 'transparent' }} />
              ))}
            </View>
          </Animated.View>
          <View style={{ minHeight: 44, justifyContent: 'center' }}>
            {charge.isPending ? (
              <Text className="font-body-bold text-[15px]" style={{ color: palette.ink[200] }}>Paying…</Text>
            ) : error ? (
              <Text accessibilityLiveRegion="polite" className="font-body-bold text-[15px] text-center" style={{ color: '#FFB3A0' }}>
                {error.message}
              </Text>
            ) : null}
          </View>
        </View>

        {error?.final ? (
          <View style={{ gap: 12 }}>
            {isRetryable(charge.error) ? (
              <GameButton label="Try again" color={theme.accent} shadowColor={theme.shadow} onPress={() => setError(null)} />
            ) : null}
            <GameButton label="Change the amount" variant="white" color={palette.ink.DEFAULT} onPress={onCancel} />
            <GameButton label="Cancel sale" variant="outline" onPress={() => router.back()} />
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <Keypad tone="dark" onKey={onKey} disabled={charge.isPending} />
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                Alert.alert('Cancel this sale?', `${firstName} won’t be charged.`, [
                  { text: 'Keep going', style: 'cancel' },
                  { text: 'Change amount', onPress: onCancel },
                  { text: 'Cancel sale', style: 'destructive', onPress: () => router.back() },
                ])
              }
              style={{ alignSelf: 'center', padding: 10 }}
            >
              <Text className="font-body-bold text-[14px]" style={{ color: palette.ink[300] }}>
                Staff: cancel
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

/** No reply from the server (bad Wi-Fi): the same PIN can be sent again safely, thanks to the request id. */
function isRetryable(error: unknown) {
  return isAxiosError(error) && !error.response;
}

function Done({ receipt, firstName }: { receipt: ShopReceipt; firstName: string }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.mint[600] }}>
      <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 24, justifyContent: 'space-between' }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Animated.View entering={ZoomIn.springify().damping(12)}>
            <View style={{ width: 96, height: 96, borderRadius: 999, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="checkmark" size={60} color={palette.mint[600]} />
            </View>
          </Animated.View>
          <Display className="mt-2 text-center text-[34px] leading-[40px]" style={{ color: palette.white }}>Paid {naira(receipt.amountKobo)}</Display>
          {receipt.note ? <Body className="text-center text-[17px]" style={{ color: palette.white }}>{receipt.note}</Body> : null}
          <Body className="text-center text-[16px]" style={{ color: palette.mint[50] }}>
            {firstName} has {naira(receipt.balanceKobo)} left. Please hand the phone back.
          </Body>
        </View>
        <GameButton label="Next child" variant="white" color={palette.mint[700]} size="xl" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}
