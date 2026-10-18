import { router } from 'expo-router';

import { Screen, ScreenHeader } from '@/components/ui';
import { ExamList } from '@/features/exams/components/ExamList';
import { useMyExams } from '@/features/exams/api';
import { isPrimary, useStudentHome } from '@/features/student/api';
import { roles } from '@/theme';

export default function StudentExams() {
  const home = useStudentHome();
  const mine = useMyExams();
  const theme = isPrimary(home.data) ? roles.studentPrimary : roles.student;
  return (
    <Screen background={theme.bg} edges={['top', 'bottom']} refreshing={mine.isRefetching} onRefresh={() => void mine.refetch()} accent={theme.accent}>
      <ScreenHeader title="Exam prep" subtitle="Choose the exams you’re writing and your subjects. Your practice follows what you pick." />
      {home.data ? <ExamList level={home.data.level} owner={{}} theme={theme} onOpen={(exam) => router.push({ pathname: '/student/exams/[exam]', params: { exam } })} /> : null}
    </Screen>
  );
}
