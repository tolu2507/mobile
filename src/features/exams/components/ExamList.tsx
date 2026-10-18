import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { CardListSkeleton, Caption, EmptyState, ErrorState, Label, PressableScale } from '@/components/ui';
import { palette, type RoleTheme } from '@/theme';
import type { EducationLevel, ExamBody } from '@/types/api';
import { examsForLevel, useExamCatalog, useMyExams, type ExamOwner } from '../api';

/** The exams that suit this level, each showing the chosen subjects or a "Set up" prompt. */
export function ExamList({ level, owner, theme, onOpen }: { level: EducationLevel; owner: ExamOwner; theme: RoleTheme; onOpen: (exam: ExamBody) => void }) {
  const catalog = useExamCatalog();
  const mine = useMyExams(owner);

  if (catalog.isPending || mine.isPending) return <CardListSkeleton count={3} height={92} />;
  if (catalog.error || mine.error) return <ErrorState error={catalog.error ?? mine.error} onRetry={() => (catalog.refetch(), mine.refetch())} color={theme.accent} />;

  const exams = examsForLevel(catalog.data, level);
  if (!exams.length) {
    return <EmptyState icon="school-outline" title="No exams for this class yet" message="Exam prep starts in junior secondary (BECE) and senior secondary (JAMB, WAEC, NECO)." />;
  }

  return (
    <View className="gap-3">
      {exams.map((e) => {
        const chosen = mine.data.find((c) => c.exam === e.exam);
        return (
          <PressableScale
            key={e.exam}
            onPress={() => onOpen(e.exam)}
            accessibilityRole="button"
            accessibilityLabel={chosen ? `${e.fullName}: ${chosen.subjects.map((s) => s.name).join(', ')}. Edit` : `Set up ${e.fullName}`}
            style={{ backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}
          >
            <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl" style={{ backgroundColor: chosen ? theme.accent : theme.accentSoft }}>
              <Text style={{ color: chosen ? theme.onAccent : theme.accent }} className="font-display text-[15px]">
                {e.label}
              </Text>
            </View>
            <View className="flex-1 gap-0.5">
              <Label>
                {e.fullName}
                {chosen?.targetYear ? ` · ${chosen.targetYear}` : ''}
              </Label>
              <Caption numberOfLines={2}>{chosen ? chosen.subjects.map((s) => s.name).join(', ') : e.fridayMock ? 'Practice every day, plus a full mock every Friday' : 'Practice every subject, topic by topic'}</Caption>
            </View>
            {chosen ? <Ionicons name="create-outline" size={20} color={palette.ink[300]} /> : <Text style={{ color: theme.accent }} className="font-body-bold text-[14px]">Set up</Text>}
          </PressableScale>
        );
      })}
    </View>
  );
}
