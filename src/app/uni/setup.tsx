import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Banner, ErrorState, GameButton, PressableScale, Screen, ScreenHeader, Skeleton } from '@/components/ui';
import { useDepartments, useUniMe, useUniSetup } from '@/features/uni/api';
import { UNI } from '@/features/uni/components/classroom-theme';
import { friendlyError } from '@/lib/api';
import { fonts, palette } from '@/theme';

const semesterName = (n: number) => (n === 1 ? 'First semester' : 'Second semester');

/** Department → level and semester → the courses they registered. Also used to change courses later. */
export default function UniSetup() {
  const departments = useDepartments();
  const me = useUniMe();
  const save = useUniSetup();
  // Each choice starts from a default (what they have, or the only option) until they tap something.
  const [deptChoice, setDept] = useState<string | null>(null);
  const [semChoice, setSem] = useState<string | null>(null); // "300-2"
  const [pickedChoice, setPicked] = useState<Set<string> | null>(null);

  const list = departments.data ?? [];
  const dept = deptChoice ?? list.find((x) => x.slug === me.data?.department?.slug)?.slug ?? (list.length === 1 ? list[0].slug : null);
  const department = list.find((d) => d.slug === dept) ?? null;
  const sem = semChoice ?? (department?.semesters.length === 1 ? `${department.semesters[0].level}-${department.semesters[0].semester}` : null);
  const semester = department?.semesters.find((s) => `${s.level}-${s.semester}` === sem) ?? null;
  const semesterIds = semester?.courses.map((c) => c.id) ?? [];
  const mine = semesterIds.filter((id) => me.data?.courses.some((c) => c.id === id));
  // Everything ticked by default: most students register every course on the list.
  const picked = pickedChoice ?? new Set(mine.length ? mine : semesterIds);

  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPicked(next);
  };

  const canSave = !!department && !!semester && picked.size > 0;
  const submit = () =>
    canSave &&
    save.mutate(
      { department: department.slug, level: semester.level, semester: semester.semester, courseIds: [...picked] },
      { onSuccess: () => (router.canGoBack() ? router.back() : router.replace('/uni')) },
    );
  const firstTime = !me.data?.courses.length;

  return (
    <Screen background={UNI.bg}>
      <ScreenHeader
        title={firstTime ? 'Set up your semester' : 'Your courses'}
        subtitle="Pick your department and the courses you registered. You can change this any time."
        onBack={router.canGoBack() ? () => router.back() : undefined}
      />
      {departments.isError ? <ErrorState error={departments.error} onRetry={() => void departments.refetch()} color={UNI.accent} /> : null}
      {departments.isPending ? <Skeleton height={90} radius={20} /> : null}

      {list.length ? (
        <View style={{ gap: 10 }}>
          <Text style={{ color: palette.ink[500], fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 0.6 }}>DEPARTMENT</Text>
          {list.map((d) => {
            const on = d.slug === dept;
            return (
              <PressableScale
                key={d.slug}
                accessibilityState={{ selected: on }}
                onPress={() => {
                  setDept(d.slug);
                  setSem(null);
                  setPicked(null);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: on ? UNI.accent : '#ECEAF6' }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: UNI.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="brain" size={24} color={UNI.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: palette.ink.DEFAULT, fontFamily: fonts.bodyBold, fontSize: 16 }}>{d.name}</Text>
                    <Text style={{ color: palette.ink[500], fontFamily: fonts.body, fontSize: 13 }}>Faculty of {d.faculty}</Text>
                  </View>
                  <Ionicons name={on ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={on ? UNI.accent : palette.ink[200]} />
                </View>
              </PressableScale>
            );
          })}
          <Text style={{ color: palette.ink[500], fontFamily: fonts.body, fontSize: 13 }}>More departments are coming. Psychology is first.</Text>
        </View>
      ) : null}

      {department ? (
        <Animated.View entering={FadeInDown.duration(300)} style={{ gap: 10 }}>
          <Text style={{ color: palette.ink[500], fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 0.6 }}>LEVEL AND SEMESTER</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {department.semesters.map((s) => {
              const key = `${s.level}-${s.semester}`;
              const on = key === sem;
              return (
                <PressableScale
                  key={key}
                  accessibilityState={{ selected: on }}
                  onPress={() => {
                    setSem(key);
                    setPicked(null);
                  }}
                >
                  <View style={{ borderRadius: 999, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: on ? UNI.accent : '#fff', borderWidth: 1.5, borderColor: on ? UNI.accent : '#ECEAF6' }}>
                    <Text style={{ color: on ? '#fff' : palette.ink.DEFAULT, fontFamily: fonts.bodyBold, fontSize: 14 }}>
                      {s.level} Level · {semesterName(s.semester)}
                    </Text>
                  </View>
                </PressableScale>
              );
            })}
          </View>
        </Animated.View>
      ) : null}

      {semester ? (
        <Animated.View entering={FadeInDown.duration(300)} style={{ gap: 10 }}>
          <Text style={{ color: palette.ink[500], fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 0.6 }}>COURSES YOU REGISTERED ({picked.size})</Text>
          {semester.courses.map((c) => {
            const on = picked.has(c.id);
            return (
              <PressableScale key={c.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`${c.code}, ${c.title}`} onPress={() => toggle(c.id)}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: on ? UNI.accent : '#ECEAF6' }}>
                  <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: on ? UNI.accent : '#fff', borderWidth: 2, borderColor: on ? UNI.accent : palette.ink[200], alignItems: 'center', justifyContent: 'center' }}>
                    {on ? <Ionicons name="checkmark" size={18} color="#fff" /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: UNI.accent, fontFamily: fonts.bodyExtrabold, fontSize: 12, letterSpacing: 0.8 }}>{c.code}</Text>
                    <Text style={{ color: palette.ink.DEFAULT, fontFamily: fonts.bodySemibold, fontSize: 15, lineHeight: 20 }}>{c.title}</Text>
                    <Text style={{ color: palette.ink[500], fontFamily: fonts.body, fontSize: 12.5, marginTop: 2 }}>
                      {c.lessons ? `${c.lessons} classes · ${c.questions.toLocaleString()} practice questions` : 'Classes being prepared'}
                    </Text>
                  </View>
                </View>
              </PressableScale>
            );
          })}
        </Animated.View>
      ) : null}

      {save.isError ? <Banner tone="error" message={friendlyError(save.error)} /> : null}
      {semester ? <GameButton label={firstTime ? 'Start learning' : 'Save my courses'} color={UNI.accent} shadowColor={UNI.shadow} onPress={submit} disabled={!canSave} loading={save.isPending} /> : null}
    </Screen>
  );
}
