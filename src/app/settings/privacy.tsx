import { Alert, View } from 'react-native';

import { toast } from '@/components/reacticx/molecules/Toast';
import { Body, Caption, Card, CardListSkeleton, EmptyState, ErrorState, GameButton, Label, Screen, ScreenHeader, SwitchRow, Title } from '@/components/ui';
import { useDataRequest, usePrivacy, useSetConsent } from '@/features/me/api';
import { friendlyError } from '@/lib/api';
import { palette, roles } from '@/theme';

export default function Privacy() {
  const privacy = usePrivacy();
  const consent = useSetConsent();
  const request = useDataRequest();
  const accent = roles.parent.accent;

  const ask = (type: 'EXPORT' | 'DELETE', studentId?: string, name?: string) =>
    Alert.alert(
      type === 'EXPORT' ? 'Request a copy of the data?' : `Delete ${name ?? 'your'} account and data?`,
      type === 'EXPORT' ? 'We’ll email a copy within 30 days.' : 'We’ll confirm with you by email, then delete everything within 30 days. This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: type === 'EXPORT' ? 'Request copy' : 'Request deletion',
          style: type === 'DELETE' ? 'destructive' : 'default',
          onPress: () => request.mutate({ type, studentId }, { onSuccess: () => toast.success('Request received'), onError: (e) => toast.error(friendlyError(e)) }),
        },
      ],
    );

  return (
    <Screen background={roles.parent.bg} edges={['top', 'bottom']} refreshing={privacy.isRefetching} onRefresh={privacy.refetch} accent={accent}>
      <ScreenHeader title="Privacy & data" subtitle="You decide how Nexus uses your children’s information. Changes apply immediately." />
      {privacy.isPending ? (
        <CardListSkeleton count={2} height={180} />
      ) : privacy.isError ? (
        <ErrorState error={privacy.error} onRetry={privacy.refetch} color={accent} />
      ) : (
        <>
          {privacy.data.children.length === 0 ? (
            <EmptyState icon="people-outline" title="No children yet" message="When you add a child, their privacy settings appear here." />
          ) : (
            privacy.data.children.map((c) => (
              <Card key={c.studentId} className="gap-1">
                <Title>{c.firstName}</Title>
                <SwitchRow label="Learning data" description="Needed to use Nexus. To stop it, request deletion below." value={c.consents.DATA_PROCESSING} onChange={() => {}} disabled accent={accent} />
                <SwitchRow
                  label="AI weekly reports"
                  description="Lets our AI write a weekly summary from scores and activity."
                  value={c.consents.AI_REPORTS}
                  accent={accent}
                  onChange={(granted) => consent.mutate({ studentId: c.studentId, type: 'AI_REPORTS', granted }, { onError: (e) => toast.error(friendlyError(e)) })}
                />
                <SwitchRow
                  label="Lesson-teacher matching"
                  description="Shares subject, level and area (never names) with approved teachers."
                  value={c.consents.TUTOR_MATCHING}
                  accent={accent}
                  onChange={(granted) => consent.mutate({ studentId: c.studentId, type: 'TUTOR_MATCHING', granted }, { onError: (e) => toast.error(friendlyError(e)) })}
                />
                <View className="flex-row gap-2 pt-2">
                  <View className="flex-1"><GameButton label="Get a copy" size="md" variant="outline" onPress={() => ask('EXPORT', c.studentId)} /></View>
                  <View className="flex-1"><GameButton label="Delete" size="md" variant="danger" onPress={() => ask('DELETE', c.studentId, `${c.firstName}’s`)} /></View>
                </View>
              </Card>
            ))
          )}

          <Card className="gap-3">
            <Label>Your own account</Label>
            <View className="flex-row gap-2">
              <View className="flex-1"><GameButton label="Get a copy" size="md" variant="outline" onPress={() => ask('EXPORT')} /></View>
              <View className="flex-1"><GameButton label="Delete" size="md" variant="danger" onPress={() => ask('DELETE')} /></View>
            </View>
          </Card>

          {privacy.data.requests.length ? (
            <Card className="gap-2">
              <Label>Your requests</Label>
              {privacy.data.requests.map((r) => (
                <View key={r.id} className="flex-row justify-between">
                  <Body className="text-[14px]">{r.type === 'EXPORT' ? 'Copy of data' : 'Deletion'}</Body>
                  <Caption>{r.status === 'DONE' ? 'Done' : 'In progress'} · {new Date(r.createdAt).toLocaleDateString('en-NG')}</Caption>
                </View>
              ))}
            </Card>
          ) : null}
          <Caption className="text-center" style={{ color: palette.ink[500] }}>Protected under the Nigeria Data Protection Act 2023.</Caption>
        </>
      )}
    </Screen>
  );
}
