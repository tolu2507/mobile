import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { toast } from '@/components/reacticx/molecules/Toast';
import { VerifiedBadge } from '@/components/reacticx/pieces/verified-badge';
import { Avatar, Body, Caption, Card, CardListSkeleton, Display, EmptyState, ErrorState, GameButton, Label, Pill, PressableScale, Screen, Title } from '@/components/ui';
import { useBook, useChildren, useParentBookings, useTutorMatches, useTutorRequest } from '@/features/parent/api';
import { ChildSwitcher, useCurrentChild } from '@/features/parent/components/ChildSwitcher';
import { LessonRow } from '@/features/parent/components/LessonRow';
import { friendlyError } from '@/lib/api';
import { naira, percent } from '@/lib/format';
import { fonts, palette, roles } from '@/theme';
import type { TutorMatch } from '@/types/api';

const theme = roles.parent;
const modeLabel = { IN_PERSON: 'Home lessons', ONLINE: 'Online', BOTH: 'Home or online' } as const;

function NexusApproved() {
  return (
    <VerifiedBadge palette={{ surface: '#F1EDFF', border: '#E4DEFF', name: '#4426C9', check: palette.violet[500], checkMark: '#FFFFFF' }} radius={999}>
      <VerifiedBadge.Name style={{ fontFamily: fonts.bodyBold, fontSize: 12 }}>Nexus approved</VerifiedBadge.Name>
      <VerifiedBadge.Check size={14} />
    </VerifiedBadge>
  );
}

function MatchCard({ match, expanded, onToggle, onBook, booking }: { match: TutorMatch; expanded: boolean; onToggle: () => void; onBook: () => void; booking: boolean }) {
  const booked = match.status === 'BOOKED';
  return (
    <Animated.View layout={LinearTransition.springify().damping(18)}>
      <PressableScale
        onPress={onToggle}
        scaleTo={0.99}
        accessibilityState={{ expanded }}
        accessibilityLabel={`${match.name}, ${percent(match.matchScore)} match`}
        style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, gap: 14, borderWidth: 2, borderColor: expanded ? theme.accent : 'transparent' }}
      >
        <View className="flex-row items-center gap-3">
          <Avatar initials={match.initials} size={54} radius={18} />
          <View className="flex-1 gap-0.5">
            <Label>{match.name}</Label>
            <Caption numberOfLines={1}>{match.headline}</Caption>
          </View>
          <View className="items-end">
            <Text className="font-display text-[22px] text-mint-700">{percent(match.matchScore)}</Text>
            <Caption className="text-[12px]">match</Caption>
          </View>
        </View>
        {expanded ? (
          <Animated.View entering={FadeInDown.duration(250)} className="gap-3">
            <View className="flex-row flex-wrap items-center gap-1.5">
              <NexusApproved />
              <Pill label={`Subject test: ${percent(match.testScore)}`} tone="mint" />
              {match.reviewCount ? <Pill label={`${match.rating.toFixed(1)} · ${match.reviewCount} reviews`} tone="amber" icon={<Ionicons name="star" size={12} color="#7A3D00" />} /> : <Pill label="New on Nexus" tone="violet" />}
              <Pill label={modeLabel[match.mode]} tone="sky" />
            </View>
            {match.bio ? <Body className="text-[14px] leading-[21px] text-ink-700">{match.bio}</Body> : null}
            {match.reasons.length ? <Caption className="text-[13px]">Why we matched: {match.reasons.join(' · ')}</Caption> : null}
            <Body className="font-body-bold">
              {naira(match.rateKobo)} <Text className="font-body text-[13px] text-ink-500">/ hour after the free trial</Text>
            </Body>
            {booked ? (
              <View className="flex-row items-center gap-2 rounded-2xl bg-mint-50 p-3.5">
                <Ionicons name="checkmark-circle" size={20} color={palette.mint[700]} />
                <Text className="flex-1 font-body-semibold text-[14px] text-mint-800">Requested. They’ll accept and schedule your free trial; you’ll see it below.</Text>
              </View>
            ) : (
              <GameButton label="Request a free trial lesson" color={theme.accent} shadowColor={theme.shadow} size="md" loading={booking} onPress={onBook} />
            )}
          </Animated.View>
        ) : null}
      </PressableScale>
    </Animated.View>
  );
}

