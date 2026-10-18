import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Banner, Caption, CardListSkeleton, EmptyState, ErrorState, GameButton, Label, PressableScale, Screen, ScreenHeader } from '@/components/ui';
import { useMocks, useStartMock } from '@/features/mocks/api';
import { countdown, lagosWhen, ordinal } from '@/features/mocks/format';
import { isPrimary, useStudentHome } from '@/features/student/api';
import { friendlyError } from '@/lib/api';
import { useNow } from '@/lib/useNow';
import { palette, roles, type RoleTheme } from '@/theme';
import type { MockSummary, UpcomingMock } from '@/types/api';
import { confirm } from '@/lib/confirm';

/** Friday mocks: this week's paper for each exam, and past results. */
export default function MocksScreen() {
  const theme = isPrimary(useStudentHome().data) ? roles.studentPrimary : roles.student;
  const mocks = useMocks();

  return (
    <Screen background={theme.bg} edges={['top', 'bottom']} refreshing={mocks.isRefetching} onRefresh={() => void mocks.refetch()} accent={theme.accent}>
      <ScreenHeader title="Friday mock" subtitle="A full paper in the real exam format, every Friday from 4pm to 9pm. Everyone writes in the same window, so your rank is real." />
      {mocks.isPending ? (
        <CardListSkeleton count={3} height={120} />
      ) : mocks.isError ? (
        <ErrorState error={mocks.error} onRetry={() => void mocks.refetch()} color={theme.accent} />
      ) : !mocks.data.upcoming.length && !mocks.data.past.length ? (
        <EmptyState
          icon="calendar-outline"
          title="No Friday mock for you yet"
          message="Friday mocks are for JAMB, BECE and Common Entrance. Add one of those exams and pick your subjects."
          action={<GameButton label="Set up exam prep" className="mt-2 self-stretch" color={theme.accent} shadowColor={theme.shadow} onPress={() => router.push('/student/exams')} />}
        />
      ) : (
        <>
          {mocks.data.upcoming.map((m) => (
            <MockCard key={m.id} m={m} theme={theme} />
          ))}
          {mocks.data.past.length ? (
            <View className="gap-2.5">
              <Text className="font-display text-[20px] text-ink">Past results</Text>
              {mocks.data.past.map((s) => (
                <PastRow key={s.sittingId} s={s} />
              ))}
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function MockCard({ m, theme }: { m: UpcomingMock; theme: RoleTheme }) {
  const start = useStartMock();
  const now = useNow();
  const questions = m.subjects.reduce((sum, s) => sum + s.available, 0); // what's really on the paper
  const minutesLeft = Math.floor((new Date(m.closesAt).getTime() - now) / 60_000);
  const short = m.subjects.filter((s) => s.available < s.needed);
  const missing = m.subjects.filter((s) => s.available === 0);
  const open = () => m.sitting && router.push({ pathname: '/student/mocks/sitting/[id]', params: { id: m.sitting.id } });

  const begin = async () => {
    const time = Math.min(m.durationMinutes, minutesLeft);
    const yes = await confirm({
      title: 'Start the mock?',
      message: `You’ll have ${time} minutes${time < m.durationMinutes ? ' (the window closes at 9pm)' : ''}. The clock keeps running if you leave the app, and your answers are saved as you go.`,
      confirmLabel: 'Start',
      cancelLabel: 'Not yet',
    });
    if (yes) start.mutate(m.id, { onSuccess: (r) => router.push({ pathname: '/student/mocks/sitting/[id]', params: { id: r.sittingId } }) });
  };

  return (
    <View className="gap-3 rounded-[22px] bg-white p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: m.state === 'OPEN' ? palette.coral[500] : palette.coral[50] }}>
          <MaterialCommunityIcons name="timer-outline" size={24} color={m.state === 'OPEN' ? '#FFFFFF' : palette.coral[500]} />
        </View>
        <View className="flex-1">
          <Label>{m.title}</Label>
          <Caption>
            {m.subjects.length} subjects · {questions} questions · {m.durationMinutes} minutes · out of {m.outOf}
          </Caption>
        </View>
      </View>

      <View className="gap-1">
        {m.subjects.map((s) => (
          <View key={s.id} className="flex-row items-center justify-between">
            <Caption className="text-[14px] text-ink">{s.name}</Caption>
            <Caption className={s.available < s.needed ? 'text-amber-700' : ''}>
              {s.available < s.needed ? `${s.available} of ${s.needed} questions ready` : `${s.needed} questions`}
            </Caption>
          </View>
        ))}
      </View>

      {missing.length ? (
        <Banner tone="tip" message={`We’re still writing questions for ${missing.map((s) => s.name).join(' and ')}, so this mock can’t start yet.`} />
      ) : short.length ? (
        <Caption className="text-[13px]">Some subjects are shorter than the real exam for now. Each subject is still scored out of 100.</Caption>
      ) : null}

      {start.isError ? <Banner tone="error" message={friendlyError(start.error)} /> : null}

      {m.state === 'UPCOMING' ? (
        <View className="flex-row items-center gap-2 rounded-2xl p-3" style={{ backgroundColor: theme.accentSoft }}>
          <Ionicons name="calendar-outline" size={18} color={theme.accent} />
          <Text className="flex-1 font-body-semibold text-[14px] text-ink">
            Opens {lagosWhen(m.opensAt)} · in {countdown(new Date(m.opensAt).getTime() - now)}
          </Text>
        </View>
      ) : m.state === 'OPEN' && !m.sitting ? (
        <GameButton label="Start mock" color={palette.coral[500]} shadowColor={palette.coral[700]} size="lg" disabled={!m.ready} loading={start.isPending} onPress={begin} />
      ) : m.state === 'OPEN' && m.sitting && !m.sitting.submitted ? (
        <GameButton label={`Continue · ${countdown(new Date(m.sitting.deadlineAt).getTime() - now)} left`} color={palette.coral[500]} shadowColor={palette.coral[700]} size="lg" onPress={open} />
      ) : m.sitting ? (
        <GameButton label="See your score" variant="outline" onPress={() => router.push({ pathname: '/student/mocks/result/[id]', params: { id: m.sitting!.id } })} />
      ) : (
        <Caption className="text-[14px]">This window has closed. Results come out shortly.</Caption>
      )}
    </View>
  );
}

function PastRow({ s }: { s: MockSummary }) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`${s.title}: ${s.score} out of ${s.outOf}`}
      onPress={() => router.push({ pathname: '/student/mocks/result/[id]', params: { id: s.sittingId } })}
      style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
    >
      <View className="flex-1">
        <Label className="text-[15px]">{s.title}</Label>
        <Caption>{s.resultsOut && s.nationalRank ? `${ordinal(s.nationalRank)} of ${s.sat.toLocaleString()}` : 'Rank at 9pm'}</Caption>
      </View>
      <Text className="font-display text-[20px] text-ink">
        {s.score}
        <Text className="text-[14px] text-ink-500">/{s.outOf}</Text>
      </Text>
      <Ionicons name="chevron-forward" size={18} color={palette.ink[300]} />
    </PressableScale>
  );
}
