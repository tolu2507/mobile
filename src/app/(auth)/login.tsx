import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { FormTextField } from '@/components/form';
import { Banner, Body, FormScreen, GameButton, ScreenHeader } from '@/components/ui';
import { usePasswordLogin } from '@/features/auth/api';
import { friendlyError } from '@/lib/api';
import { required } from '@/lib/validation';
import { palette } from '@/theme';

const schema = z.object({
  identifier: required('Enter your email or phone number.'),
  password: z.string().min(1, 'Enter your password.'),
});

export default function Login() {
  const login = usePasswordLogin();
  const { control, handleSubmit, setFocus } = useForm({ resolver: zodResolver(schema), defaultValues: { identifier: '', password: '' } });
  const submit = handleSubmit((v) => login.mutate(v, { onSuccess: () => router.replace('/') }));

  return (
    <FormScreen background={palette.paper} footer={<GameButton label="Sign in" onPress={submit} loading={login.isPending} />}>
      <ScreenHeader title="Welcome back" subtitle="Parents and lesson teachers sign in here. Students use their username and PIN." />
      <View className="gap-4">
        <FormTextField
          control={control}
          name="identifier"
          label="Email or phone number"
          placeholder={['ada@example.com', '0803 000 0000']}
          autoCapitalize="none"
          autoComplete="username"
          keyboardType="email-address"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => setFocus('password')}
        />
        <FormTextField control={control} name="password" label="Password" secure autoComplete="current-password" textContentType="password" returnKeyType="go" onSubmitEditing={submit} />
      </View>
      {login.isError ? <Banner tone="error" message={friendlyError(login.error)} /> : null}
      <View className="flex-row justify-between">
        <Body accessibilityRole="link" onPress={() => router.push('/forgot-password')} className="py-2 font-body-bold text-violet-700">
          Forgot password?
        </Body>
        <Body accessibilityRole="link" onPress={() => router.push('/student-login')} className="py-2 font-body-bold text-violet-700">
          I’m a student
        </Body>
      </View>
      <Body accessibilityRole="link" onPress={() => router.push({ pathname: '/reset-password', params: { mode: 'invite' } })} className="py-1 text-center font-body-bold text-violet-700">
        Got a code from your school?
      </Body>
      <Body className="text-center text-ink-500">
        New here?{' '}
        <Body accessibilityRole="link" onPress={() => router.replace({ pathname: '/signup', params: { role: 'PARENT' } })} className="font-body-bold text-violet-700">
          Create an account
        </Body>
      </Body>
    </FormScreen>
  );
}
