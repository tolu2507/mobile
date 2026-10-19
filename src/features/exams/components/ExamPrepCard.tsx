import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { toast } from '@/components/reacticx/molecules/Toast';
import { Caption, Label, PressableScale, Skeleton } from '@/components/ui';
import { friendlyError } from '@/lib/api';
import { palette, type RoleTheme } from '@/theme';
import type { ChosenExam, EducationLevel } from '@/types/api';
import { examsForLevel, useChooseExam, useExamCatalog, useMyExams } from '../api';
import { classFromGrade, classOf } from './ClassPracticeForm';

/**
 * Student home: what they're practising for, or a nudge to start.
 * Primary 1–5 get class practice for their own class (and Common Entrance from Primary 4);
 * Primary 6 and secondary get their exams. Hidden for levels with nothing to practise.
 */
export function ExamPrepCard({ level, grade, theme }: { level: EducationLevel; grade: string | null; theme: RoleTheme }) {
  const catalog = useExamCatalog();
  const mine = useMyExams();
  if (catalog.isPending || mine.isPending) return <Skeleton height={84} radius={22} />;
  if (catalog.error || mine.error) return null;

  const cls = level === 'PRIMARY' ? classFromGrade(grade) : null;
  if (cls) {
    return (
      <View className="gap-3">
        <ClassPracticeCard cls={cls} theme={theme} />
        {Number(cls) >= 4 ? <ExamCard chosen={mine.data.filter((c) => c.exam === 'COMMON_ENTRANCE')} primary theme={theme} /> : null}
      </View>
    );
  }
  if (!examsForLevel(catalog.data, level).length) return null;
  return <ExamCard chosen={mine.data} primary={level === 'PRIMARY'} theme={theme} />;
}

function ExamCard({ chosen, primary, theme }: { chosen: ChosenExam[]; primary: boolean; theme: RoleTheme }) {
  const title = chosen.length ? chosen.map((c) => (c.targetYear ? `${c.exam} ${c.targetYear}` : c.exam.replace('COMMON_ENTRANCE', 'Common Entrance'))).join(' · ') : primary ? 'Get ready for Common Entrance' : 'Set up your exam prep';
  const detail = chosen.length
    ? `${new Set(chosen.flatMap((c) => c.subjects.map((s) => s.name))).size} subjects. Tap to practise.`
    : primary
      ? 'One fun step at a time, with a mock every Friday.'
      : 'Pick your exams and subjects. Takes a minute.';
  return (
    <Tile
      onPress={() => router.push(chosen.length ? '/student/practice' : primary ? { pathname: '/student/exams/[exam]', params: { exam: 'COMMON_ENTRANCE' } } : '/student/exams')}
      title={title}
      detail={detail}
      done={chosen.length > 0}
      theme={theme}
      cta="Start"
    />
  );
}

/** One tap to start (or move up) practice for the child's own class. */
function ClassPracticeCard({ cls, theme }: { cls: string; theme: RoleTheme }) {
  const catalog = useExamCatalog();
  const mine = useMyExams();
  const choose = useChooseExam();
  const current = mine.data?.find((c) => c.exam === 'PRIMARY');
  const currentCls = current?.subjects[0] ? classOf(current.subjects[0].slug) : null;
  const ready = currentCls === cls;
  const subjects = catalog.data?.find((e) => e.exam === 'PRIMARY')?.subjects.filter((s) => classOf(s.slug) === cls) ?? [];

  const start = () =>
    choose.mutate(
      { exam: 'PRIMARY', subjectIds: subjects.map((s) => s.id), targetYear: null },
      {
        onSuccess: () => {
          toast.success(`Primary ${cls} practice is ready`);
          router.push('/student/practice');
        },
        onError: (e) => toast.error(friendlyError(e)),
      },
    );

  return (
    <Tile
      onPress={ready ? () => router.push('/student/practice') : start}
      title={ready ? `Primary ${cls} practice` : currentCls ? `Move up to Primary ${cls} practice` : `Start Primary ${cls} practice`}
      detail={ready ? 'Maths, English and Basic Science. Tap to play.' : 'Fun questions from your class at school, easy to hard.'}
      done={ready}
      loading={choose.isPending}
      theme={theme}
      cta="Start"
    />
  );
}

function Tile({ onPress, title, detail, done, loading, theme, cta }: { onPress: () => void; title: string; detail: string; done: boolean; loading?: boolean; theme: RoleTheme; cta: string }) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}`}
      accessibilityState={{ busy: loading }}
      style={{ backgroundColor: done ? '#FFFFFF' : palette.sun[400], borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, opacity: loading ? 0.6 : 1 }}
    >
      <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl" style={{ backgroundColor: done ? theme.accentSoft : '#FFFFFF' }}>
        <Ionicons name="school" size={26} color={theme.accent} />
      </View>
      <View className="flex-1 gap-0.5">
        <Label>{title}</Label>
        <Caption className={done ? '' : 'text-ink-700'}>{detail}</Caption>
      </View>
      {done ? <Ionicons name="chevron-forward" size={20} color={palette.ink[300]} /> : <Text className="font-body-bold text-[14px] text-ink">{loading ? '…' : cta}</Text>}
    </PressableScale>
  );
}
