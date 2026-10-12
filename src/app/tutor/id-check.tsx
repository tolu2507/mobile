import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useFieldArray, useForm } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { FormTextField } from '@/components/form';
import { toast } from '@/components/reacticx/molecules/Toast';
import { Banner, Card, FormScreen, GameButton, ScreenHeader } from '@/components/ui';
import { useSaveIdCheck } from '@/features/tutor/api';
import { friendlyError } from '@/lib/api';
import { phone } from '@/lib/validation';
import { roles } from '@/theme';

const theme = roles.tutor;

const schema = z.object({
  ninNumber: z.string().regex(/^\d{11}$/, 'Your NIN has 11 digits.'),
  referees: z.array(
    z.object({
      name: z.string().trim().min(2, 'Enter their name.'),
      phone: phone(),
      relationship: z.string().trim().min(2, 'How do you know them?'),
    }),
  ),
});

export default function IdCheck() {
  const save = useSaveIdCheck();
  const empty = { name: '', phone: '', relationship: '' };
  const { control, handleSubmit } = useForm({ resolver: zodResolver(schema), defaultValues: { ninNumber: '', referees: [empty, empty] } });
  const { fields } = useFieldArray({ control, name: 'referees' });

  const submit = handleSubmit((v) =>
    save.mutate(v, {
      onSuccess: () => {
        toast.success('Saved. Next: your subject test');
        router.back();
      },
    }),
  );

  return (
    <FormScreen background={theme.bg} footer={<GameButton label="Save and continue" color={theme.accent} shadowColor={theme.shadow} loading={save.isPending} onPress={submit} />}>
      <ScreenHeader title="ID check" subtitle="Parents trust Nexus because every teacher is verified. Your details are only seen by the Nexus vetting team." />
      <FormTextField
        control={control}
        name="ninNumber"
        label="National Identification Number (NIN)"
        placeholder="11 digits"
        keyboardType="number-pad"
        maxLength={11}
        format={(v) => v.replace(/\D/g, '').slice(0, 11)}
        accent={theme.accent}
      />
      {fields.map((f, i) => (
        <Card key={f.id} className="gap-3">
          <Text className="font-body-bold text-[15px] text-ink">Referee {i + 1}</Text>
          <FormTextField control={control} name={`referees.${i}.name`} label="Full name" accent={theme.accent} />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <FormTextField control={control} name={`referees.${i}.phone`} label="Phone" keyboardType="phone-pad" accent={theme.accent} />
            </View>
            <View className="flex-1">
              <FormTextField control={control} name={`referees.${i}.relationship`} label="Relationship" placeholder={['Principal', 'Head of dept.', 'Parent']} accent={theme.accent} />
            </View>
          </View>
        </Card>
      ))}
      <Text className="font-body text-[13px] text-ink-500">Choose people who’ve seen you teach: a principal, head of department or a parent you’ve tutored for. We call them before your interview.</Text>
      {save.isError ? <Banner tone="error" message={friendlyError(save.error)} /> : null}
    </FormScreen>
  );
}
