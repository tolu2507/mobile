import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { CardListSkeleton, Caption, EmptyState, ErrorState, GameButton, Label, PressableScale, Screen, ScreenHeader, SubjectIcon } from '@/components/ui';
import { useExamCatalog, useMyExams } from '@/features/exams/api';
import { subjectLook } from '@/features/practice/subjects';
import { isPrimary, useStudentHome } from '@/features/student/api';
import { palette, roles } from '@/theme';

/** Practice hub: every subject the student picked, grouped by exam. */
export default function PracticeHub() {
  const theme = isPrimary(useStudentHome().data) ? roles.studentPrimary : roles.student;
  const mine = useMyExams();
  const catalog = useExamCatalog();
  const label = (exam: string) => catalog.data?.find((e) => e.exam === exam)?.fullName ?? exam;

  return (
    <Screen background={theme.bg} edges={['top', 'bottom']} refreshing={mine.isRefetching} onRefresh={() => void mine.refetch()} accent={theme.accent}>
      <ScreenHeader title="Practice" subtitle="Pick a subject. Each topic goes from easy to hard, and you never get the same question twice." />
      {mine.isPending ? (
        <CardListSkeleton count={4} height={76} />
      ) : mine.error ? (
        <ErrorState error={mine.error} onRetry={() => void mine.refetch()} color={theme.accent} />
      ) : !mine.data.length ? (
        <EmptyState
          icon="school-outline"
          title="Choose your exam first"
          message="Tell us which exam you’re writing and your subjects. Your practice follows what you pick."
          action={<GameButton label="Set up exam prep" className="mt-2 self-stretch" color={theme.accent} shadowColor={theme.shadow} onPress={() => router.push('/student/exams')} />}
        />
      ) : (
        mine.data.map((exam) => (
          <View key={exam.exam} className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="font-display text-[20px] text-ink">
                {label(exam.exam)}
                {exam.targetYear ? ` · ${exam.targetYear}` : ''}
              </Text>
              <PressableScale accessibilityRole="button" accessibilityLabel={`Change ${exam.exam} subjects`} onPress={() => router.push({ pathname: '/student/exams/[exam]', params: { exam: exam.exam } })}>
                <Text style={{ color: theme.accent }} className="font-body-bold text-[14px]">
                  Change
                </Text>
              </PressableScale>
            </View>
            {exam.subjects.map((s) => {
              const look = subjectLook(s.slug);
              return (
                <PressableScale
                  key={s.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Practise ${s.name}`}
                  onPress={() => router.push({ pathname: '/student/practice/[subjectId]', params: { subjectId: s.id } })}
                  style={{ backgroundColor: '#FFFFFF', borderRadius: 22, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 }}
                >
                  <SubjectIcon icon={look.icon} tone={look.tone} />
                  <View className="flex-1">
                    <Label>{s.name}</Label>
                    <Caption>Topic by topic, easy to hard</Caption>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={palette.ink[300]} />
                </PressableScale>
              );
            })}
          </View>
        ))
      )}
    </Screen>
  );
}
