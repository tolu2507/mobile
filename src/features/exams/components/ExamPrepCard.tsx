import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Caption, Label, PressableScale, Skeleton } from '@/components/ui';
import { palette, type RoleTheme } from '@/theme';
import type { EducationLevel } from '@/types/api';
import { examsForLevel, useExamCatalog, useMyExams } from '../api';

/** Common Entrance prep starts in Primary 4; younger pupils don't see the card. */
const tooYoung = (level: EducationLevel, grade: string | null) => level === 'PRIMARY' && !!grade && !/Primary [456]/.test(grade);

/** Student home: what they're preparing for, or a nudge to set it up. Hidden for levels with no exams. */
export function ExamPrepCard({ level, grade, theme }: { level: EducationLevel; grade: string | null; theme: RoleTheme }) {
  const catalog = useExamCatalog();
  const mine = useMyExams();
  if (tooYoung(level, grade)) return null;
  if (catalog.isPending || mine.isPending) return <Skeleton height={84} radius={22} />;
  if (catalog.error || mine.error || !examsForLevel(catalog.data, level).length) return null;

  const chosen = mine.data;
  const title = chosen.length ? chosen.map((c) => (c.targetYear ? `${c.exam} ${c.targetYear}` : c.exam)).join(' · ') : 'Set up your exam prep';
  const detail = chosen.length
    ? `${new Set(chosen.flatMap((c) => c.subjects.map((s) => s.name))).size} subjects. Tap to change them.`
    : level === 'PRIMARY'
      ? 'Get ready for Common Entrance, one fun step at a time.'
      : 'Pick your exams and subjects. Takes a minute.';

  return (
    <PressableScale
      onPress={() => router.push('/student/exams')}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${detail}`}
      style={{ backgroundColor: chosen.length ? '#FFFFFF' : palette.sun[400], borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
    >
      <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl" style={{ backgroundColor: chosen.length ? theme.accentSoft : '#FFFFFF' }}>
        <Ionicons name="school" size={26} color={theme.accent} />
      </View>
      <View className="flex-1 gap-0.5">
        <Label>{title}</Label>
        <Caption className={chosen.length ? '' : 'text-ink-700'}>{detail}</Caption>
      </View>
      {chosen.length ? <Ionicons name="chevron-forward" size={20} color={palette.ink[300]} /> : <Text className="font-body-bold text-[14px] text-ink">Start</Text>}
    </PressableScale>
  );
}
