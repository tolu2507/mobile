import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { FormChipGroup, FormTextField } from '@/components/form';
import { toast } from '@/components/reacticx/molecules/Toast';
import { Banner, FormScreen, GameButton, ScreenHeader } from '@/components/ui';
import { useChildren } from '@/features/parent/api';
import { useOpenTicket } from '@/features/support/api';
import { friendlyError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { palette } from '@/theme';

const schema = z.object({
  subject: z.string().trim().min(3, 'Give your question a short title.').max(120, 'Keep the title under 120 characters.'),
  body: z.string().trim().min(5, 'Tell us a little more so we can help.').max(4000, 'That’s too long. Keep it under 4,000 characters.'),
  studentId: z.string(),
});

export default function NewSupportQuestion() {
  const isParent = useAuth((s) => s.activeRole === 'PARENT');
  const children = useChildren();
  const open = useOpenTicket();
  const { control, handleSubmit, setFocus } = useForm({ resolver: zodResolver(schema), defaultValues: { subject: '', body: '', studentId: '' } });
  const kids = isParent ? (children.data ?? []) : [];
  const submit = handleSubmit((v) =>
    open.mutate(
      { subject: v.subject, body: v.body, studentId: v.studentId || undefined },
      {
        onSuccess: (t) => {
          toast.success('Sent. We’ll reply here soon.');
          router.replace({ pathname: '/settings/support/[id]', params: { id: t.id } });
        },
      },
    ),
  );

  return (
    <FormScreen background={palette.paper} footer={<GameButton label="Send" loading={open.isPending} onPress={submit} />}>
      <ScreenHeader title="Ask us a question" subtitle="A real person at BrainBox reads every message." />
      <FormTextField control={control} name="subject" label="What is it about?" placeholder={['I can’t sign in', 'My child’s report looks wrong', 'How do mocks work?']} returnKeyType="next" onSubmitEditing={() => setFocus('body')} />
      {kids.length ? (
        <FormChipGroup
          control={control}
          name="studentId"
          label="Which child is it about?"
          options={[{ value: '', label: 'Not about a child' }, ...kids.map((c) => ({ value: c.id, label: c.firstName }))]}
        />
      ) : null}
      <FormTextField control={control} name="body" label="Your message" multiline numberOfLines={6} placeholder="Tell us what happened and what you expected." />
      {open.isError ? <Banner tone="error" message={friendlyError(open.error)} /> : null}
    </FormScreen>
  );
}
