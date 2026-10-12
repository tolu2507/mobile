import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  background: string;
  /** Rendered edge-to-edge above the scroll content (e.g. a coloured hero). */
  header?: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  accent?: string;
  edges?: Edge[];
  contentClassName?: string;
};

/**
 * Base layout for every mobile screen: safe areas, background colour,
 * pull-to-refresh, and consistent 20px side gutters.
 */
export function Screen({ children, background, header, scroll = true, refreshing = false, onRefresh, accent, edges = ['top'], contentClassName = '' }: Props) {
  const body = <View className={`gap-4 px-5 pb-8 pt-5 ${contentClassName}`}>{children}</View>;
  return (
    <SafeAreaView edges={header ? [] : edges} style={{ flex: 1, backgroundColor: background }}>
      {scroll ? (
        <ScrollView
          contentInsetAdjustmentBehavior="never"
          showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} colors={accent ? [accent] : undefined} /> : undefined}
        >
          {header}
          {body}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {header}
          {body}
        </View>
      )}
    </SafeAreaView>
  );
}
