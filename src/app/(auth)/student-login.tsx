import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { FormTextField } from '@/components/form';
import { OtpInput } from '@/components/reacticx/base/otp-input';
import { Banner, Body, Display, GameButton } from '@/components/ui';
import { usePinLogin } from '@/features/auth/api';
import { friendlyError } from '@/lib/api';
import { required } from '@/lib/validation';
import { fonts, palette } from '@/theme';
import { goBack } from '@/lib/nav';

const schema = z.object({
  username: required('Type your username.').toLowerCase(),
  pin: z.string().length(4, 'Your PIN has 4 numbers.'),
});

/** Kids sign in with the username and 4-digit PIN their parent (or school) set up — no email needed. */
export default function StudentLogin() {
  const login = usePinLogin();
  const { control, handleSubmit, getValues, setValue } = useForm({ resolver: zodResolver(schema), defaultValues: { username: '', pin: '' } });
  const submit = handleSubmit((v) => login.mutate(v, { onSuccess: () => router.replace('/') }));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.sun[50] }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-6 px-6 pb-10 pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => goBack()}
            className="h-11 w-11 items-center justify-center rounded-2xl bg-white"
          >
            <Ionicons name="chevron-back" size={22} color={palette.ink.DEFAULT} />
          </Pressable>

          <View className="gap-2">
            <Display className="text-[36px] leading-[40px]">Let’s get you in!</Display>
            <Body className="text-ink-700">Ask your parent for your username and PIN. They set it up in their BrainBox app.</Body>
          </View>


          <View className="gap-4">
            <FormTextField control={control} name="username" label="Username" placeholder={['ada.okafor', 'tunde2015']} autoCapitalize="none" autoCorrect={false} accent={palette.coral[500]} />
            <View className="gap-2">
              <Text className="font-body-bold text-[14px] text-ink">PIN</Text>
              <Controller
                control={control}
                name="pin"
                render={({ fieldState }) => (
                  <OtpInput
                    otpCount={4}
                    inputWidth={64}
                    inputHeight={68}
                    inputBorderRadius={20}
                    animationVariant="bounce"
                    focusedBorderColor={palette.coral[500]}
                    unfocusedBorderColor="#F1D98A"
                    focusedBackgroundColor={palette.white}
                    unfocusedBackgroundColor={palette.white}
                    textStyle={{ fontFamily: fonts.display, fontSize: 28, color: palette.ink.DEFAULT }}
                    error={!!fieldState.error}
                    errorMessage={fieldState.error?.message}
                    onInputChange={(code) => setValue('pin', code, { shouldValidate: !!fieldState.error })}
                    onInputFinished={(code) => {
                      setValue('pin', code);
                      if (getValues('username').trim()) submit();
                    }}
                  />
                )}
              />
            </View>
          </View>

          {login.isError ? <Banner tone="error" message={friendlyError(login.error)} /> : null}

          <GameButton
            label="Let's go!"
            size="xl"
            variant="accent"
            color={palette.coral[500]}
            shadowColor="#C63F1D"
            loading={login.isPending}
            onPress={submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
