import { router, useLocalSearchParams } from 'expo-router';

import { CardListSkeleton, EmptyState, ErrorState, Screen, ScreenHeader } from '@/components/ui';
import { useExamCatalog, useMyExams } from '@/features/exams/api';
import { ExamSetupForm } from '@/features/exams/components/ExamSetupForm';
import { useChildren } from '@/features/parent/api';
import { roles } from '@/theme';

const theme = roles.parent;

export default function ChildExamSetup() {
  const { id, exam } = useLocalSearchParams<{ id: string; exam: string }>();
  const children = useChildren();
  const catalog = useExamCatalog();
  const mine = useMyExams({ studentId: id });

  if (children.isPending || catalog.isPending || mine.isPending) return <Screen background={theme.bg}><CardListSkeleton count={4} height={64} /></Screen>;
  if (children.isError || catalog.isError || mine.isError) return <Screen background={theme.bg}><ErrorState error={children.error ?? catalog.error ?? mine.error} onRetry={() => (children.refetch(), catalog.refetch(), mine.refetch())} color={theme.accent} /></Screen>;

  const child = children.data.find((c) => c.id === id);
  const info = catalog.data.find((e) => e.exam === exam);
  if (!child || !info) return <Screen background={theme.bg}><ScreenHeader title="Exam prep" /><EmptyState title="Not found" message="Go back and choose a child and exam from the list." /></Screen>;

  return <ExamSetupForm info={info} current={mine.data.find((c) => c.exam === info.exam)} owner={{ studentId: child.id }} theme={theme} childName={child.firstName} onDone={() => router.back()} />;
}
