import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormTextField } from '@/components/form';
import { Banner, FormScreen, GameButton, ScreenHeader } from '@/components/ui';
import { /* useForgotPassword, */ useResetPassword } from '@/features/auth/api';
import { friendlyError } from '@/lib/api';
import { email, password } from '@/lib/validation';
import { palette } from '@/theme';

// TEMP (until Resend is connected): reset straight away with email + new password, no emailed code.
// The old code flow is commented out below — restore it once email works.
const schema = z.object({
  identifier: email('Enter the email on your account.'),
  password: password(),
});

export default function ForgotPassword() {
  const reset = useResetPassword();
  const { control, handleSubmit } = useForm({ resolver: zodResolver(schema), defaultValues: { identifier: '', password: '' } });
  const submit = handleSubmit((v) => reset.mutate(v, { onSuccess: () => router.replace('/') }));

  // --- Code flow: re-enable once Resend is connected ---
  // const forgot = useForgotPassword();
  // const submit = handleSubmit(({ identifier }) =>
  //   forgot.mutate(identifier, { onSuccess: () => router.push({ pathname: '/reset-password', params: { identifier } }) }),
  // );

  return (
    <FormScreen background={palette.paper} footer={<GameButton label="Save password and sign in" loading={reset.isPending} onPress={submit} />}>
      <ScreenHeader title="Reset your password" subtitle="Enter the email on your account and choose a new password. Students: ask a parent to reset your PIN." />
      <FormTextField
        control={control}
        name="identifier"
        label="Email"
        placeholder={['ada@example.com']}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="username"
        returnKeyType="next"
      />
      <FormTextField control={control} name="password" label="New password" secure autoComplete="new-password" hint="At least 8 characters." returnKeyType="go" onSubmitEditing={submit} />
      {reset.isError ? <Banner tone="error" message={friendlyError(reset.error)} /> : null}
    </FormScreen>
  );
}
