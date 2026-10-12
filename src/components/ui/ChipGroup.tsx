import { Text, View } from 'react-native';

import { palette } from '@/theme';
import { PressableScale } from './PressableScale';

type Option<T extends string> = { value: T; label: string };

/** Pick one (radio) or many (checkbox) from short options. */
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  accent = palette.violet[500],
  error,
}: {
  label?: string;
  options: Option<T>[];
  value: T | T[] | null;
  onChange: (next: T) => void;
  accent?: string;
  error?: string;
}) {
  const multi = Array.isArray(value);
  const isOn = (v: T) => (multi ? (value as T[]).includes(v) : value === v);
  return (
    <View className="gap-2">
      {label ? <Text className="font-body-bold text-[14px] text-ink">{label}</Text> : null}
      <View accessibilityRole={multi ? undefined : 'radiogroup'} className="flex-row flex-wrap gap-2">
        {options.map((o) => {
          const on = isOn(o.value);
          return (
            <PressableScale
              key={o.value}
              accessibilityRole={multi ? 'checkbox' : 'radio'}
              accessibilityState={multi ? { checked: on } : { selected: on }}
              onPress={() => onChange(o.value)}
              style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 999, justifyContent: 'center', borderWidth: 2, borderColor: on ? accent : palette.ink[200], backgroundColor: on ? `${accent}18` : '#FFFFFF' }}
            >
              <Text style={{ color: on ? accent : palette.ink.DEFAULT }} className="font-body-bold text-[14px]">
                {o.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>
      {error ? <Text className="font-body-semibold text-[13px] text-coral-700">{error}</Text> : null}
    </View>
  );
}

export const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
