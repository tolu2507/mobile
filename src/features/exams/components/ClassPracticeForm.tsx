import { useState } from 'react';
import { Text, View } from 'react-native';

import { toast } from '@/components/reacticx/molecules/Toast';
import { Banner, Caption, Card, ChipGroup, FormScreen, GameButton, Label, ScreenHeader } from '@/components/ui';
import { friendlyError } from '@/lib/api';
import { confirm } from '@/lib/confirm';
import type { RoleTheme } from '@/theme';
import type { ChosenExam, ExamInfo } from '@/types/api';
import { useChooseExam, useDropExam, type ExamOwner } from '../api';

/** The exams that are class practice rather than a real exam, with the classes each covers. */
export const CLASS_PRACTICE = {
  PRIMARY: { stage: 'Primary', classes: ['1', '2', '3', '4', '5'] },
  NURSERY: { stage: 'Nursery', classes: ['1', '2'] },
} as const;
export type ClassPracticeExam = keyof typeof CLASS_PRACTICE;
export const isClassPractice = (exam: string): exam is ClassPracticeExam => exam in CLASS_PRACTICE;

/** The class whose subjects these are: "primary-3-mathematics" → "3", "nursery-1-numbers" → "1". */
export const classOf = (slug: string) => slug.match(/^(?:primary|nursery)-(\d)-/)?.[1] ?? null;
/** The class number from a grade name such as "Primary 3" or "Nursery 1"; null if it isn't one this practice covers. */
export function classFromGrade(grade: string | null | undefined, exam: ClassPracticeExam = 'PRIMARY') {
  const { stage, classes } = CLASS_PRACTICE[exam];
  const n = grade?.match(new RegExp(`${stage} (\\d)\\b`))?.[1];
  return n && (classes as readonly string[]).includes(n) ? n : null;
}

/** Class practice has no subject choice: pick the class and its subjects come with it. */
export function ClassPracticeForm({ info, current, owner, theme, childName, grade, onDone }: { info: ExamInfo; current?: ChosenExam; owner: ExamOwner; theme: RoleTheme; childName?: string; grade?: string | null; onDone: () => void }) {
  const exam = isClassPractice(info.exam) ? info.exam : 'PRIMARY';
  const { stage, classes } = CLASS_PRACTICE[exam];
  const [cls, setCls] = useState<string | null>(() => (current?.subjects[0] ? classOf(current.subjects[0].slug) : classFromGrade(grade, exam)));
  const choose = useChooseExam(owner);
  const drop = useDropExam(owner);
  const subjects = info.subjects.filter((s) => cls && classOf(s.slug) === cls);
  const who = childName ?? 'you';

  const save = () =>
    choose.mutate(
      { exam: info.exam, subjectIds: subjects.map((s) => s.id), targetYear: null },
      {
        onSuccess: () => {
          toast.success(`${stage} ${cls} practice is ready`);
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
      <ScreenHeader title="Class practice" subtitle={exam === 'NURSERY' ? `Picture games that talk, following ${childName ? `${childName}’s` : 'your'} class. No reading needed, no timer.` : `Fun practice that follows ${childName ? `${childName}’s` : 'your'} class at school. No exam, no timer.`} />
      <ChipGroup label={`Which class ${childName ? `is ${childName}` : 'are you'} in?`} options={classes.map((c) => ({ value: c, label: `${stage} ${c}` }))} value={cls} onChange={setCls} accent={theme.accent} />
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
