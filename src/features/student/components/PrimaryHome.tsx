import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { router } from 'expo-router';

import { CountUp, Pulse } from '@/components/game';
import { GameButton, PressableScale, Screen, subjectIcons, toneColors } from '@/components/ui';
import { ExamPrepCard } from '@/features/exams/components/ExamPrepCard';
import { palette, roles } from '@/theme';
import type { StudentHome } from '@/types/api';

const theme = roles.studentPrimary;

/** Primary-school home: fewer words, bigger targets, one clear adventure. */
export function PrimaryHome({ home, refreshing, onRefresh }: { home: StudentHome; refreshing: boolean; onRefresh: () => void }) {
  const play = (kind: 'ACTIVITY' | 'LESSON_QUIZ', id: string) => router.push({ pathname: '/student/play/[kind]/[id]', params: { kind, id } });

  return (
    <Screen background={theme.bg} refreshing={refreshing} onRefresh={onRefresh} accent={theme.accent} contentClassName="pb-32">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-mint-400">
            <Ionicons name="happy-outline" size={32} color="#FFFFFF" />
          </View>
          <View>
            <Text className="font-body-semibold text-[14px]" style={{ color: '#6A5A1E' }}>
              Hi there,
            </Text>
            <Text accessibilityRole="header" className="font-display text-[26px] text-ink">
              {home.firstName}!
            </Text>
          </View>
        </View>
        <View accessibilityLabel={`${home.stars} stars`} className="flex-row items-center gap-1.5 rounded-full bg-white px-3.5 py-2.5" style={{ shadowColor: '#F1D98A', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 3 }, elevation: 2 }}>
          <Ionicons name="star" size={20} color="#FFB800" />
          <CountUp value={home.stars} fontSize={16} color={palette.ink.DEFAULT} />
        </View>
      </View>

      <ExamPrepCard level={home.level} grade={home.gradeName} theme={theme} />

      {home.adventure ? (
        <View style={{ backgroundColor: theme.accent, borderRadius: 28, padding: 20, gap: 14, shadowColor: theme.shadow, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 6 }, elevation: 4 }}>
          <Text className="font-body-bold text-[14px] uppercase tracking-wider text-white">Today’s adventure</Text>
          <Text className="font-display text-[30px] leading-[32px] text-white">{home.adventure.title}</Text>
          <View accessibilityLabel={`Step ${home.adventure.step} of ${home.adventure.steps}`} className="flex-row gap-2">
            {Array.from({ length: home.adventure.steps }, (_, i) => {
              const n = i + 1;
              const done = n < home.adventure!.step;
              const current = n === home.adventure!.step;
              return (
                <Animated.View key={n} entering={ZoomIn.delay(100 * i).springify()}>
                  <Pulse active={current} scale={1.12}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: done ? '#FFFFFF' : current ? palette.sun[400] : 'rgba(255,255,255,0.3)',
                        borderWidth: current ? 3 : 0,
                        borderColor: '#FFFFFF',
                      }}
                    >
                      {done ? <Ionicons name="checkmark" size={22} color={palette.mint[400]} /> : <Text className="font-body-extrabold text-[16px] text-ink">{n}</Text>}
                    </View>
                  </Pulse>
                </Animated.View>
              );
            })}
          </View>
          <Pulse scale={1.04}>
            <GameButton label="Let's play!" variant="white" color="#C63F1D" size="xl" onPress={() => play('ACTIVITY', home.adventure!.activityId)} />
          </Pulse>
        </View>
      ) : (
        <View className="items-center gap-2 rounded-[28px] bg-white p-6">
          <Ionicons name="trophy" size={40} color={palette.sun[400]} />
          <Text className="text-center font-display text-[24px] text-ink">All done today!</Text>
          <Text className="text-center font-body text-[15px] text-ink-700">Come back tomorrow for a new adventure.</Text>
        </View>
      )}

      <Text className="mt-2 font-display text-[22px] text-ink">Pick a world</Text>
      <View className="flex-row flex-wrap gap-3.5">
        {home.quests.map((world) => {
          const t = toneColors[world.tone];
          return (
            <PressableScale
              key={world.id}
              onPress={() => play(world.kind, world.id)}
              accessibilityLabel={world.title}
              style={{ width: '47%', height: 128, borderRadius: 24, backgroundColor: t.solid, padding: 16, justifyContent: 'space-between', shadowColor: t.ledge, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 5 }, elevation: 3 }}
            >
              <MaterialCommunityIcons name={subjectIcons[world.icon]} size={40} color={world.tone === 'sun' ? palette.coral[500] : t.onSolid} />
              <View className="gap-0.5">
                <Text numberOfLines={2} style={{ color: t.onSolid }} className="font-body-extrabold text-[16px]">
                  {world.title}
                </Text>
                {world.progress >= 1 ? (
                  <Text style={{ color: t.onSolid }} className="font-body-bold text-[12px] opacity-80">
                    Done today
                  </Text>
                ) : null}
              </View>
            </PressableScale>
          );
        })}
      </View>
    </Screen>
  );
}
