import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Pulse } from '@/components/game';
import { PressableScale } from '@/components/ui';
import { say } from '@/lib/speech';
import { palette, type RoleTheme } from '@/theme';
import type { PracticeMap, PracticeSubtopic } from '@/types/api';
import { topicPicture } from '../nursery';

/**
 * A nursery subject as big picture tiles instead of a reading list: each game says its name when tapped,
 * shows stars for how far the child has climbed, and the next game to play gently pulses.
 */
export function NurseryMap({ m, theme }: { m: PracticeMap; theme: RoleTheme }) {
  const games = m.topics.flatMap((t) => t.subtopics);
  const playable = (s: PracticeSubtopic) => s.unlocked && (s.fresh > 0 || s.answered > 0);
  const next = games.find((s) => playable(s) && !s.bossBeaten)?.id;

  return (
    <View className="flex-row flex-wrap justify-between gap-y-3">
      {games.map((s, i) => (
        <Animated.View key={s.id} entering={FadeInDown.delay(Math.min(i, 8) * 60)} style={{ width: '48%' }}>
          <Pulse active={s.id === next} scale={1.04}>
            <Game s={s} theme={theme} subjectName={m.subject.name} playable={playable(s)} />
          </Pulse>
        </Animated.View>
      ))}
    </View>
  );
}

function Game({ s, theme, subjectName, playable }: { s: PracticeSubtopic; theme: RoleTheme; subjectName: string; playable: boolean }) {
  // Levels 1–5 are four stars to earn, then the crown for beating the boss round.
  const stars = s.bossBeaten ? 4 : s.level - 1;
  const open = () => {
    say(s.name);
    router.push({ pathname: '/student/practice/round/[topicId]', params: { topicId: s.id, name: s.name, subject: subjectName } });
  };
  return (
    <PressableScale
      disabled={!playable}
      accessibilityRole="button"
      accessibilityState={{ disabled: !playable }}
      accessibilityLabel={`${s.name}. ${!s.unlocked ? 'Locked' : s.bossBeaten ? 'Conquered' : `${stars} of 4 stars`}.`}
      onPress={open}
      style={{
        aspectRatio: 0.9,
        borderRadius: 28,
        backgroundColor: s.bossBeaten ? palette.sun[400] : '#FFFFFF',
        borderBottomWidth: 6,
        borderColor: s.bossBeaten ? palette.sun[600] : playable ? theme.accentSoft : palette.ink[100],
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        gap: 8,
        opacity: playable ? 1 : 0.55,
      }}
    >
      <Text style={{ fontSize: 60, lineHeight: 74 }}>{topicPicture(s.name)}</Text>
      <Text numberOfLines={2} className="text-center font-body-bold text-[14px] leading-[17px] text-ink">
        {s.name}
      </Text>
      {s.bossBeaten ? (
        <MaterialCommunityIcons name="crown" size={26} color={palette.ink.DEFAULT} />
      ) : (
        <View className="flex-row gap-0.5">
          {[0, 1, 2, 3].map((n) => (
            <Ionicons key={n} name="star" size={18} color={n < stars ? '#FFB800' : palette.ink[100]} />
          ))}
        </View>
      )}
      {!s.unlocked ? (
        <View style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, backgroundColor: palette.ink[100], alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="lock-closed" size={16} color={palette.ink[500]} />
        </View>
      ) : playable ? (
        <View style={{ position: 'absolute', top: 10, right: 10 }}>
          <Ionicons name="play-circle" size={30} color={theme.accent} />
        </View>
      ) : null}
    </PressableScale>
  );
}
