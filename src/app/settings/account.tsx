import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { FormTextField } from '@/components/form';
import { toast } from '@/components/reacticx/molecules/Toast';
import { Banner, FormScreen, GameButton, ScreenHeader } from '@/components/ui';
import { useUpdateProfile } from '@/features/me/api';
import { friendlyError } from '@/lib/api';
import { email, optionalPhone, required } from '@/lib/validation';
import { useAuth } from '@/store/auth';
import { palette } from '@/theme';

const schema = z.object({
  firstName: required('Enter your first name.'),
  lastName: required('Enter your last name.'),
  email: z.union([z.literal(''), email()]),
  phone: optionalPhone('Enter a valid phone number.'),
});

export default function Account() {
  const user = useAuth((s) => s.user);
  const save = useUpdateProfile();
  const { control, handleSubmit, setFocus } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', email: user?.email ?? '', phone: user?.phone ?? '' },
  });
  const submit = handleSubmit((v) =>
    save.mutate(
      { firstName: v.firstName, lastName: v.lastName, email: v.email || undefined, phone: v.phone || undefined },
      {
        onSuccess: () => {
          toast.success('Details saved');
          router.back();
        },
      },
    ),
  );

  return (
    <FormScreen background={palette.paper} footer={<GameButton label="Save" loading={save.isPending} onPress={submit} />}>
      <ScreenHeader title="Your details" />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormTextField control={control} name="firstName" label="First name" autoComplete="given-name" returnKeyType="next" onSubmitEditing={() => setFocus('lastName')} />
        </View>
        <View className="flex-1">
          <FormTextField control={control} name="lastName" label="Last name" autoComplete="family-name" returnKeyType="next" onSubmitEditing={() => setFocus('email')} />
        </View>
      </View>
      <FormTextField control={control} name="email" label="Email" autoCapitalize="none" keyboardType="email-address" autoComplete="email" hint="Payment receipts and reports go here." returnKeyType="next" onSubmitEditing={() => setFocus('phone')} />
      <FormTextField control={control} name="phone" label="Phone" keyboardType="phone-pad" autoComplete="tel" returnKeyType="done" onSubmitEditing={submit} />
      {save.isError ? <Banner tone="error" message={friendlyError(save.error)} /> : null}
    </FormScreen>
  );
}
