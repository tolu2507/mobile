import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';

import { FormChipGroup, FormMultiChipGroup, FormTextField } from '@/components/form';
import { toast } from '@/components/reacticx/molecules/Toast';
import { Banner, CardListSkeleton, FormScreen, GameButton, Screen, ScreenHeader } from '@/components/ui';
import { useCatalog } from '@/features/catalog';
import { useChildren, useSaveRequest, useTutorRequest } from '@/features/parent/api';
import { friendlyError } from '@/lib/api';
import { roles } from '@/theme';
import type { TutorRequest } from '@/types/api';

const theme = roles.parent;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PREFS = ['Patient', 'Exam prep', 'Homework help', 'Makes it fun', 'Firm and structured', 'Builds confidence'];
const BUDGETS = [
  { value: '300000', label: '₦3,000' },
  { value: '500000', label: '₦5,000' },
  { value: '800000', label: '₦8,000' },
  { value: '1200000', label: '₦12,000' },
  { value: 'none', label: 'No limit' },
];

const schema = z
  .object({
    subject: z.string().min(1, 'Choose a subject.'),
    goals: z.string().trim(),
    mode: z.enum(['BOTH', 'IN_PERSON', 'ONLINE']),
    state: z.string().trim(),
    lga: z.string().trim(),
    budget: z.string(),
    days: z.array(z.string()).min(1, 'Pick at least one day.'),
    preferences: z.array(z.string()),
  })
  .refine((v) => v.mode === 'ONLINE' || v.state.length > 0, {
    path: ['state'],
    message: 'Enter your state for home lessons.',
    // Check this alongside the other fields instead of only after they pass.
    when: (p) => typeof (p.value as { state?: unknown })?.state === 'string',
  });

export default function RequestScreen() {
  const { studentId, requestId } = useLocalSearchParams<{ studentId: string; requestId?: string }>();
  const existing = useTutorRequest(requestId ? studentId : undefined);
  if (requestId && existing.isPending) return <Screen background={theme.bg}><CardListSkeleton count={4} height={80} /></Screen>;
  return <RequestForm studentId={studentId} requestId={requestId} initial={existing.data ?? null} />;
}

function RequestForm({ studentId, requestId, initial }: { studentId: string; requestId?: string; initial: TutorRequest | null }) {
  const catalog = useCatalog();
  const children = useChildren();
  const child = children.data?.find((c) => c.id === studentId);
  const subjects = catalog.data?.levels.find((l) => l.level === child?.level)?.subjects ?? [];
  const save = useSaveRequest(requestId);

  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: initial?.subject ?? '',
      goals: initial?.goals ?? '',
      mode: initial?.mode ?? 'BOTH',
      state: initial?.state ?? 'Lagos',
      lga: initial?.lga ?? '',
      budget: initial?.budgetMaxKobo ?? 'none',
      days: initial?.days ?? [],
      preferences: initial?.preferences ?? [],
    },
  });
  const mode = useWatch({ control, name: 'mode' });

  const submit = handleSubmit(({ budget, goals, state, lga, ...v }) =>
    save.mutate(
      { studentId, ...v, goals: goals || undefined, state: state || undefined, lga: lga || undefined, budgetMaxKobo: budget === 'none' ? undefined : Number(budget) },
      {
        onSuccess: () => {
          toast.success(requestId ? 'Request updated' : 'Finding your matches…');
          router.back();
        },
      },
    ),
  );

  return (
    <FormScreen background={theme.bg} footer={<GameButton label={requestId ? 'Save changes' : 'Show my matches'} color={theme.accent} shadowColor={theme.shadow} loading={save.isPending} onPress={submit} />}>
      <ScreenHeader title={requestId ? 'Edit your request' : `A teacher for ${child?.firstName ?? 'your child'}`} subtitle={`${child?.className ?? ''}. Only subject, level and area are shared with teachers, never names.`} />
      <FormChipGroup control={control} name="subject" label="Subject" accent={theme.accent} options={subjects.map((s) => ({ value: s, label: s }))} />
      <FormTextField control={control} name="goals" label="What do you want to achieve? (optional)" multiline placeholder="e.g. Pass WAEC Chemistry with a B or better" accent={theme.accent} style={{ height: 90 }} />
      <FormChipGroup control={control} name="mode" label="Where" accent={theme.accent} options={[{ value: 'BOTH', label: 'Home or online' }, { value: 'IN_PERSON', label: 'At home' }, { value: 'ONLINE', label: 'Online' }]} />
      {mode !== 'ONLINE' ? (
        <View className="flex-row gap-3">
          <View className="flex-1"><FormTextField control={control} name="state" label="State" accent={theme.accent} /></View>
          <View className="flex-1"><FormTextField control={control} name="lga" label="Area / LGA" placeholder={['Eti-Osa', 'Ikeja', 'Surulere']} accent={theme.accent} /></View>
        </View>
      ) : null}
      <FormMultiChipGroup control={control} name="days" label="Which days work?" accent={theme.accent} options={DAYS.map((d) => ({ value: d, label: d }))} />
      <FormChipGroup control={control} name="budget" label="Budget per hour" accent={theme.accent} options={BUDGETS} />
      <FormMultiChipGroup control={control} name="preferences" label="What kind of teacher? (optional)" accent={theme.accent} options={PREFS.map((p) => ({ value: p, label: p }))} />
      {save.isError ? <Banner tone="error" message={friendlyError(save.error)} /> : null}
    </FormScreen>
  );
}
