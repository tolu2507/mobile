import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormTextField } from '@/components/form';
import { toast } from '@/components/reacticx/molecules/Toast';
import { Banner, FormScreen, GameButton, ScreenHeader } from '@/components/ui';
import { useChangePassword } from '@/features/me/api';
import { friendlyError } from '@/lib/api';
import { password } from '@/lib/validation';
import { palette } from '@/theme';

const schema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: password(),
});

export default function Password() {
  const change = useChangePassword();
  const { control, handleSubmit, setFocus } = useForm({ resolver: zodResolver(schema), defaultValues: { currentPassword: '', newPassword: '' } });
  const submit = handleSubmit((v) =>
    change.mutate(v, {
      onSuccess: () => {
        toast.success('Password changed');
        router.back();
      },
    }),
  );

  return (
    <FormScreen background={palette.paper} footer={<GameButton label="Change password" loading={change.isPending} onPress={submit} />}>
      <ScreenHeader title="Change password" />
      <FormTextField control={control} name="currentPassword" label="Current password" secure autoComplete="current-password" returnKeyType="next" onSubmitEditing={() => setFocus('newPassword')} />
      <FormTextField control={control} name="newPassword" label="New password" secure autoComplete="new-password" hint="At least 8 characters." returnKeyType="go" onSubmitEditing={submit} />
      {change.isError ? <Banner tone="error" message={friendlyError(change.error)} /> : null}
    </FormScreen>
  );
}
