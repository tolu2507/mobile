import { router } from 'expo-router';
import { View } from 'react-native';

import { EmptyState, GameButton, Screen } from '@/components/ui';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { palette } from '@/theme';

/** Shown to school staff, who use the web app instead. */
export default function NoAccess() {
  const signOut = useAuth((s) => s.signOut);
  return (
    <Screen background={palette.paper} scroll={false}>
      <View className="flex-1 justify-center">
        <EmptyState
          icon="desktop-outline"
          title="Use Nexus on the web"
          message="School staff accounts manage Nexus from the web dashboard. The mobile app is for students, parents and tuck-shop staff."
          action={
            <GameButton
              label="Sign out"
              variant="outline"
              className="mt-2 self-stretch"
              onPress={() => {
                signOut(API_URL);
                router.replace('/welcome');
              }}
            />
          }
        />
      </View>
    </Screen>
  );
}
