import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { FormTextField } from '@/components/form';
import { Banner, Body, FormScreen, GameButton, ScreenHeader } from '@/components/ui';
import { useRegister } from '@/features/auth/api';
import { friendlyError } from '@/lib/api';
import { email, optionalPhone, password, required } from '@/lib/validation';
import { roles } from '@/theme';

const theme = roles.parent;

const schema = z.object({
  firstName: required('Enter your first name.'),
  lastName: required('Enter your last name.'),
  email: email('Enter a valid email. Receipts and reports go here.'),
  phone: optionalPhone(),
  password: password(),
});

export default function Signup() {
  const register = useRegister();
  const { control, handleSubmit, setFocus } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', password: '' },
  });
  const submit = handleSubmit(({ phone, ...v }) => register.mutate({ ...v, phone: phone || undefined, role: 'PARENT' }, { onSuccess: () => router.replace('/') }));

  return (
    <FormScreen
      background={theme.bg}
      footer={<GameButton label="Create account" color={theme.accent} shadowColor={theme.shadow} onPress={submit} loading={register.isPending} />}
    >
      <ScreenHeader title="Create your account" subtitle="Add all your children, follow their exam prep and get a progress report every week." />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormTextField control={control} name="firstName" label="First name" autoComplete="given-name" returnKeyType="next" onSubmitEditing={() => setFocus('lastName')} accent={theme.accent} />
        </View>
        <View className="flex-1">
          <FormTextField control={control} name="lastName" label="Last name" autoComplete="family-name" returnKeyType="next" onSubmitEditing={() => setFocus('email')} accent={theme.accent} />
        </View>
      </View>
      <FormTextField control={control} name="email" label="Email" placeholder="ada@example.com" autoCapitalize="none" keyboardType="email-address" autoComplete="email" returnKeyType="next" onSubmitEditing={() => setFocus('phone')} accent={theme.accent} />
      <FormTextField control={control} name="phone" label="Phone (optional)" placeholder="0803 000 0000" keyboardType="phone-pad" autoComplete="tel" returnKeyType="next" onSubmitEditing={() => setFocus('password')} accent={theme.accent} />
      <FormTextField control={control} name="password" label="Password" secure autoComplete="new-password" textContentType="newPassword" hint="At least 8 characters." returnKeyType="go" onSubmitEditing={submit} accent={theme.accent} />
      {register.isError ? <Banner tone="error" message={friendlyError(register.error)} /> : null}
      <Body className="text-center text-[13px] text-ink-500">
        By continuing you agree to the Nexus terms and privacy policy. We never share your child’s data with advertisers.
      </Body>
    </FormScreen>
  );
}
