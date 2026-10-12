import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { FormTextField } from '@/components/form';
import { OtpInput } from '@/components/reacticx/base/otp-input';
import { toast } from '@/components/reacticx/molecules/Toast';
import { Banner, Body, FormScreen, GameButton, ScreenHeader } from '@/components/ui';
import { useForgotPassword, useResetPassword } from '@/features/auth/api';
import { friendlyError } from '@/lib/api';
import { password, required } from '@/lib/validation';
import { fonts, palette } from '@/theme';

const schema = z.object({
  identifier: required('Enter the email or phone number your invite was sent to.').toLowerCase(),
  code: z.string().length(6, 'Enter all 6 digits.'),
  password: password(),
});

export default function ResetPassword() {
  // Opened from "Forgot password" (identifier known) or from "Got a code?" for invited parents and staff.
  const params = useLocalSearchParams<{ identifier?: string; mode?: string }>();
  const invite = params.mode === 'invite';
  const reset = useResetPassword();
  const resend = useForgotPassword();
  const { control, handleSubmit } = useForm({ resolver: zodResolver(schema), defaultValues: { identifier: params.identifier ?? '', code: '', password: '' } });
  const identifier = useWatch({ control, name: 'identifier' });
  const submit = handleSubmit((v) => reset.mutate(v, { onSuccess: () => router.replace('/') }));

  return (
    <FormScreen background={palette.paper} footer={<GameButton label={invite ? 'Set password and sign in' : 'Save new password'} loading={reset.isPending} onPress={submit} />}>
      <ScreenHeader
        title={invite ? 'Set your password' : 'Enter your code'}
        subtitle={invite ? 'Your school sent you a 6-digit code by email or WhatsApp. It’s valid for 7 days.' : `If ${identifier} has a Nexus account, a 6-digit code is on its way. It expires in 30 minutes.`}
      />
      {invite ? (
        <FormTextField control={control} name="identifier" label="Email or phone number" placeholder={['ada@example.com', '0803 000 0000']} autoCapitalize="none" keyboardType="email-address" autoComplete="username" />
      ) : null}
      <View className="gap-2">
        <Text className="font-body-bold text-[14px] text-ink">6-digit code</Text>
        <Controller
          control={control}
          name="code"
          render={({ field, fieldState }) => (
            <OtpInput
              otpCount={6}
              inputWidth={46}
              inputHeight={58}
              inputBorderRadius={14}
              focusedBorderColor={palette.violet[500]}
              unfocusedBorderColor={palette.ink[200]}
              focusedBackgroundColor="#FFFFFF"
              unfocusedBackgroundColor="#FFFFFF"
              textStyle={{ fontFamily: fonts.display, fontSize: 22, color: palette.ink.DEFAULT }}
              error={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              onInputChange={field.onChange}
              onInputFinished={field.onChange}
            />
          )}
        />
      </View>
      <FormTextField control={control} name="password" label={invite ? 'Choose a password' : 'New password'} secure autoComplete="new-password" hint="At least 8 characters." returnKeyType="go" onSubmitEditing={submit} />
      {reset.isError ? <Banner tone="error" message={friendlyError(reset.error)} /> : null}
      <Body
        accessibilityRole="button"
        onPress={() => (identifier.trim() ? resend.mutate(identifier.trim().toLowerCase(), { onSuccess: () => toast.success('New code sent') }) : toast.error('Enter your email or phone number first.'))}
        className="py-2 text-center font-body-bold text-violet-700"
      >
        {resend.isPending ? 'Sending…' : 'Send a new code'}
      </Body>
    </FormScreen>
  );
}
