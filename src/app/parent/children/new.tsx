import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { FormChipGroup, FormTextField } from '@/components/form';
import { OtpInput } from '@/components/reacticx/base/otp-input';
import { toast } from '@/components/reacticx/molecules/Toast';
import { Banner, Card, ChipGroup, FormScreen, GameButton, ScreenHeader, SwitchRow } from '@/components/ui';
import { useCatalog } from '@/features/catalog';
import { useCreateChild } from '@/features/parent/api';
import { useSelectedChild } from '@/features/parent/store';
import { friendlyError } from '@/lib/api';
import { required } from '@/lib/validation';
import { fonts, palette, roles } from '@/theme';
import type { Child } from '@/types/api';

const theme = roles.parent;

const schema = z.object({
  firstName: required('Enter their first name.'),
  lastName: required('Enter their last name.'),
  level: z.custom<Child['level']>((v) => typeof v === 'string' && v.length > 0, 'Choose a level.'),
  gradeName: z.string({ error: 'Choose a class.' }).min(1, 'Choose a class.'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,20}$/, '3–20 lowercase letters, numbers, dots or underscores.'),
  pin: z.string().length(4, 'Choose 4 numbers.'),
  consentDataProcessing: z.literal(true, { error: 'We need this to create the account.' }),
  consentAiReports: z.boolean(),
});

export default function NewChild() {
  const catalog = useCatalog();
  const create = useCreateChild();
  const setChildId = useSelectedChild((s) => s.setChildId);
  const { control, handleSubmit, getValues, setValue, setFocus } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      level: undefined as unknown as Child['level'],
      gradeName: '',
      username: '',
      pin: '',
      consentDataProcessing: true as const,
      consentAiReports: true,
    },
  });
  const level = useWatch({ control, name: 'level' });
  const levelInfo = catalog.data?.levels.find((l) => l.level === level);

  // Offer a username once we know their name, without overwriting one the parent typed.
  const suggest = () => {
    const { username, firstName, lastName } = getValues();
    if (!username && firstName) setValue('username', `${firstName}${lastName[0] ?? ''}`.toLowerCase().replace(/[^a-z0-9]/g, ''));
  };

  const submit = handleSubmit((v) =>
    create.mutate(v, {
      onSuccess: (child) => {
        setChildId(child.id);
        toast.success(`${child.firstName} is ready! Username: ${child.username}`);
        router.back();
      },
    }),
  );

  return (
    <FormScreen background={theme.bg} footer={<GameButton label="Create login" color={theme.accent} shadowColor={theme.shadow} loading={create.isPending} onPress={submit} />}>
      <ScreenHeader title="Add a child" subtitle="Your child gets their own login. They don’t need to be in a BrainBox school." />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormTextField control={control} name="firstName" label="First name" onBlur={suggest} returnKeyType="next" onSubmitEditing={() => setFocus('lastName')} accent={theme.accent} />
        </View>
        <View className="flex-1">
          <FormTextField control={control} name="lastName" label="Last name" onBlur={suggest} accent={theme.accent} />
        </View>
      </View>

      <Controller
        control={control}
        name="level"
        render={({ field, fieldState }) => (
          <ChipGroup
            label="Level"
            accent={theme.accent}
            value={field.value ?? null}
            error={fieldState.error?.message}
            options={(catalog.data?.levels ?? []).map((l) => ({ value: l.level, label: l.label }))}
            onChange={(l) => {
              field.onChange(l);
              setValue('gradeName', '');
            }}
          />
        )}
      />
      {levelInfo ? <FormChipGroup control={control} name="gradeName" label="Class" accent={theme.accent} options={levelInfo.grades.map((g) => ({ value: g, label: g }))} /> : null}

      <FormTextField control={control} name="username" label="Username" placeholder={['adaokafor', 'tunde.b']} autoCapitalize="none" autoCorrect={false} accent={theme.accent} hint="Your child types this to sign in." />
      <View className="gap-2">
        <Text className="font-body-bold text-[14px] text-ink">4-digit PIN</Text>
        <Controller
          control={control}
          name="pin"
          render={({ field, fieldState }) => (
            <OtpInput
              otpCount={4}
              inputWidth={60}
              inputHeight={62}
              inputBorderRadius={16}
              focusedBorderColor={theme.accent}
              unfocusedBorderColor={palette.ink[200]}
              focusedBackgroundColor="#FFFFFF"
              unfocusedBackgroundColor="#FFFFFF"
              textStyle={{ fontFamily: fonts.display, fontSize: 24, color: palette.ink.DEFAULT }}
              error={!!fieldState.error}
              errorMessage={fieldState.error?.message}
              onInputChange={field.onChange}
              onInputFinished={field.onChange}
            />
          )}
        />
        <Text className="font-body text-[13px] text-ink-500">Easy for them to remember, hard for others to guess. Avoid 1234.</Text>
      </View>

      <Card className="gap-1">
        <Text className="pb-1 font-body-bold text-[15px] text-ink">Your permission</Text>
        <Controller
          control={control}
          name="consentDataProcessing"
          render={({ field, fieldState }) => (
            <>
              <SwitchRow label="Store learning data" description="Required: quiz answers, scores and activity so BrainBox works." value={field.value} onChange={field.onChange} accent={theme.accent} />
              {fieldState.error ? <Text className="font-body-semibold text-[13px] text-coral-700">{fieldState.error.message}</Text> : null}
            </>
          )}
        />
        <Controller
          control={control}
          name="consentAiReports"
          render={({ field }) => <SwitchRow label="AI weekly reports" description="Our AI writes your Friday report from their real scores." value={field.value} onChange={field.onChange} accent={theme.accent} />}
        />
      </Card>

      {create.isError ? <Banner tone="error" message={friendlyError(create.error)} /> : null}
    </FormScreen>
  );
}
