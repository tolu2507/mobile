import { router, useLocalSearchParams } from 'expo-router';

import { CardListSkeleton, EmptyState, ErrorState, Screen, ScreenHeader } from '@/components/ui';
import { useExamCatalog, useMyExams } from '@/features/exams/api';
import { ExamSetupForm } from '@/features/exams/components/ExamSetupForm';
import { isPrimary, useStudentHome } from '@/features/student/api';
import { roles } from '@/theme';

export default function StudentExamSetup() {
  const { exam } = useLocalSearchParams<{ exam: string }>();
  const catalog = useExamCatalog();
  const mine = useMyExams();
  const home = useStudentHome().data;
  const theme = isPrimary(home) ? roles.studentPrimary : roles.student;

  if (catalog.isPending || mine.isPending) return <Screen background={theme.bg}><CardListSkeleton count={4} height={64} /></Screen>;
  if (catalog.error || mine.error) return <Screen background={theme.bg}><ErrorState error={catalog.error ?? mine.error} onRetry={() => (catalog.refetch(), mine.refetch())} color={theme.accent} /></Screen>;

  const info = catalog.data.find((e) => e.exam === exam);
  if (!info) return <Screen background={theme.bg}><ScreenHeader title="Exam prep" /><EmptyState title="Exam not found" message="Go back and choose one of the exams listed." /></Screen>;

  return <ExamSetupForm info={info} current={mine.data.find((c) => c.exam === info.exam)} owner={{}} theme={theme} grade={home?.gradeName} onDone={() => router.back()} />;
}
