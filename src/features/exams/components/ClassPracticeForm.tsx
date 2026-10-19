import { useState } from 'react';
import { Text, View } from 'react-native';

import { toast } from '@/components/reacticx/molecules/Toast';
import { Banner, Caption, Card, ChipGroup, FormScreen, GameButton, Label, ScreenHeader } from '@/components/ui';
import { friendlyError } from '@/lib/api';
import { confirm } from '@/lib/confirm';
import type { RoleTheme } from '@/theme';
import type { ChosenExam, ExamInfo } from '@/types/api';
import { useChooseExam, useDropExam, type ExamOwner } from '../api';

const CLASSES = ['1', '2', '3', '4', '5'] as const;

/** The class whose subjects these are: "primary-3-mathematics" → "3". */
export const classOf = (slug: string) => slug.match(/^primary-(\d)-/)?.[1] ?? null;
/** Primary 1–5 from a grade name such as "Primary 3"; null for anything else. */
export const classFromGrade = (grade: string | null | undefined) => grade?.match(/Primary ([1-5])\b/)?.[1] ?? null;

/** Class practice has no subject choice: pick the class and its Mathematics, English and Basic Science come with it. */
export function ClassPracticeForm({ info, current, owner, theme, childName, grade, onDone }: { info: ExamInfo; current?: ChosenExam; owner: ExamOwner; theme: RoleTheme; childName?: string; grade?: string | null; onDone: () => void }) {
  const [cls, setCls] = useState<string | null>(() => (current?.subjects[0] ? classOf(current.subjects[0].slug) : classFromGrade(grade)));
  const choose = useChooseExam(owner);
  const drop = useDropExam(owner);
  const subjects = info.subjects.filter((s) => cls && classOf(s.slug) === cls);
  const who = childName ?? 'you';

  const save = () =>
    choose.mutate(
      { exam: info.exam, subjectIds: subjects.map((s) => s.id), targetYear: null },
      {
        onSuccess: () => {
          toast.success(`Primary ${cls} practice is ready`);
          onDone();
        },
      },
    );
  const remove = async () => {
    if (!(await confirm({ title: 'Stop class practice?', message: 'Practice history is kept.', confirmLabel: 'Stop', cancelLabel: 'Keep it', destructive: true }))) return;
    drop.mutate(info.exam, { onSuccess: onDone, onError: (e) => toast.error(friendlyError(e)) });
  };

  return (
    <FormScreen background={theme.bg} footer={<GameButton label={current ? 'Save changes' : 'Start class practice'} color={theme.accent} shadowColor={theme.shadow} disabled={!subjects.length} loading={choose.isPending} onPress={save} />}>
      <ScreenHeader title="Class practice" subtitle={`Fun practice that follows ${childName ? `${childName}’s` : 'your'} class at school. No exam, no timer.`} />
      <ChipGroup label={`Which class ${childName ? `is ${childName}` : 'are you'} in?`} options={CLASSES.map((c) => ({ value: c, label: `Primary ${c}` }))} value={cls} onChange={setCls} accent={theme.accent} />
      {subjects.length ? (
        <Card className="gap-2">
          <Label>What {who} will practise</Label>
          {subjects.map((s) => (
            <View key={s.id} className="flex-row items-center gap-2">
              <Text style={{ color: theme.accent }} className="font-body-bold text-[15px]">
                •
              </Text>
              <Text className="font-body text-[15px] text-ink">{s.name}</Text>
            </View>
          ))}
          <Caption>Questions start easy and get harder as {who === 'you' ? 'you' : childName} improve{who === 'you' ? '' : 's'}.</Caption>
        </Card>
      ) : null}
      {choose.isError ? <Banner tone="error" message={friendlyError(choose.error)} /> : null}
      {current ? <GameButton label="Stop class practice" variant="outline" size="md" loading={drop.isPending} onPress={remove} /> : null}
    </FormScreen>
  );
}
