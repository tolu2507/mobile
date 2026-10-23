import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { useLeaderboard } from '@/features/arena/api';
import { ARENA, ArenaButton, ArenaShell, BackBar, BoardRow, goBack, Trophies } from '@/features/arena/components';
import { friendlyError } from '@/lib/api';
import { fonts } from '@/theme';

const EXAM_NAMES: Record<string, string> = { JAMB: 'JAMB', WAEC: 'WAEC', NECO: 'NECO', BECE: 'BECE', COMMON_ENTRANCE: 'Common Entrance', PRIMARY: 'Primary', NURSERY: 'Nursery' };

/** Trophy rankings for everyone preparing for the same exam. Trophies come from Ghost Races and Quick Matches. */
export default function TrophyBoard() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const board = useLeaderboard(subjectId);

  if (board.isPending)
    return (
      <ArenaShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={ARENA.gold} size="large" />
        </View>
      </ArenaShell>
    );
  if (board.isError)
    return (
      <ArenaShell>
        <View style={{ padding: 20, gap: 20 }}>
          <BackBar onBack={goBack} kicker="Arena" title="Leaderboard" />
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 16, color: ARENA.muted }}>{friendlyError(board.error)}</Text>
          <ArenaButton label="Try again" onPress={() => void board.refetch()} />
        </View>
      </ArenaShell>
    );

  const b = board.data;
  const mineShown = b.top.some((r) => r.you);
  return (
    <ArenaShell>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        <BackBar onBack={goBack} kicker={`Everyone on ${EXAM_NAMES[b.exam] ?? b.exam}`} title="Trophy leaderboard" right={<Trophies count={b.me.trophies} />} />
        <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: ARENA.muted }}>
          {b.me.rank ? `You’re #${b.me.rank}. ` : 'Win a Ghost Race or a Quick Match to get on the board. '}Trophies come from Ghost Races and Quick Matches, never from rooms with friends.
        </Text>
        {!b.top.length ? (
          <Text style={{ fontFamily: fonts.bodyBold, fontSize: 15, color: ARENA.muted, textAlign: 'center', marginTop: 20 }}>Nobody has trophies yet. Be the first!</Text>
        ) : (
          <View style={{ gap: 8 }}>
            {b.top.map((r, i) => (
              <BoardRow key={r.rank} rank={r.rank} name={r.name} initial={r.initial} value={`${r.trophies}`} you={r.you} index={i} />
            ))}
            {b.me.rank && !mineShown ? <BoardRow rank={b.me.rank} name={b.me.name} initial={b.me.name.slice(0, 1)} value={`${b.me.trophies}`} you index={0} /> : null}
          </View>
        )}
      </ScrollView>
    </ArenaShell>
  );
}
