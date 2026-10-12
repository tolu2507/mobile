import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, Text, View } from 'react-native';

import { palette } from '@/theme';
import { PressableScale } from './PressableScale';

const fmt = (d: Date) =>
  d.toLocaleString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** Tap to pick a date, then a time (Android shows them one after the other). */
export function DateTimeField({ label, value, onChange, accent = palette.coral[500] }: { label: string; value: Date; onChange: (d: Date) => void; accent?: string }) {
  const [mode, setMode] = useState<'date' | 'time' | null>(null);
  return (
    <View className="gap-1.5">
      <Text className="font-body-bold text-[14px] text-ink">{label}</Text>
      <PressableScale
        accessibilityLabel={`${label}: ${fmt(value)}. Change`}
        onPress={() => setMode('date')}
        style={{ height: 54, borderRadius: 16, borderWidth: 2, borderColor: mode ? accent : palette.ink[200], backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10 }}
      >
        <Ionicons name="calendar-outline" size={20} color={accent} />
        <Text className="flex-1 font-body-semibold text-[16px] text-ink">{fmt(value)}</Text>
      </PressableScale>
      {mode ? (
        <DateTimePicker
          value={value}
          mode={Platform.OS === 'ios' ? 'datetime' : mode}
          minimumDate={new Date()}
          minuteInterval={5}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          accentColor={accent}
          onChange={(event, picked) => {
            if (event.type === 'dismissed') return setMode(null);
            if (picked) onChange(picked);
            if (Platform.OS === 'android' && mode === 'date') setMode('time');
            else if (Platform.OS === 'android') setMode(null);
          }}
        />
      ) : null}
      {mode && Platform.OS === 'ios' ? (
        <Text accessibilityRole="button" onPress={() => setMode(null)} className="self-end py-2 font-body-bold text-[15px]" style={{ color: accent }}>
          Done
        </Text>
      ) : null}
    </View>
  );
}
