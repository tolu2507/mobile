import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Flame } from '@/components/game';
import { Caption, Card, CardListSkeleton, ErrorState, Label, Pill, PressableScale, ProgressBar, Title } from '@/components/ui';
import { lagosWhen, ordinal } from '@/features/mocks/format';
import { palette, type RoleTheme } from '@/theme';
import type { ChildMock, ChildProgress as Progress } from '@/types/api';
import { useChildProgress } from '../api';

const pct = (x: number) => Math.round(x * 100);

/** A child's progress for their parent: this week, Friday mocks, subjects, and the topics to work on. */
export function ChildProgress({ studentId, name, theme }: { studentId: string; name: string; theme: RoleTheme }) {
  const q = useChildProgress(studentId);
  if (q.isPending) return <CardListSkeleton count={3} height={120} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => void q.refetch()} color={theme.accent} />;
  const p = q.data;
  const started = p.subjects.some((s) => s.answered > 0) || p.mocks.length > 0;

  if (p.locked) {
    return (
      <View className="gap-4">
        <Card className="gap-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="pause-circle-outline" size={22} color={palette.coral[700]} />
            <Title>Progress is on the paid plan</Title>
          </View>
          <Caption className="text-[14px]">You’re on the free plan, so {name}’s progress and weekly report are hidden. Nothing is lost: it all comes back when you upgrade.</Caption>
          <PressableScale accessibilityRole="button" onPress={() => router.push('/parent/plan')} style={{ backgroundColor: theme.accent, borderRadius: 16, paddingVertical: 13, alignItems: 'center' }}>
            <Text className="font-body-bold text-[15px] text-white">See plan</Text>
          </PressableScale>
        </Card>
        {p.mocks.length ? <Mocks mocks={p.mocks} theme={theme} /> : null}
      </View>
    );
  }

  return (
    <View className="gap-4">
      <ThisWeek p={p} name={name} theme={theme} />

      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`Open ${name}’s weekly report`}
        onPress={() => router.push({ pathname: '/parent/children/[id]/report', params: { id: studentId } })}
        style={{ backgroundColor: '#12302B', borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <Ionicons name="sparkles" size={22} color="#9FE3D2" />
        <View className="flex-1">
          <Text className="font-body-bold text-[15px] text-white">Weekly report</Text>
          <Text className="font-body text-[13px]" style={{ color: '#C6E9E0' }}>
            What went well, what to fix, and how to help at home
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9FE3D2" />
      </PressableScale>

      {p.mocks.length ? <Mocks mocks={p.mocks} theme={theme} /> : null}

      {p.weakTopics.length ? (
        <Card className="gap-3">
          <View className="flex-row items-center gap-2">
            <Ionicons name="construct-outline" size={20} color={palette.amber[700]} />
            <Title>Needs work</Title>
          </View>
          {p.weakTopics.map((t) => (
            <View key={t.topicId} className="gap-1.5 rounded-2xl bg-amber-50 p-3">
              <Label className="text-[15px] leading-[20px]">{t.topic}</Label>
              <Caption>
                {t.subject} · {pct(t.accuracy)}% right over {t.answered} questions
              </Caption>
              {t.everyPaper ? <Pill tone="coral" label="Comes up in every paper we studied" icon={<Ionicons name="flame" size={13} color={palette.coral[700]} />} /> : null}
            </View>
          ))}
          <Caption className="text-[14px]">Ask {name} to open these topics in Practice. Wrong answers come back as reviews until they get them right.</Caption>
        </Card>
      ) : null}

      {p.strongTopics.length ? (
        <Card className="gap-2">
          <View className="flex-row items-center gap-2">
            <Ionicons name="trophy-outline" size={20} color={palette.mint[800]} />
            <Title>Strong at</Title>
          </View>
          {p.strongTopics.map((t) => (
            <View key={t.topicId} className="flex-row items-center justify-between gap-3">
              <Caption className="flex-1 text-[14px] text-ink" numberOfLines={2}>
                {t.topic}
              </Caption>
              <Text className="font-body-bold text-[14px] text-mint-800">{pct(t.accuracy)}%</Text>
            </View>
          ))}
        </Card>
      ) : null}

      {p.subjects.length ? (
        <Card className="gap-3">
          <Title>Subjects</Title>
          {p.subjects.map((s) => (
            <View key={s.id} className="gap-1.5">
              <View className="flex-row items-baseline justify-between gap-2">
                <Label className="flex-1 text-[15px]" numberOfLines={1}>
                  {s.name}
                </Label>
                <Text className="font-body-bold text-[14px] text-ink">{pct(s.mastery)}% mastered</Text>
              </View>
              <ProgressBar value={s.mastery} color={theme.accent} height={8} accessibilityLabel={`${s.name}: ${pct(s.mastery)}% mastered`} />
              <Caption>
                {s.topics ? `${s.started} of ${s.topics} ${s.topics === 1 ? 'topic' : 'topics'} started` : 'Topics coming soon'}
                {s.conquered ? ` · ${s.conquered} conquered` : ''}
                {s.accuracy != null ? ` · ${pct(s.accuracy)}% right` : ''}
              </Caption>
            </View>
          ))}
        </Card>
      ) : null}

      {!started ? (
        <View className="flex-row gap-3 rounded-[22px] bg-white p-4">
          <Ionicons name="hourglass-outline" size={22} color={palette.ink[500]} />
          <Caption className="flex-1 text-[14px]">
            {p.subjects.length
              ? `Nothing here yet. Once ${name} starts practising, you’ll see their strong and weak topics and their Friday mock scores.`
              : `Set up ${name}’s exam prep below, then their practice and Friday mock scores will show here.`}
          </Caption>
        </View>
      ) : null}
    </View>
  );
}

