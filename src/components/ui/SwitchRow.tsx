import { Switch, Text, View } from 'react-native';

import { palette } from '@/theme';

export function SwitchRow({ label, description, value, onChange, accent = palette.violet[500], disabled }: {
  label: string; description?: string; value: boolean; onChange: (v: boolean) => void; accent?: string; disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-3 py-2.5" style={{ opacity: disabled ? 0.55 : 1 }}>
      <View className="flex-1 gap-0.5">
        <Text className="font-body-bold text-[15px] text-ink">{label}</Text>
        {description ? <Text className="font-body text-[13px] leading-[19px] text-ink-500">{description}</Text> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        trackColor={{ true: accent, false: palette.ink[200] }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
