import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { toast } from '@/components/reacticx/molecules/Toast';
import { Avatar, Banner, Body, Caption, Card, CardListSkeleton, EmptyState, ErrorState, GameButton, Label, Pill, PressableScale, Screen, SwitchRow, Title } from '@/components/ui';
import { levelLabel, useCatalog } from '@/features/catalog';
import { useAvailability, useBookingAction, useEarnings, useTutorApplication, useTutorBookings } from '@/features/tutor/api';
import { friendlyError } from '@/lib/api';
import { initials, naira, percent } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { palette, roles } from '@/theme';
import type { ApplicationStage, TestStatus, TutorApplication } from '@/types/api';

const theme = roles.tutor;
const STEPS: { key: ApplicationStage; title: string; detail: string }[] = [
  { key: 'PROFILE', title: 'Your profile', detail: 'Subjects, experience and your hourly rate' },
  { key: 'ID_CHECK', title: 'ID check', detail: 'Your NIN and two referees' },
  { key: 'SUBJECT_TEST', title: 'Subject test', detail: '20 minutes per subject. Pass mark 70%' },
  { key: 'INTERVIEW', title: 'Short interview', detail: '15-minute call with the Nexus team' },
  { key: 'APPROVED', title: 'Nexus approved', detail: 'Parents can find and book you' },
];
const TEST_PILL: Record<TestStatus, { label: string; tone: 'sun' | 'violet' | 'mint' | 'coral' | 'sky' }> = {
  NOT_STARTED: { label: 'Not started', tone: 'sky' },
  IN_PROGRESS: { label: 'In progress', tone: 'sun' },
  PASSED: { label: 'Passed', tone: 'mint' },
  FAILED: { label: 'Not passed', tone: 'coral' },
  NO_TEST_YET: { label: 'Test coming soon', tone: 'violet' },
};