function ThisWeek({ p, name, theme }: { p: Progress; name: string; theme: RoleTheme }) {
  const w = p.week;
  if (!w) return null;
  const diff = w.xp - w.lastWeekXp;
  return (
    <Card className="gap-3">
      <View className="flex-row items-center justify-between">
        <Title>This week</Title>
        <View accessibilityLabel={`${p.streak} day streak, best ${p.longestStreak}`} className="flex-row items-center gap-1.5">
          <Flame size={18} alive={p.streak > 0} />
          <Text className="font-body-bold text-[14px] text-ink">
            {p.streak} day streak
          </Text>
          <Caption> · best {p.longestStreak}</Caption>
        </View>
      </View>
      <View className="flex-row gap-2">
        <Box value={String(w.questions)} label="questions" />
        <Box value={w.questions ? `${pct(w.correct / w.questions)}%` : '–'} label="right" />
        <Box value={`${w.activeDays}/7`} label="days" />
      </View>
      <Caption className="text-[14px]">
        {w.xp === 0 && w.lastWeekXp === 0
          ? `${name} hasn’t earned any XP yet.`
          : diff > 0
            ? `${w.xp} XP this week, ${diff} more than last week. Tell ${name} you noticed!`
            : diff < 0
              ? `${w.xp} XP this week, ${-diff} less than last week.`
              : `${w.xp} XP this week, same as last week.`}
      </Caption>
      {p.nextMock ? (
        <View className="flex-row items-center gap-2 rounded-2xl p-3" style={{ backgroundColor: theme.accentSoft }}>
          <Ionicons name="calendar-outline" size={18} color={theme.accent} />
          <Caption className="flex-1 text-[14px] text-ink">
            {p.nextMock.state === 'OPEN'
              ? p.nextMock.taken
                ? `${name} has sat this week’s mock. Results at 9pm.`
                : `This week’s mock is open until ${lagosWhen(p.nextMock.closesAt, false)}.`
              : `Next Friday mock: ${lagosWhen(p.nextMock.opensAt)}.`}
          </Caption>
        </View>
      ) : null}
    </Card>
  );
}

/** Recent Friday mocks as bars (oldest left) with the latest result spelled out. */
function Mocks({ mocks, theme }: { mocks: ChildMock[]; theme: RoleTheme }) {
  const latest = mocks[0];
  const series = [...mocks].reverse();
  return (
    <Card className="gap-3">
      <Title>Friday mocks</Title>
      <View className="gap-0.5">
        <Text className="font-display text-[28px] text-ink">
          {latest.score}
          <Text className="font-display text-[18px] text-ink-500">/{latest.outOf}</Text>
        </Text>
        <Caption>
          {latest.title}
          {latest.rank && latest.sat ? ` · ${ordinal(latest.rank)} of ${latest.sat.toLocaleString()}${latest.sat > 1 ? ` · better than ${Math.round(latest.percentile ?? 0)}%` : ''}` : ' · rank at 9pm'}
        </Caption>
      </View>
      {series.length > 1 ? (
        <View accessibilityLabel={`Last ${series.length} mock scores: ${series.map((m) => m.score).join(', ')}`} className="h-[84px] flex-row items-end gap-2">
          {series.map((m, i) => {
            const share = m.outOf ? (m.score ?? 0) / m.outOf : 0;
            return (
              <View key={i} className="flex-1 items-center gap-1">
                <View style={{ height: Math.max(4, share * 64), width: '100%', borderRadius: 6, backgroundColor: i === series.length - 1 ? theme.accent : theme.accentSoft }} />
                <Text className="font-body text-[11px] text-ink-500">{m.score}</Text>
              </View>
            );
          })}
        </View>
      ) : null}
      {latest.subjects.length ? (
        <View className="gap-2">
          {latest.subjects.map((s) => (
            <View key={s.name} className="flex-row items-center gap-2.5">
              <Text numberOfLines={1} className="w-[110px] font-body text-[14px] text-ink">
                {s.name}
              </Text>
              <View className="flex-1">
                <ProgressBar value={s.score / 100} color={s.score >= 60 ? palette.mint[400] : s.score >= 45 ? palette.sun[400] : palette.amber[500]} height={8} accessibilityLabel={`${s.name} ${s.score} of 100`} />
              </View>
              <Text className="w-9 text-right font-body-bold text-[14px] text-ink">{s.score}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

function Box({ value, label }: { value: string; label: string }) {
  return (
    <View accessibilityLabel={`${value} ${label}`} className="flex-1 gap-0.5 rounded-2xl bg-paper p-2.5">
      <Text className="font-display text-[20px] text-ink">{value}</Text>
      <Text className="font-body text-[12px] text-ink-500">{label}</Text>
    </View>
  );
}
