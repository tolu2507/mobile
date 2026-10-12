import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';
import { z } from 'zod';

import { FormChipGroup, FormTextField } from '@/components/form';
import { toast } from '@/components/reacticx/molecules/Toast';
import { Banner, Card, CardListSkeleton, ChipGroup, FormScreen, GameButton, PressableScale, Screen, ScreenHeader } from '@/components/ui';
import { levelLabel, useCatalog } from '@/features/catalog';
import { useSaveTutorProfile, useTutorApplication } from '@/features/tutor/api';
import { friendlyError } from '@/lib/api';
import { naira } from '@/lib/format';
import { required } from '@/lib/validation';
import { palette, roles } from '@/theme';
import type { EducationLevel, TutorApplication } from '@/types/api';

const theme = roles.tutor;
type Choice = { subject: string; level: EducationLevel };
const digits = (v: string) => v.replace(/[^0-9]/g, '');

const schema = z.object({
  headline: z.string().trim().min(5, 'Write a short headline (5+ characters).'),
  bio: z.string().trim().min(20, 'Tell parents a bit more (20+ characters).'),
  years: z.string().regex(/^\d{1,2}$/, 'Enter years of experience.'),
  rate: z.string().refine((v) => Number(v) >= 1000 && Number(v) <= 100000, 'Between ₦1,000 and ₦100,000 per hour.'),
  qualifications: z.string(),
  mode: z.enum(['BOTH', 'IN_PERSON', 'ONLINE']),
  state: required('Enter your state.'),
  lga: z.string().trim(),
  subjects: z.array(z.object({ subject: z.string(), level: z.custom<EducationLevel>() })).min(1, 'Add at least one subject.'),
});

export default function ProfileFormScreen() {
  const app = useTutorApplication();
  if (app.isPending) return <Screen background={theme.bg}><CardListSkeleton count={5} height={70} /></Screen>;
  return <ProfileForm initial={app.data ?? null} />;
}

function ProfileForm({ initial }: { initial: TutorApplication | null }) {
  const catalog = useCatalog();
  const save = useSaveTutorProfile();
  const p = initial?.profile;
  const [pickLevel, setPickLevel] = useState<EducationLevel | null>(null);
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      headline: p?.headline ?? '',
      bio: p?.bio ?? '',
      years: p?.yearsExperience != null ? String(p.yearsExperience) : '',
      rate: p && Number(p.rateKobo) > 0 ? String(Number(p.rateKobo) / 100) : '',
      qualifications: p?.qualifications.join(', ') ?? '',
      mode: p?.mode ?? 'BOTH',
      state: p?.state ?? 'Lagos',
      lga: p?.lga ?? '',
      subjects: initial?.subjects.map(({ subject, level }): Choice => ({ subject, level })) ?? [],
    },
  });
  const rate = Number(useWatch({ control, name: 'rate' }));
  const levelSubjects = catalog.data?.levels.find((l) => l.level === pickLevel)?.subjects ?? [];

  const submit = handleSubmit((v) =>
    save.mutate(
      {
        headline: v.headline,
        bio: v.bio,
        yearsExperience: Number(v.years),
        qualifications: v.qualifications.split(',').map((q) => q.trim()).filter(Boolean).slice(0, 6),
        mode: v.mode,
        state: v.state,
        lga: v.lga || undefined,
        rateKobo: Number(v.rate) * 100,
        subjects: v.subjects,
      },
      {
        onSuccess: () => {
          toast.success('Profile saved');
          router.back();
        },
      },
    ),
  );

  return (
    <FormScreen background={theme.bg} footer={<GameButton label="Save profile" color={theme.accent} shadowColor={theme.shadow} loading={save.isPending} onPress={submit} />}>
      <ScreenHeader title="Your teacher profile" subtitle="Parents see this when you match their request." />
      <FormTextField control={control} name="headline" label="Headline" placeholder={['Chemistry teacher, WAEC specialist', 'Patient primary maths tutor', 'JAMB English coach']} accent={theme.accent} />
      <FormTextField control={control} name="bio" label="About you" multiline placeholder="Where you’ve taught, how you teach, results you’re proud of." accent={theme.accent} style={{ height: 120 }} />
      <View className="flex-row gap-3">
        <View className="flex-1"><FormTextField control={control} name="years" label="Years teaching" keyboardType="number-pad" format={(v) => digits(v).slice(0, 2)} accent={theme.accent} /></View>
        <View className="flex-1"><FormTextField control={control} name="rate" label="Rate per hour (₦)" keyboardType="number-pad" placeholder="7000" format={digits} accent={theme.accent} /></View>
      </View>
      {rate >= 1000 ? <Text className="-mt-3 font-body text-[13px] text-ink-500">You receive {naira(rate * 100)} per hour. Parents see it with the Nexus service charge added.</Text> : null}
      <FormTextField control={control} name="qualifications" label="Qualifications (optional)" placeholder={['B.Sc. Chemistry, TRCN', 'NCE, B.Ed. Mathematics']} hint="Separate with commas." accent={theme.accent} />
      <FormChipGroup control={control} name="mode" label="Where do you teach?" accent={theme.accent} options={[{ value: 'BOTH', label: 'Home & online' }, { value: 'IN_PERSON', label: 'At students’ homes' }, { value: 'ONLINE', label: 'Online only' }]} />
      <View className="flex-row gap-3">
        <View className="flex-1"><FormTextField control={control} name="state" label="State" accent={theme.accent} /></View>
        <View className="flex-1"><FormTextField control={control} name="lga" label="Area / LGA" placeholder={['Eti-Osa', 'Ikeja', 'Surulere']} accent={theme.accent} /></View>
      </View>

      <Controller
        control={control}
        name="subjects"
        render={({ field: { value: subjects, onChange }, fieldState: { error } }) => (
          <Card className="gap-3">
            <Text className="font-body-bold text-[15px] text-ink">Subjects (up to 4)</Text>
            <Text className="font-body text-[13px] text-ink-500">You’ll take a short test for each one. Parents only find you for subjects you pass.</Text>
            {subjects.map((s) => (
              <View key={`${s.subject}-${s.level}`} className="flex-row items-center gap-2 rounded-2xl bg-coral-50 px-3.5 py-2.5">
                <Text className="flex-1 font-body-bold text-[14px] text-ink">{s.subject} · {levelLabel(catalog.data, s.level)}</Text>
                <PressableScale accessibilityLabel={`Remove ${s.subject}`} onPress={() => onChange(subjects.filter((y) => y !== s))} style={{ padding: 6 }}>
                  <Ionicons name="close-circle" size={22} color={palette.coral[700]} />
                </PressableScale>
              </View>
            ))}
            {subjects.length < 4 ? (
              <>
                <ChipGroup label="Add a subject: level" accent={theme.accent} value={pickLevel} onChange={setPickLevel} options={(catalog.data?.levels ?? []).map((l) => ({ value: l.level, label: l.label }))} />
                {pickLevel ? (
                  <ChipGroup
                    accent={theme.accent}
                    value={null}
                    onChange={(subject) => {
                      if (!subjects.some((s) => s.subject === subject && s.level === pickLevel)) onChange([...subjects, { subject, level: pickLevel }]);
                      setPickLevel(null);
                    }}
                    options={levelSubjects.map((s) => ({ value: s, label: s }))}
                  />
                ) : null}
              </>
            ) : null}
            {error ? <Text className="font-body-semibold text-[13px] text-coral-700">{error.message}</Text> : null}
          </Card>
        )}
      />
      {save.isError ? <Banner tone="error" message={friendlyError(save.error)} /> : null}
    </FormScreen>
  );
}