export default function TutorHome() {
  const app = useTutorApplication();
  const user = useAuth((s) => s.user);
  const approved = app.data?.stage === 'APPROVED';

  const header = (
    <View style={{ backgroundColor: theme.accent, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
      <SafeAreaView edges={['top']}>
        <View className="gap-3 px-5 pb-6 pt-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-body-bold text-[13px] uppercase tracking-wider text-white">Lesson teacher</Text>
            <PressableScale accessibilityLabel="Your account" onPress={() => router.push('/tutor/me')}>
              <Avatar initials={initials(user?.firstName ?? '?', user?.lastName)} size={44} radius={14} />
            </PressableScale>
          </View>
          <Text accessibilityRole="header" className="font-display text-[30px] leading-[34px] text-white">
            {approved ? `Welcome back, ${user?.firstName}` : 'Become Nexus approved'}
          </Text>
          {app.data && !approved && app.data.stage !== 'REJECTED' ? (
            <Text className="font-body text-[15px] leading-[22px]" style={{ color: '#FFE7DF' }}>
              Step {STEPS.findIndex((s) => s.key === app.data.stage) + 1} of {STEPS.length}. Parents only see teachers who pass every step.
            </Text>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );

  return (
    <Screen background={theme.bg} header={header} refreshing={app.isRefetching} onRefresh={app.refetch} accent={theme.accent}>
      {app.isPending ? (
        <CardListSkeleton count={4} height={80} />
      ) : app.isError ? (
        <ErrorState error={app.error} onRetry={app.refetch} color={theme.accent} />
      ) : approved ? (
        <Dashboard application={app.data} />
      ) : (
        <Journey application={app.data} />
      )}
    </Screen>
  );
}

function Journey({ application: a }: { application: TutorApplication }) {
  const catalog = useCatalog();
  const current = STEPS.findIndex((s) => s.key === a.stage);

  if (a.stage === 'REJECTED') {
    return <EmptyState icon="close-circle-outline" title="Application not approved" message={`${a.decisionReason ?? ''} You’re welcome to apply again in 3 months. Questions? Help & support is in your account.`} />;
  }

  return (
    <>
      <Card className="py-2">
        {STEPS.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <View key={s.key} className="flex-row gap-3.5 px-1 py-2.5" accessibilityLabel={`${s.title}: ${done ? 'done' : active ? 'current step' : 'to do'}`}>
              <View className="items-center">
                <View style={{ width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: done ? palette.mint[400] : active ? theme.accent : palette.ink[100] }}>
                  {done ? <Ionicons name="checkmark" size={18} color="#FFFFFF" /> : <Text style={{ color: active ? '#FFFFFF' : palette.ink[500] }} className="font-body-extrabold text-[14px]">{i + 1}</Text>}
                </View>
                {i < STEPS.length - 1 ? <View style={{ width: 2, flex: 1, minHeight: 18, marginTop: 4, backgroundColor: done ? palette.mint[400] : palette.ink[100] }} /> : null}
              </View>
              <View className="flex-1 gap-0.5 pb-1">
                <Label style={{ color: active || done ? palette.ink.DEFAULT : palette.ink[500] }}>{s.title}</Label>
                <Caption>{s.detail}</Caption>
              </View>
            </View>
          );
        })}
      </Card>

      {a.stage === 'PROFILE' ? (
        <GameButton label="Set up your teacher profile" color={theme.accent} shadowColor={theme.shadow} onPress={() => router.push('/tutor/profile-form')} />
      ) : null}

      {a.stage === 'ID_CHECK' ? (
        <>
          <GameButton label="Add your NIN and referees" color={theme.accent} shadowColor={theme.shadow} onPress={() => router.push('/tutor/id-check')} />
          <Body accessibilityRole="link" onPress={() => router.push('/tutor/profile-form')} className="py-2 text-center font-body-bold text-coral-700">Edit profile</Body>
        </>
      ) : null}

      {a.stage === 'INTERVIEW' ? (
        <Banner tone="success" title="You passed! Interview next" message="The Nexus team will call you within 2 working days to book a 15-minute interview. You can take tests for your other subjects meanwhile." />
      ) : null}

      {a.stage === 'SUBJECT_TEST' || a.stage === 'INTERVIEW' ? (
        <>
          <Title>Your subject tests</Title>
          {a.subjects.map((s) => {
            const pill = TEST_PILL[s.testStatus];
            const canStart = (s.testStatus === 'NOT_STARTED' || s.testStatus === 'IN_PROGRESS' || (s.testStatus === 'FAILED' && !s.retakeAt));
            return (
              <Card key={`${s.subject}-${s.level}`} className="gap-3">
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-1 gap-0.5">
                    <Label>{s.subject}</Label>
                    <Caption>{levelLabel(catalog.data, s.level)}</Caption>
                  </View>
                  <Pill label={s.score != null && s.testStatus !== 'IN_PROGRESS' ? `${pill.label} · ${percent(s.score)}` : pill.label} tone={pill.tone} />
                </View>
                {s.retakeAt ? <Caption>You can retake this test from {new Date(s.retakeAt).toDateString()}.</Caption> : null}
                {s.testStatus === 'NO_TEST_YET' ? <Caption>We’re writing this test now. We’ll message you when it’s ready.</Caption> : null}
                {canStart ? (
                  <GameButton
                    label={s.testStatus === 'IN_PROGRESS' ? 'Continue test' : s.testStatus === 'FAILED' ? 'Retake test' : 'Start test'}
                    size="md"
                    color={theme.accent}
                    shadowColor={theme.shadow}
                    onPress={() =>
                      Alert.alert('Ready?', '20 minutes, multiple choice. Find a quiet spot. The timer keeps running if you leave the app, and leaving is noted for our reviewers.', [
                        { text: 'Not yet', style: 'cancel' },
                        { text: 'Start', onPress: () => router.push({ pathname: '/tutor/test', params: { subject: s.subject, level: s.level } }) },
                      ])
                    }
                  />
                ) : null}
              </Card>
            );
          })}
          <Body accessibilityRole="link" onPress={() => router.push('/tutor/profile-form')} className="py-2 text-center font-body-bold text-coral-700">Add or change subjects</Body>
        </>
      ) : null}
    </>
  );
}

function Dashboard({ application }: { application: TutorApplication }) {
  const bookings = useTutorBookings();
  const earnings = useEarnings();
  const respond = useBookingAction();
  const availability = useAvailability();
  const pending = bookings.data?.filter((b) => b.status === 'PENDING') ?? [];
  const active = bookings.data?.filter((b) => b.status === 'ACTIVE') ?? [];

  return (
    <>
      <Card className="gap-1">
        <SwitchRow
          label="Accepting new students"
          description="Turn off when you’re full. Existing students aren’t affected."
          value={application.profile.isAcceptingStudents}
          accent={theme.accent}
          onChange={(v) => availability.mutate(v, { onError: (e) => toast.error(friendlyError(e)) })}
        />
      </Card>

      <PressableScale onPress={() => router.push('/tutor/earnings')} accessibilityLabel="Earnings" style={{ backgroundColor: '#2A1710', borderRadius: 24, padding: 18, gap: 4 }}>
        <Text className="font-body-semibold text-[13px]" style={{ color: '#FFC7B5' }}>Available earnings</Text>
        <Text className="font-display text-[32px] text-white">{earnings.data ? naira(earnings.data.balanceKobo) : '—'}</Text>
        <Text className="font-body text-[13px]" style={{ color: '#FFE7DF' }}>
          {earnings.data && Number(earnings.data.pendingKobo) > 0 ? `${naira(earnings.data.pendingKobo)} on the way after ${earnings.data.pendingLessons} ${earnings.data.pendingLessons === 1 ? 'lesson' : 'lessons'}` : 'Paid after each lesson’s quiz'}
        </Text>
      </PressableScale>

      {bookings.isPending ? (
        <CardListSkeleton count={2} height={100} />
      ) : bookings.isError ? (
        <ErrorState error={bookings.error} onRetry={bookings.refetch} color={theme.accent} />
      ) : (
        <>
          {pending.length ? <Title>New requests</Title> : null}
          {pending.map((b) => (
            <Card key={b.id} className="gap-3">
              <View className="gap-1">
                <Label>{b.student.firstName} · {b.subject}</Label>
                <Caption>{b.student.grade}{b.area ? ` · ${b.area}` : ''}{b.days.length ? ` · ${b.days.join(', ')}` : ''}</Caption>
                {b.goals ? <Body className="text-[14px] text-ink-700">“{b.goals}”</Body> : null}
              </View>
              <View className="flex-row gap-2">
                <View className="flex-1"><GameButton label="Decline" size="md" variant="outline" onPress={() => respond.mutate({ bookingId: b.id, action: 'decline' })} /></View>
                <View className="flex-[2]">
                  <GameButton label="Accept" size="md" color={theme.accent} shadowColor={theme.shadow} loading={respond.isPending && respond.variables?.bookingId === b.id} onPress={() => respond.mutate({ bookingId: b.id, action: 'accept' }, { onSuccess: () => { toast.success('Accepted. Now schedule the free trial.'); router.push({ pathname: '/tutor/booking/[id]', params: { id: b.id } }); } })} />
                </View>
              </View>
            </Card>
          ))}

          <Title>Your students</Title>
          {active.length === 0 ? (
            <EmptyState icon="people-outline" title="No students yet" message="When a parent picks you, their request appears above. Parents see your subject-test score and reviews." />
          ) : (
            active.map((b) => {
              const next = b.sessions.find((s) => s.status === 'SCHEDULED');
              return (
                <PressableScale key={b.id} onPress={() => router.push({ pathname: '/tutor/booking/[id]', params: { id: b.id } })} accessibilityLabel={`${b.student.firstName}, ${b.subject}`} style={{ backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Avatar initials={b.student.firstName.slice(0, 2).toUpperCase()} size={48} />
                  <View className="flex-1 gap-0.5">
                    <Label>{b.student.firstName} · {b.subject}</Label>
                    <Caption>{next ? `Next: ${new Date(next.scheduledAt).toLocaleString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}` : 'No lesson scheduled'}</Caption>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={palette.ink[300]} />
                </PressableScale>
              );
            })
          )}
        </>
      )}
    </>
  );
}
