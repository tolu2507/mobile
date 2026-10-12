import { HomeSkeleton } from '@/features/student/components/HomeSkeleton';
import { PrimaryHome } from '@/features/student/components/PrimaryHome';
import { SecondaryHome } from '@/features/student/components/SecondaryHome';
import { isPrimary, useStudentHome } from '@/features/student/api';
import { ErrorState, Screen } from '@/components/ui';
import { roles } from '@/theme';

export default function StudentHomeScreen() {
  const { data, isPending, isError, error, refetch, isRefetching } = useStudentHome();

  if (isPending) return <HomeSkeleton background={roles.student.bg} />;
  if (isError)
    return (
      <Screen background={roles.student.bg}>
        <ErrorState error={error} onRetry={refetch} color={roles.student.accent} />
      </Screen>
    );

  const Home = isPrimary(data) ? PrimaryHome : SecondaryHome;
  return <Home home={data} refreshing={isRefetching} onRefresh={refetch} />;
}
