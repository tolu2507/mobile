import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { OtpInput } from '@/components/reacticx/base/otp-input';
import { toast } from '@/components/reacticx/molecules/Toast';
import { Avatar, Banner, Caption, Card, CardListSkeleton, EmptyState, GameButton, Label, Screen, ScreenHeader, Title } from '@/components/ui';
import { ExamList } from '@/features/exams/components/ExamList';
import { useChangePin, useChildren } from '@/features/parent/api';
import { ChildProgress } from '@/features/parent/components/ChildProgress';
import { friendlyError } from '@/lib/api';
import { initials } from '@/lib/format';
import { fonts, palette, roles } from '@/theme';

const theme = roles.parent;

export default function ChildDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const children = useChildren();
  const child = children.data?.find((c) => c.id === id);
  const changePin = useChangePin(id);
  const [pin, setPin] = useState('');
  const [key, setKey] = useState(0); // remounts the PIN boxes after saving

  if (children.isPending) return <Screen background={theme.bg}><CardListSkeleton count={2} height={120} /></Screen>;
  if (!child) return <Screen background={theme.bg}><ScreenHeader title="Child" /><EmptyState title="Not found" message="This child isn’t on your account." /></Screen>;

  return (
    <Screen background={theme.bg} edges={['top', 'bottom']}>
      <ScreenHeader title={`${child.firstName} ${child.lastName}`} />
      <Card className="flex-row items-center gap-3">
        <Avatar initials={initials(child.firstName, child.lastName)} size={56} radius={18} />
        <View className="flex-1 gap-0.5">
          <Label>{child.className}</Label>
          <Caption>{child.schoolName ?? 'Learning independently'}</Caption>
        </View>
      </Card>

      <ChildProgress studentId={child.id} name={child.firstName} theme={theme} />

      <View className="gap-3">
        <Title>Exam prep</Title>
        <ExamList level={child.level} owner={{ studentId: child.id }} theme={theme} onOpen={(exam) => router.push({ pathname: '/parent/children/[id]/exams/[exam]', params: { id: child.id, exam } })} />
      </View>

      <Card className="gap-2">
        <Title>How {child.firstName} signs in</Title>
        <Caption className="text-[14px]">On the Nexus app, tap “I’m a student”, then enter:</Caption>
        <View className="flex-row items-center justify-between rounded-2xl bg-mint-50 p-3.5">
          <Text className="font-body text-[14px] text-ink-700">Username</Text>
          <Text selectable className="font-display text-[20px] text-ink">{child.username}</Text>
        </View>
      </Card>

      <Card className="gap-3">
        <Title>Reset PIN</Title>
        <Caption className="text-[14px]">Signs {child.firstName} out of other devices.</Caption>
        <OtpInput
          key={key}
          otpCount={4}
          inputWidth={60}
          inputHeight={62}
          inputBorderRadius={16}
          focusedBorderColor={theme.accent}
          unfocusedBorderColor={palette.ink[200]}
          focusedBackgroundColor="#FFFFFF"
          unfocusedBackgroundColor="#FFFFFF"
          textStyle={{ fontFamily: fonts.display, fontSize: 24, color: palette.ink.DEFAULT }}
          onInputChange={setPin}
          onInputFinished={setPin}
        />
        {changePin.isError ? <Banner tone="error" message={friendlyError(changePin.error)} /> : null}
        <GameButton
          label="Save new PIN"
          color={theme.accent}
          shadowColor={theme.shadow}
          disabled={pin.length !== 4}
          loading={changePin.isPending}
          onPress={() => changePin.mutate(pin, { onSuccess: () => { toast.success(`New PIN saved for ${child.firstName}`); setPin(''); setKey((k) => k + 1); } })}
        />
      </Card>
    </Screen>
  );
}
