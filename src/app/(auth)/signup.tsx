import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { FormChipGroup, FormTextField } from '@/components/form';
import { Banner, Body, FormScreen, GameButton, ScreenHeader } from '@/components/ui';
import { useRegister } from '@/features/auth/api';
import { friendlyError } from '@/lib/api';
import { email, optionalPhone, password, required } from '@/lib/validation';
import { roles } from '@/theme';

const schema = z.object({
  role: z.enum(['PARENT', 'TUTOR']),
  firstName: required('Enter your first name.'),
  lastName: required('Enter your last name.'),
  email: email('Enter a valid email. Receipts and reports go here.'),
  phone: optionalPhone(),
  password: password(),
});

export default function Signup() {
  const params = useLocalSearchParams<{ role?: string }>();
  const register = useRegister();
  const { control, handleSubmit, setFocus } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: (params.role === 'TUTOR' ? 'TUTOR' : 'PARENT') as 'PARENT' | 'TUTOR', firstName: '', lastName: '', email: '', phone: '', password: '' },
  });
  const role = useWatch({ control, name: 'role' });
  const theme = role === 'TUTOR' ? roles.tutor : roles.parent;
  const submit = handleSubmit(({ phone, ...v }) => register.mutate({ ...v, phone: phone || undefined }, { onSuccess: () => router.replace('/') }));

  return (
    <FormScreen
      background={theme.bg}
      footer={<GameButton label="Create account" color={theme.accent} shadowColor={theme.shadow} onPress={submit} loading={register.isPending} />}
    >
      <ScreenHeader
        title={role === 'TUTOR' ? 'Teach with Nexus' : 'Create your account'}
        subtitle={
          role === 'TUTOR'
            ? 'Set up your profile, pass a short subject test and an interview. Then parents can book you.'
            : 'Add your children, follow their weekly progress and find approved lesson teachers.'
        }
      />
      <FormChipGroup
        control={control}
        name="role"
        label="I am a"
        accent={theme.accent}
        options={[
          { value: 'PARENT', label: 'Parent or guardian' },
          { value: 'TUTOR', label: 'Lesson teacher' },
        ]}
      />
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