export default function Teachers() {
  const children = useChildren();
  const child = useCurrentChild();
  const request = useTutorRequest(child?.id);
  const matches = useTutorMatches(request.data?.id);
  const bookings = useParentBookings(child?.id);
  const book = useBook();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const openId = expandedId ?? matches.data?.[0]?.id;
  const refresh = () => { request.refetch(); matches.refetch(); bookings.refetch(); };

  if (children.data && children.data.length === 0) {
    return (
      <Screen background={theme.bg}>
        <Display className="text-[26px]">Lesson teachers</Display>
        <EmptyState icon="people-outline" title="Add a child first" message="Teachers are matched to each child’s subject and level." action={<GameButton label="Add a child" color={theme.accent} shadowColor={theme.shadow} className="mt-2 self-stretch" onPress={() => router.push('/parent/children/new')} />} />
      </Screen>
    );
  }

  return (
    <Screen background={theme.bg} accent={theme.accent} refreshing={matches.isRefetching || bookings.isRefetching} onRefresh={refresh}>
      <Display className="text-[26px]">Lesson teachers</Display>
      <ChildSwitcher />

      {bookings.data?.length ? (
        <View className="gap-3">
          <Title>{child?.firstName}’s lessons</Title>
          {bookings.data.map((b) => (
            <Card key={b.id} className="gap-3">
              <View className="flex-row items-center gap-3">
                <Avatar initials={b.tutor.initials} size={44} radius={14} />
                <View className="flex-1">
                  <Label>{b.tutor.name}</Label>
                  <Caption>{b.subject}</Caption>
                </View>
                <Pill label={b.status === 'PENDING' ? 'Waiting for teacher' : b.status === 'ACTIVE' ? 'Active' : 'Ended'} tone={b.status === 'ACTIVE' ? 'mint' : b.status === 'PENDING' ? 'amber' : 'violet'} />
              </View>
              {b.sessions.length ? b.sessions.map((s) => <LessonRow key={s.id} session={s} />) : (
                <Caption className="text-[14px]">{b.status === 'PENDING' ? 'The teacher will accept and suggest a time for the free trial.' : 'No lessons scheduled yet.'}</Caption>
              )}
            </Card>
          ))}
        </View>
      ) : null}

      {request.isPending ? (
        <CardListSkeleton count={2} height={110} />
      ) : request.isError ? (
        <ErrorState error={request.error} onRetry={request.refetch} color={theme.accent} />
      ) : !request.data ? (
        <EmptyState
          icon="search-outline"
          title={`What does ${child?.firstName ?? 'your child'} need?`}
          message="Tell us the subject, when, where and what kind of teacher. We match you with Nexus-approved teachers who passed our subject test. The first lesson is free."
          action={<GameButton label="Find a teacher" color={theme.accent} shadowColor={theme.shadow} className="mt-2 self-stretch" onPress={() => router.push({ pathname: '/parent/request', params: { studentId: child!.id } })} />}
        />
      ) : (
        <>
          <Card className="gap-3">
            <View className="flex-row items-center justify-between">
              <Label>What you asked for</Label>
              <Body accessibilityRole="link" onPress={() => router.push({ pathname: '/parent/request', params: { studentId: child!.id, requestId: request.data!.id } })} className="py-1 font-body-bold text-[14px] text-mint-700">
                Edit
              </Body>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {request.data.criteria.map((c) => <Pill key={c} label={c} tone="mint" />)}
            </View>
          </Card>

          {matches.isPending ? (
            <CardListSkeleton count={3} height={90} />
          ) : matches.isError ? (
            <ErrorState error={matches.error} onRetry={matches.refetch} color={theme.accent} />
          ) : matches.data.length === 0 ? (
            <EmptyState icon="hourglass-outline" title="No approved teachers match yet" message="We’re vetting new teachers every week. Pull down to check again, or widen your request (online lessons or a bigger budget usually help)." />
          ) : (
            <View className="gap-3">
              <Title>Matches</Title>
              {matches.data.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  expanded={openId === m.id}
                  onToggle={() => setExpandedId(openId === m.id ? '' : m.id)}
                  booking={book.isPending && book.variables === m.id}
                  onBook={() => book.mutate(m.id, { onSuccess: () => toast.success('Trial requested'), onError: (e) => toast.error(friendlyError(e)) })}
                />
              ))}
            </View>
          )}
        </>
      )}

      <View className="rounded-[18px] p-3.5" style={{ backgroundColor: '#12302B' }}>
        <Text className="font-body text-[13px] leading-[20px]" style={{ color: '#E2F5EF' }}>
          Your payment waits safely with Nexus and only goes to the teacher after the lesson: when your child finishes the lesson quiz or you confirm it happened.
        </Text>
      </View>
    </Screen>
  );
}
