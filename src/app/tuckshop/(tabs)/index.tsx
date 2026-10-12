import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Caption, CardListSkeleton, EmptyState, ErrorState, Label, Pill, PressableScale, Screen, TextField } from '@/components/ui';
import { useShopClasses, useShopStudents, useTodaysSales } from '@/features/tuckshop/api';
import { initials, naira } from '@/lib/format';
import { useAuth } from '@/store/auth';
import { palette, roles } from '@/theme';
import type { ShopStudent } from '@/types/api';

const theme = roles.tuckshop;

/** The counter: find the child in front of you, then start their sale. */
export default function Counter() {
  const user = useAuth((s) => s.user);
  const school = user?.memberships.find((m) => m.role === 'TUCK_SHOP')?.schoolName;
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [classId, setClassId] = useState<string | null>(null);
  const classes = useShopClasses();
  const students = useShopStudents(query, classId);
  const sales = useTodaysSales();

  // Wait for a pause in typing before asking the server.
  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const header = (
    <View style={{ backgroundColor: theme.accent, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
      <SafeAreaView edges={['top']}>
        <View style={{ gap: 6, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 22 }}>
          <Text className="font-body-bold text-[13px] uppercase tracking-wider text-white">Tuck shop{school ? ` · ${school}` : ''}</Text>
          <Text accessibilityRole="header" className="font-display text-[30px] leading-[34px] text-white">
            Who’s buying?
          </Text>
          <PressableScale
            accessibilityLabel="Today's sales"
            onPress={() => router.push('/tuckshop/sales')}
            style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 18, padding: 14 }}
          >
            <Ionicons name="cash-outline" size={22} color={palette.white} />
            <View style={{ flex: 1 }}>
              <Text className="font-body-semibold text-[13px]" style={{ color: '#FFE4C7' }}>
                Your sales today
              </Text>
              <Text className="font-display text-[22px] text-white">{sales.data ? `${naira(sales.data.totalKobo)} · ${sales.data.count} ${sales.data.count === 1 ? 'sale' : 'sales'}` : '—'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={palette.white} />
          </PressableScale>
        </View>
      </SafeAreaView>
    </View>
  );

  return (
    <Screen background={theme.bg} header={header} refreshing={students.isRefetching} onRefresh={() => (students.refetch(), sales.refetch())} accent={theme.accent}>
      <TextField label="Find a child" placeholder={['Name or admission number', 'Ada', 'JSS/2024/017']} value={search} onChangeText={setSearch} autoCorrect={false} accent={theme.accent} returnKeyType="search" />

      {classes.data?.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
          {[{ id: null, name: 'All classes' }, ...classes.data].map((c) => {
            const on = classId === c.id;
            return (
              <PressableScale
                key={c.id ?? 'all'}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                onPress={() => setClassId(c.id)}
                style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center', borderWidth: 2, borderColor: on ? theme.accent : palette.ink[200], backgroundColor: on ? `${theme.accent}18` : palette.white }}
              >
                <Text style={{ color: on ? theme.shadow : palette.ink.DEFAULT }} className="font-body-bold text-[14px]">
                  {c.name}
                </Text>
              </PressableScale>
            );
          })}
        </ScrollView>
      ) : null}

      {students.isPending ? (
        <CardListSkeleton count={5} height={68} />
      ) : students.isError ? (
        <ErrorState error={students.error} onRetry={students.refetch} color={theme.accent} />
      ) : students.data.length === 0 ? (
        <EmptyState icon="search-outline" title="No one found" message={query ? 'Check the spelling, or try their admission number.' : 'The school hasn’t added any students yet.'} />
      ) : (
        <View style={{ gap: 10 }}>
          {students.data.map((s) => (
            <StudentRow key={s.id} student={s} />
          ))}
          {students.data.length >= 60 ? <Caption className="text-center">Showing the first 60. Type a name to narrow it down.</Caption> : null}
        </View>
      )}
    </Screen>
  );
}

function StudentRow({ student: s }: { student: ShopStudent }) {
  return (
    <PressableScale
      accessibilityLabel={`Sell to ${s.firstName} ${s.lastName}`}
      onPress={() => router.push({ pathname: '/tuckshop/sell', params: { id: s.id, firstName: s.firstName, lastName: s.lastName, className: s.className ?? '', hasPin: s.hasPin ? '1' : '0' } })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.white, borderRadius: 20, padding: 12 }}
    >
      <Avatar initials={initials(s.firstName, s.lastName)} size={44} radius={14} />
      <View style={{ flex: 1, gap: 2 }}>
        <Label numberOfLines={1}>
          {s.firstName} {s.lastName}
        </Label>
        <Caption numberOfLines={1}>{[s.className, s.admissionNo].filter(Boolean).join(' · ') || 'No class yet'}</Caption>
      </View>
      {s.hasPin ? <Ionicons name="chevron-forward" size={20} color={palette.ink[300]} /> : <Pill label="No PIN" tone="coral" />}
    </PressableScale>
  );
}
