import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Text, View } from 'react-native';

import { toast } from '@/components/reacticx/molecules/Toast';
import { Banner, Caption, Card, CardListSkeleton, ChipGroup, DateTimeField, EmptyState, GameButton, Label, Pill, PressableScale, Screen, ScreenHeader, TextField, Title } from '@/components/ui';
import { useCompleteLesson, useScheduleLesson, useTutorBookings } from '@/features/tutor/api';
import { friendlyError } from '@/lib/api';
import { naira } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { palette, roles } from '@/theme';
import type { LessonSession } from '@/types/api';

const theme = roles.tutor;
const when = (iso: string) => new Date(iso).toLocaleString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const tomorrow4pm = () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(16, 0, 0, 0); return d; };

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookings = useTutorBookings();
  const booking = bookings.data?.find((b) => b.id === id);
  const schedule = useScheduleLesson(id);
  const [at, setAt] = useState(tomorrow4pm);
  const [duration, setDuration] = useState('60');

  if (bookings.isPending) return <Screen background={theme.bg}><CardListSkeleton count={3} height={100} /></Screen>;
  if (!booking) return <Screen background={theme.bg}><ScreenHeader title="Student" /><EmptyState title="Not found" message="This booking has ended or isn’t yours." /></Screen>;

  const isFirst = booking.sessions.length === 0;
  return (
    <Screen background={theme.bg} edges={['top', 'bottom']} accent={theme.accent} refreshing={bookings.isRefetching} onRefresh={bookings.refetch}>
      <ScreenHeader title={`${booking.student.firstName} · ${booking.subject}`} subtitle={`${booking.student.grade}${booking.area ? ` · ${booking.area}` : ''}${booking.days.length ? ` · prefers ${booking.days.join(', ')}` : ''}`} />
      {booking.goals ? <Banner tone="tip" title="Parent’s goal" message={booking.goals} /> : null}
      {booking.parent.phone ? (
        <PressableScale onPress={() => Linking.openURL(`tel:${booking.parent.phone}`)} accessibilityLabel={`Call ${booking.parent.firstName}`} style={{ backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="call-outline" size={22} color={theme.accent} />
          <Text className="flex-1 font-body-bold text-[15px] text-ink">Call {booking.parent.firstName} (parent)</Text>
          <Text className="font-body text-[14px] text-ink-500">{booking.parent.phone}</Text>
        </PressableScale>
      ) : null}

      <Card className="gap-3">
        <Title>{isFirst ? 'Schedule the free trial' : 'Schedule a lesson'}</Title>
        <DateTimeField label="When" value={at} onChange={setAt} accent={theme.accent} />
        <ChipGroup label="Length" accent={theme.accent} value={duration} onChange={setDuration} options={[{ value: '45', label: '45 min' }, { value: '60', label: '1 hour' }, { value: '90', label: '1½ hours' }, { value: '120', label: '2 hours' }]} />
        <Caption className="text-[13px]">{isFirst ? 'The first lesson is free for the family. Paid lessons start after it.' : 'The parent pays into escrow before the lesson. You’re paid when the student finishes the lesson quiz.'}</Caption>
        <GameButton
          label="Add to schedule"
          size="md"
          color={theme.accent}
          shadowColor={theme.shadow}
          loading={schedule.isPending}
          onPress={() => schedule.mutate({ scheduledAt: at.toISOString(), durationMinutes: Number(duration) }, { onSuccess: (s) => toast.success(s.isTrial ? 'Free trial scheduled' : 'Lesson scheduled. The parent has been asked to pay.'), onError: (e) => toast.error(friendlyError(e)) })}
        />
      </Card>

      <Title>Lessons</Title>
      {booking.sessions.length === 0 ? <Caption className="text-[14px]">No lessons yet.</Caption> : [...booking.sessions].reverse().map((s) => <SessionCard key={s.id} session={s} />)}
    </Screen>
  );
}

function SessionCard({ session: s }: { session: LessonSession }) {
  const complete = useCompleteLesson();
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const now = useNow();
  const started = new Date(s.scheduledAt).getTime() <= now;
  const canComplete = s.status === 'SCHEDULED' && started && (s.escrowStatus === 'HELD' || s.escrowStatus === 'FREE');

  const pill = (() => {
    if (s.status === 'COMPLETED') {
      if (s.escrowStatus === 'RELEASED') return <Pill label={`Paid ${naira(s.tutorFeeKobo ?? '0')}`} tone="mint" />;
      if (s.escrowStatus === 'FREE') return <Pill label="Free trial done" tone="mint" />;
      if (s.escrowStatus === 'DISPUTED') return <Pill label="Under review" tone="coral" />;
      return <Pill label="Waiting for quiz" tone="sky" />;
    }
    if (s.escrowStatus === 'UNPAID') return <Pill label="Waiting for payment" tone="amber" />;
    if (s.escrowStatus === 'FREE') return <Pill label="Free trial" tone="violet" />;
    return <Pill label="Paid · in escrow" tone="sky" />;
  })();

  const addTopic = () => {
    const t = topic.trim();
    if (t.length >= 2 && !topics.includes(t) && topics.length < 6) setTopics([...topics, t]);
    setTopic('');
  };

  return (
    <Card className="gap-3">
      <View className="flex-row items-center justify-between gap-2">
        <Label className="flex-1">{when(s.scheduledAt)} · {s.durationMinutes} min</Label>
        {pill}
      </View>
      {s.quiz ? <Caption>Lesson quiz: {s.quiz.status === 'COMPLETED' ? `${Math.round((s.quiz.score ?? 0) * 100)}%` : 'waiting for the student'}</Caption> : null}
      {s.escrowStatus === 'UNPAID' && !started ? <Caption>The parent will pay before the lesson. You’ll see “Paid · in escrow” here.</Caption> : null}

      {canComplete && !open ? <GameButton label="Mark as done" size="md" color={theme.accent} shadowColor={theme.shadow} onPress={() => setOpen(true)} /> : null}
      {open ? (
        <View className="gap-3">
          <Text className="font-body-bold text-[14px] text-ink">What did you cover?</Text>
          <View className="flex-row gap-2">
            <View className="flex-1"><TextField label="Topic" value={topic} onChangeText={setTopic} onSubmitEditing={addTopic} returnKeyType="done" placeholder="e.g. Acid-base titration" accent={theme.accent} /></View>
            <View className="justify-end pb-0.5"><GameButton label="Add" size="md" variant="outline" onPress={addTopic} /></View>
          </View>
          {topics.length ? (
            <View className="flex-row flex-wrap gap-2">
              {topics.map((t) => (
                <PressableScale key={t} accessibilityLabel={`Remove ${t}`} onPress={() => setTopics(topics.filter((x) => x !== t))} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: palette.coral[100], borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
                  <Text className="font-body-bold text-[13px] text-coral-700">{t}</Text>
                  <Ionicons name="close" size={14} color={palette.coral[700]} />
                </PressableScale>
              ))}
            </View>
          ) : null}
          <TextField label="Notes for the parent (optional)" value={notes} onChangeText={setNotes} multiline accent={theme.accent} style={{ height: 80 }} />
          <Caption className="text-[13px]">We’ll send the student a 5-question quiz on these topics. When they finish it, you get paid.</Caption>
          <GameButton
            label="Finish lesson"
            size="md"
            color={theme.accent}
            shadowColor={theme.shadow}
            disabled={topics.length === 0}
            loading={complete.isPending}
            onPress={() =>
              complete.mutate(
                { sessionId: s.id, topics, notes: notes.trim() || undefined },
                {
                  onSuccess: (r) => { setOpen(false); toast.success(r.quizCreated ? 'Done! Quiz sent to your student.' : 'Done! The parent will confirm the lesson.'); },
                  onError: (e) => toast.error(friendlyError(e)),
                },
              )
            }
          />
        </View>
      ) : null}
    </Card>
  );
}
