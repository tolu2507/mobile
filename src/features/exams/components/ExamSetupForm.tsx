import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { toast } from '@/components/reacticx/molecules/Toast';
import { Banner, Caption, Card, ChipGroup, FormScreen, GameButton, Label, PressableScale, ScreenHeader, toggle } from '@/components/ui';
import { friendlyError } from '@/lib/api';
import { palette, type RoleTheme } from '@/theme';
import type { ChosenExam, ExamInfo } from '@/types/api';
import { confirm } from '@/lib/confirm';
import { useChooseExam, useDropExam, type ExamOwner } from '../api';
import { ClassPracticeForm } from './ClassPracticeForm';

const thisYear = new Date().getFullYear();
const YEARS = [0, 1, 2, 3].map((n) => String(thisYear + n));

/** Pick the subject combination for one exam. `childName` is set when a parent does it for a child. */
export function ExamSetupForm(props: { info: ExamInfo; current?: ChosenExam; owner: ExamOwner; theme: RoleTheme; childName?: string; grade?: string | null; onDone: () => void }) {
  return props.info.exam === 'PRIMARY' ? <ClassPracticeForm {...props} /> : <SubjectChoiceForm {...props} />;
}

function SubjectChoiceForm({ info, current, owner, theme, childName, onDone }: { info: ExamInfo; current?: ChosenExam; owner: ExamOwner; theme: RoleTheme; childName?: string; onDone: () => void }) {
  const compulsory = info.subjects.filter((s) => s.compulsory).map((s) => s.id);
  const [picked, setPicked] = useState<string[]>(() => [...new Set([...compulsory, ...(current?.subjects.map((s) => s.id) ?? [])])]);
  const [year, setYear] = useState<string | null>(current?.targetYear ? String(current.targetYear) : null);
  const choose = useChooseExam(owner);
  const drop = useDropExam(owner);

  const { min, max } = info.pick;
  const exact = min === max;
  const optional = info.subjects.filter((s) => !s.compulsory);
  const full = picked.length >= max;
  const ready = picked.length >= min && picked.length <= max;
  const who = childName ? `${childName}’s` : 'your';

  const flip = (id: string) => {
    if (compulsory.includes(id)) return;
    if (!picked.includes(id) && full) {
      toast.error(exact ? `${info.label} is English plus ${max - compulsory.length}. Remove one first.` : `${max} subjects is the most for ${info.label}.`);
      return;
    }
    setPicked((p) => toggle(p, id));
  };

  const applyCourse = (subjectIds: string[]) => setPicked([...new Set([...compulsory, ...subjectIds])]);

  const save = () =>
    choose.mutate(
      { exam: info.exam, subjectIds: picked, targetYear: year ? Number(year) : null },
      {
        onSuccess: () => {
          toast.success(`${info.label} subjects saved`);
          onDone();
        },
      },
    );

  const remove = async () => {
    if (!(await confirm({ title: `Stop ${info.label} prep?`, message: `This removes ${info.label} from ${who} exams. Practice history is kept.`, confirmLabel: 'Remove', cancelLabel: 'Keep it', destructive: true }))) return;
    drop.mutate(info.exam, { onSuccess: onDone, onError: (e) => toast.error(friendlyError(e)) });
  };

  const countLabel = exact ? `${picked.length - compulsory.length} of ${max - compulsory.length} chosen` : `${picked.length} of up to ${max}`;

  return (
    <FormScreen
      background={theme.bg}
      footer={<GameButton label={current ? 'Save changes' : `Start ${info.label} prep`} color={theme.accent} shadowColor={theme.shadow} disabled={!ready} loading={choose.isPending} onPress={save} />}
    >
      <ScreenHeader
        title={info.fullName}
        subtitle={exact ? `Use of English is compulsory. Pick ${max - compulsory.length} more, the same as ${who} real registration.` : `English and Maths are compulsory. Add up to ${max - compulsory.length} more.`}
      />

      {info.courses.length ? (
        <View className="gap-2">
          <Label>What {childName ? `does ${childName}` : 'do you'} want to study?</Label>
          <Caption>Tap a course to fill in a common combination. Check the university’s JAMB brochure to be sure.</Caption>
          <View className="flex-row flex-wrap gap-2">
            {info.courses.map((c) => {
              const on = c.subjectIds.every((id) => picked.includes(id)) && picked.length === compulsory.length + c.subjectIds.length;
              return (
                <PressableScale
                  key={c.course}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  onPress={() => applyCourse(c.subjectIds)}
                  style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center', backgroundColor: on ? theme.accent : '#FFFFFF' }}
                >
                  <Text style={{ color: on ? theme.onAccent : palette.ink.DEFAULT }} className="font-body-bold text-[14px]">
                    {c.course}
                  </Text>
                </PressableScale>
              );
            })}
          </View>
        </View>
      ) : null}

      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <Label>Subjects</Label>
          <Text style={{ color: ready ? palette.mint[700] : palette.ink[500] }} className="font-body-bold text-[14px]">
            {countLabel}
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {info.subjects
            .filter((s) => s.compulsory)
            .map((s) => (
              <View key={s.id} accessibilityLabel={`${s.name}, compulsory`} className="min-h-[44px] flex-row items-center gap-1.5 rounded-full px-3.5" style={{ backgroundColor: theme.accentSoft }}>
                <Ionicons name="lock-closed" size={14} color={theme.accent} />
                <Text style={{ color: theme.accent }} className="font-body-bold text-[14px]">
                  {s.name}
                </Text>
              </View>
            ))}
        </View>
        <ChipGroup options={optional.map((s) => ({ value: s.id, label: s.name }))} value={picked.filter((id) => !compulsory.includes(id))} onChange={flip} accent={theme.accent} />
      </Card>

      <ChipGroup label={`When ${childName ? `does ${childName}` : 'do you'} sit ${info.label}?`} options={YEARS.map((y) => ({ value: y, label: y }))} value={year} onChange={(y) => setYear((cur) => (cur === y ? null : y))} accent={theme.accent} />

      {choose.isError ? <Banner tone="error" message={friendlyError(choose.error)} /> : null}

      {current ? <GameButton label={`Remove ${info.label}`} variant="outline" size="md" loading={drop.isPending} onPress={remove} /> : null}
    </FormScreen>
  );
}
