import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Alert, View } from 'react-native';

import { Avatar, Body, Caption, Card, Display, GameButton, Label, PressableScale, Screen } from '@/components/ui';
import { API_URL } from '@/lib/api';
import { initials } from '@/lib/format';
import { queryClient } from '@/lib/query-client';
import { mobileRoles, useAuth, type AppRole } from '@/store/auth';
import { palette, type RoleTheme } from '@/theme';

const roleNames: Record<AppRole, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  STUDENT: { label: 'Student', icon: 'school-outline' },
  PARENT: { label: 'Parent', icon: 'people-outline' },
  TUTOR: { label: 'Lesson teacher', icon: 'easel-outline' },
};

export type ProfileRow = { icon: keyof typeof Ionicons.glyphMap; label: string; href?: Href; onPress?: () => void };

/** Shared "Me" page: identity, role switcher (a parent can also be a tutor), settings and sign out. */
export function ProfileScreen({ theme, extraRows = [], children, floatingTabBar = false }: { theme: RoleTheme; extraRows?: ProfileRow[]; children?: React.ReactNode; floatingTabBar?: boolean }) {
  const { user, activeRole, switchRole, signOut } = useAuth();
  const available = mobileRoles(user?.memberships);
  const school = user?.memberships.find((m) => m.schoolName)?.schoolName;
  const isStudent = activeRole === 'STUDENT';

  const confirmSignOut = () =>
    Alert.alert('Sign out?', 'You can sign back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          signOut(API_URL);
          queryClient.clear();
          router.replace('/welcome');
        },
      },
    ]);

  const rows: ProfileRow[] = [
    ...extraRows,
    ...(isStudent
      ? []
      : [
          { icon: 'person-circle-outline' as const, label: 'Your details', href: '/settings/account' as Href },
          { icon: 'key-outline' as const, label: 'Change password', href: '/settings/password' as Href },
          { icon: 'notifications-outline' as const, label: 'Notifications', href: '/settings/notifications' as Href },
        ]),
    ...(activeRole === 'PARENT' ? [{ icon: 'shield-checkmark-outline' as const, label: 'Privacy & data', href: '/settings/privacy' as Href }] : []),
    { icon: 'help-buoy-outline', label: 'Help & support', href: '/settings/help' },
  ];

  return (
    <Screen background={theme.bg} contentClassName={floatingTabBar ? 'pb-32' : ''}>
      <View className="items-center gap-2 pt-4">
        <Avatar initials={initials(user?.firstName ?? '?', user?.lastName)} size={84} radius={28} />
        <Display className="text-center text-[28px]">
          {user?.firstName} {user?.lastName}
        </Display>
        <Caption>{isStudent ? `@${user?.username}` : (user?.email ?? user?.phone)}</Caption>
        {school ? <Caption>{school}</Caption> : null}
      </View>

      {children}

      {available.length > 1 ? (
        <Card className="gap-3">
          <Label>Switch account</Label>
          <View className="flex-row gap-2">
            {available.map((r) => {
              const active = r === activeRole;
              return (
                <PressableScale
                  key={r}
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Use Nexus as ${roleNames[r].label}`}
                  onPress={() => {
                    if (active) return;
                    switchRole(r);
                    queryClient.clear();
                    router.replace('/');
                  }}
                  style={{ flex: 1, borderRadius: 16, borderWidth: 2, borderColor: active ? theme.accent : palette.ink[200], backgroundColor: active ? theme.accentSoft : palette.white, padding: 12, alignItems: 'center', gap: 6 }}
                >
                  <Ionicons name={roleNames[r].icon} size={22} color={active ? theme.accent : palette.ink[500]} />
                  <Body className="text-center font-body-bold text-[14px]">{roleNames[r].label}</Body>
                </PressableScale>
              );
            })}
          </View>
        </Card>
      ) : null}

      <Card className="p-2">
        {rows.map((row, i) => (
          <PressableScale
            key={row.label}
            onPress={row.onPress ?? (() => row.href && router.push(row.href))}
            accessibilityLabel={row.label}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: palette.ink[100] }}
          >
            <Ionicons name={row.icon} size={22} color={theme.accent} />
            <Body className="flex-1 font-body-semibold">{row.label}</Body>
            <Ionicons name="chevron-forward" size={18} color={palette.ink[300]} />
          </PressableScale>
        ))}
      </Card>

      <GameButton label="Sign out" variant="danger" size="md" onPress={confirmSignOut} />
    </Screen>
  );
}
