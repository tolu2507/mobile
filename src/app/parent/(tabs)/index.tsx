import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { toast } from '@/components/reacticx/molecules/Toast';
import { Caption, Card, CardListSkeleton, Display, EmptyState, ErrorState, GameButton, Label, PressableScale, ProgressBar, Screen } from '@/components/ui';
import { usePrivacy, useSetConsent } from '@/features/me/api';
import { useChildren, useLatestReport } from '@/features/parent/api';
import { ChildSwitcher, useCurrentChild } from '@/features/parent/components/ChildSwitcher';
import { PendingChildren } from '@/features/parent/components/PendingChildren';
import { friendlyError } from '@/lib/api';
import { palette, roles } from '@/theme';

const theme = roles.parent;
const scoreColor = (s: number) => (s >= 70 ? palette.mint[400] : s >= 55 ? palette.sun[400] : palette.amber[500]);

export default function ParentReports() {
  const children = useChildren();
  const child = useCurrentChild();
  const report = useLatestReport(child?.id);
  const r = report.data;
  const privacy = usePrivacy();
  const setConsent = useSetConsent();
  const reportsOn = privacy.data?.children.find((c) => c.studentId === child?.id)?.consents.AI_REPORTS;

  return (
    <Screen background={theme.bg} accent={theme.accent} refreshing={report.isRefetching || children.isRefetching} onRefresh={() => { children.refetch(); report.refetch(); }}>
      <View className="flex-row items-center justify-between">
        <Display className="text-[26px]">Weekly report</Display>
        <PressableScale accessibilityLabel="Add a child" onPress={() => router.push('/parent/children/new')} style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="person-add-outline" size={21} color={palette.ink.DEFAULT} />
        </PressableScale>
      </View>

      <PendingChildren />

      <ChildSwitcher />

      {children.isPending ? (
        <CardListSkeleton count={3} height={110} />
      ) : children.isError ? (
        <ErrorState error={children.error} onRetry={children.refetch} color={theme.accent} />
      ) : children.data.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Add your first child"
          message="Create a login for your child in under a minute. No school needed: they can start learning today, and you’ll get a report every Friday."
          action={<GameButton label="Add a child" color={theme.accent} shadowColor={theme.shadow} className="mt-2 self-stretch" onPress={() => router.push('/parent/children/new')} />}
        />
      ) : report.isPending ? (
        <CardListSkeleton count={4} height={110} />
      ) : report.isError ? (
        <ErrorState error={report.error} onRetry={report.refetch} color={theme.accent} />
      ) : !r && reportsOn === false ? (
        <EmptyState
          icon="sparkles-outline"
          title="Switch on weekly reports"
          message={`Every Friday, Nexus AI writes a short report on how ${child?.firstName} did, from their real attendance, scores and teacher notes. Only you see it.`}
          action={
            <GameButton
              label="Switch on reports"
              color={theme.accent}
              shadowColor={theme.shadow}
              className="mt-2 self-stretch"
              loading={setConsent.isPending}
              onPress={() =>
                setConsent.mutate(
                  { studentId: child!.id, type: 'AI_REPORTS', granted: true },
                  {
                    onSuccess: () => {
                      toast.success('Weekly reports are on');
                      report.refetch();
                    },
                    onError: (e) => toast.error(friendlyError(e)),
                  },
                )
              }
            />
          }
        />
      ) : !r ? (
        <EmptyState
          icon="sparkles-outline"
          title={`Nothing to report yet`}
          message={`When ${child?.firstName} finishes a quest or a lesson quiz, their report appears here. Ask them to sign in with username “${child?.username}” and their PIN.`}
        />
      ) : (
        <>
          <Animated.View entering={FadeInDown.springify().damping(16)} style={{ backgroundColor: '#12302B', borderRadius: 24, padding: 18, gap: 14 }}>
            <Text className="font-body-semibold text-[13px]" style={{ color: '#9FE3D2' }}>
              {r.isThisWeek ? 'This week so far' : r.weekLabel} · {r.writtenBy === 'ai' ? 'written by Nexus AI from real scores' : 'from real scores'}
            </Text>
            <Text className="font-display-bold text-[21px] leading-[27px] text-white">{r.headline}</Text>
            {r.summary ? <Text className="font-body text-[14px] leading-[21px]" style={{ color: '#D7F1EA' }}>{r.summary}</Text> : null}
            <View className="flex-row gap-2">
              {[
                ...(r.attendance ? [{ value: `${r.attendance.present}/${r.attendance.total}`, label: 'days present' }] : []),
                { value: `+${r.xpEarned}`, label: 'XP earned' },
                { value: `${r.streak}`, label: 'day streak' },
              ].map((s) => (
                <View key={s.label} accessibilityLabel={`${s.value} ${s.label}`} className="flex-1 gap-0.5 rounded-2xl bg-white/10 p-2.5">
                  <Text className="font-display text-[22px] text-white">{s.value}</Text>
                  <Text className="font-body text-[12px]" style={{ color: '#C6E9E0' }}>{s.label}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {r.subjects.length ? (
            <Card className="gap-3">
              <Label>Scores by subject</Label>
              {r.subjects.map((s) => (
                <View key={s.name} className="flex-row items-center gap-2.5">
                  <Text numberOfLines={1} className="w-[100px] font-body text-[14px] text-ink">{s.name}</Text>
                  <View className="flex-1"><ProgressBar value={s.score / 100} color={scoreColor(s.score)} track="#E6F0ED" accessibilityLabel={`${s.name} score`} /></View>
                  <Text style={{ color: s.score < 55 ? palette.amber[700] : palette.ink.DEFAULT }} className="w-9 text-right font-body-bold text-[14px]">{s.score}</Text>
                </View>
              ))}
            </Card>
          ) : null}

          {r.lessons.length ? (
            <Card className="gap-2">
              <Label>Lessons this week</Label>
              {r.lessons.map((l, i) => (
                <View key={i} className="flex-row items-center justify-between gap-3">
                  <Caption className="flex-1 text-[14px]" numberOfLines={2}>{l.subject}: {l.topics.join(', ')}</Caption>
                  <Text className="font-body-bold text-[14px] text-ink">{l.quizScore != null ? `Quiz ${l.quizScore}%` : 'Quiz pending'}</Text>
                </View>
              ))}
            </Card>
          ) : null}

          <View className="gap-2 rounded-[22px] bg-amber-50 p-4">
            <View className="flex-row items-center gap-2">
              <Ionicons name="bulb-outline" size={20} color={palette.amber[700]} />
              <Text className="font-body-bold text-[15px] text-amber-800">How you can help at home</Text>
            </View>
            <Text className="font-body text-[14px] leading-[21px]" style={{ color: '#4A2A05' }}>{r.homeTip}</Text>
          </View>

        </>
      )}
    </Screen>
  );
}
