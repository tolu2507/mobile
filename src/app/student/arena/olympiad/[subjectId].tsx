import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { Pulse } from '@/components/game';
import { useOlympiad } from '@/features/arena/api';
import { ARENA, ArenaButton, ArenaShell, BackBar, BoardRow, goBack } from '@/features/arena/components';
import { friendlyError } from '@/lib/api';
import { fonts } from '@/theme';

const time = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

/** Today's Daily Olympiad for one subject: when it runs, the play button while it's open, and the live board. */
export default function OlympiadBoard() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const o = useOlympiad(subjectId);

  if (o.isPending)
    return (
      <ArenaShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={ARENA.gold} size="large" />
        </View>
      </ArenaShell>
    );
  if (o.isError)
    return (
      <ArenaShell>
        <View style={{ padding: 20, gap: 20 }}>
          <BackBar onBack={goBack} kicker="Arena" title="Daily Olympiad" />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: ARENA.muted }}>{friendlyError(o.error)}</Text>
          <ArenaButton label="Try again" onPress={() => void o.refetch()} />
        </View>
      </ArenaShell>
    );

  const d = o.data;
  const canPlay = d.status === 'open' && !d.me?.finished;
  const headline = d.status === 'upcoming' ? `Opens today at ${time(d.opensAt)}` : d.status === 'open' ? `Live now · closes at ${time(d.closesAt)}` : d.settled ? 'Final results' : 'Closed · working out final places';
  const mineShown = d.top.some((r) => r.you);

  return (
    <ArenaShell>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <BackBar onBack={goBack} kicker={`${d.subject.name} · today`} title="Daily Olympiad" />

        <View style={{ backgroundColor: ARENA.gold, borderRadius: 26, padding: 20, borderBottomWidth: 7, borderBottomColor: ARENA.goldLedge, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {d.status === 'open' ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#E0193A' }} /> : null}
            <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.bodyExtrabold, fontSize: 14, color: ARENA.goldInk }}>
              {headline}
            </Text>
          </View>
          <Text style={{ fontFamily: fonts.display, fontSize: 26, lineHeight: 30, color: ARENA.goldInk }}>
            {d.questions} questions. Same for everyone. One go each.
          </Text>
          {d.prizes ? (
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: ARENA.goldInk }}>
              Top 3 win ₦{d.prizes.naira.map((n) => n.toLocaleString()).join(', ₦')} in airtime for your parent, when at least {d.prizes.minPlayers} children play.
            </Text>
          ) : (
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: ARENA.goldInk }}>Play for the top spot on the board.</Text>
          )}
          {canPlay ? (
            <Pulse scale={1.03}>
              <ArenaButton big label={d.me ? 'Carry on' : 'Play now'} onPress={() => router.push({ pathname: '/student/arena/ghost/[subjectId]', params: { subjectId, mode: 'olympiad' } })} color={ARENA.bg} ledge="#000000" ink={ARENA.gold} />
            </Pulse>
          ) : null}
          {d.me?.finished ? (
            <Text style={{ fontFamily: fonts.bodyExtrabold, fontSize: 15, color: ARENA.goldInk }}>
              You scored {d.me.score} ({d.me.correct}/{d.questions} right){d.me.rank ? ` · #${d.me.rank}` : ''}
            </Text>
          ) : null}
        </View>

        <Text style={{ fontFamily: fonts.display, fontSize: 20, color: ARENA.text }}>
          Leaderboard{d.players ? ` · ${d.players} ${d.players === 1 ? 'player' : 'players'}` : ''}
        </Text>
        {!d.top.length ? (
          <View style={{ backgroundColor: ARENA.panel, borderRadius: 18, padding: 18, alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="podium-gold" size={36} color={ARENA.muted} />
            <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: ARENA.muted, textAlign: 'center' }}>{d.status === 'upcoming' ? 'The board fills up once it opens.' : 'Nobody has finished yet. Be first!'}</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {d.top.map((r, i) => (
              <BoardRow key={r.rank} rank={r.rank} name={r.name} initial={r.initial} value={`${r.score}`} you={r.you} index={i} />
            ))}
            {d.me?.rank && !mineShown ? <BoardRow rank={d.me.rank} name="You" initial="•" value={`${d.me.score}`} you index={0} /> : null}
          </View>
        )}
      </ScrollView>
    </ArenaShell>
  );
}
