import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Scrollable, keyboard-safe page with a sticky action button at the bottom. */
export function FormScreen({ background, children, footer }: { background: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-10 pt-2">
          {children}
        </ScrollView>
        {footer ? <View className="px-5 pb-2 pt-2">{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
