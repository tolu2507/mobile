import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormTextField } from '@/components/form';
import { Banner, FormScreen, GameButton, ScreenHeader } from '@/components/ui';
import { useForgotPassword } from '@/features/auth/api';
import { friendlyError } from '@/lib/api';
import { required } from '@/lib/validation';
import { palette } from '@/theme';

const schema = z.object({ identifier: required('Enter your email or phone number.').toLowerCase() });

export default function ForgotPassword() {
  const forgot = useForgotPassword();
  const { control, handleSubmit } = useForm({ resolver: zodResolver(schema), defaultValues: { identifier: '' } });
  const submit = handleSubmit(({ identifier }) =>
    forgot.mutate(identifier, { onSuccess: () => router.push({ pathname: '/reset-password', params: { identifier } }) }),
  );

  return (
    <FormScreen background={palette.paper} footer={<GameButton label="Send me a code" loading={forgot.isPending} onPress={submit} />}>
      <ScreenHeader title="Reset your password" subtitle="We’ll send a 6-digit code to your email or phone. Students: ask a parent to reset your PIN." />
      <FormTextField
        control={control}
        name="identifier"
        label="Email or phone number"
        placeholder={['ada@example.com', '0803 000 0000']}
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="send"
        onSubmitEditing={submit}
      />
      {forgot.isError ? <Banner tone="error" message={friendlyError(forgot.error)} /> : null}
    </FormScreen>
  );
}
