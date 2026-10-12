import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { PressableScale, Skeleton } from '@/components/ui';
import { palette, roles } from '@/theme';
import type { Child } from '@/types/api';
import { useChildren } from '../api';
import { useSelectedChild } from '../store';

/** Pill tabs for parents with more than one child. Also picks the first child by default. */
export function ChildSwitcher() {
  const { data, isPending } = useChildren();
  const { childId, setChildId } = useSelectedChild();

  useEffect(() => {
    if (data?.length && !data.some((c) => c.id === childId)) setChildId(data[0].id);
  }, [data, childId, setChildId]);

  if (isPending) return <Skeleton height={44} width={240} radius={999} />;
  if (!data || data.length < 2) return null;

  return (
    <View accessibilityRole="tablist" className="flex-row flex-wrap gap-2">
      {data.map((c: Child) => {
        const active = c.id === childId;
        return (
          <PressableScale
            key={c.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => setChildId(c.id)}
            style={{
              height: 44,
              paddingHorizontal: 18,
              borderRadius: 999,
              justifyContent: 'center',
              backgroundColor: active ? roles.parent.accent : palette.white,
              borderWidth: active ? 0 : 2,
              borderColor: '#CFE3DD',
            }}
          >
            <Text style={{ color: active ? '#FFFFFF' : palette.ink.DEFAULT }} className="font-body-bold text-[15px]">
              {c.firstName} · {c.className}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

export function useCurrentChild() {
  const { data } = useChildren();
  const childId = useSelectedChild((s) => s.childId);
  return data?.find((c) => c.id === childId) ?? data?.[0];
}
