import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking } from 'react-native';

import { toast } from '@/components/reacticx/molecules/Toast';
import { Banner, Card, CardListSkeleton, ErrorState, Screen, ScreenHeader, SwitchRow } from '@/components/ui';
import { useNotificationPrefs, useSavePrefs } from '@/features/me/api';
import { friendlyError } from '@/lib/api';
import { registerForPush, type PushStatus } from '@/lib/push';
import { useAuth } from '@/store/auth';
import { palette } from '@/theme';
import type { NotificationPrefs } from '@/types/api';

export default function Notifications() {
  const [push, setPush] = useState<PushStatus | null>(null);
  // Re-check whenever the screen gains focus, e.g. after coming back from the phone's settings.
  useFocusEffect(
    useCallback(() => {
      registerForPush(false).then(setPush).catch(() => setPush('unavailable'));
    }, []),
  );
  const prefs = useNotificationPrefs();
  const save = useSavePrefs();
  const role = useAuth((s) => s.activeRole);
  const set = (k: keyof NotificationPrefs) => (v: boolean) => save.mutate({ [k]: v }, { onError: (e) => toast.error(friendlyError(e)) });

  return (
    <Screen background={palette.paper} edges={['top', 'bottom']}>
      <ScreenHeader title="Notifications" subtitle="Choose what Nexus tells you about." />
      {prefs.isPending ? (
        <CardListSkeleton count={1} height={240} />
      ) : prefs.isError ? (
        <ErrorState error={prefs.error} onRetry={prefs.refetch} />
      ) : (
        <Card className="gap-1 py-2">
          {role === 'PARENT' ? (
            <>
              <SwitchRow label="Weekly reports" description="Every Friday at 4pm, in the app and by email." value={prefs.data.weeklyReport} onChange={set('weeklyReport')} />
              {prefs.data.weeklyReport ? (
                <SwitchRow label="Also on WhatsApp" description="A short summary to your phone number each Friday." value={prefs.data.whatsAppReports} onChange={set('whatsAppReports')} />
              ) : null}
            </>
          ) : null}
          <SwitchRow label="Lesson reminders" description="The day before and an hour before each lesson." value={prefs.data.lessonReminders} onChange={set('lessonReminders')} />
          <SwitchRow label="Payments" description="Receipts, top-ups and lesson payments." value={prefs.data.payments} onChange={set('payments')} />
          <SwitchRow label="News from Nexus" description="New features and offers. Never more than twice a month." value={prefs.data.productNews} onChange={set('productNews')} />
        </Card>
      )}
      {push === 'denied' ? (
        <Banner
          tone="info"
          title="Notifications are off for Nexus"
          message="Turn them on in your phone’s settings to get reminders and reports on this phone."
          action={{ label: 'Open settings', onPress: () => Linking.openSettings() }}
        />
      ) : push === 'unavailable' ? (
        <Banner tone="info" message="This phone can’t receive push notifications right now. Reports and receipts still arrive by email." />
      ) : null}
    </Screen>
  );
}
