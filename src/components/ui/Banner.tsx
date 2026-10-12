import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

const tones = {
  info: { bg: '#EAF2FF', fg: '#1A4FA0', icon: 'information-circle' as const },
  error: { bg: '#FFE7DF', fg: '#A3330F', icon: 'alert-circle' as const },
  tip: { bg: '#FFF4E5', fg: '#7A3D00', icon: 'bulb' as const },
  success: { bg: '#E2F5EF', fg: '#0B5A4C', icon: 'checkmark-circle' as const },
};

/** Inline message. `action` adds a text button underneath, e.g. "Open settings". */
export function Banner({ tone = 'info', title, message, action }: { tone?: keyof typeof tones; title?: string; message: string; action?: { label: string; onPress: () => void } }) {
  const t = tones[tone];
  return (
    <View accessibilityRole={tone === 'error' ? 'alert' : undefined} style={{ backgroundColor: t.bg }} className="flex-row gap-3 rounded-2xl p-4">
      <Ionicons name={t.icon} size={20} color={t.fg} style={{ marginTop: 1 }} />
      <View className="flex-1 gap-1">
        {title ? <Text style={{ color: t.fg }} className="font-body-bold text-[15px]">{title}</Text> : null}
        <Text style={{ color: t.fg }} className="font-body text-[14px] leading-[20px]">{message}</Text>
        {action ? (
          <Text accessibilityRole="button" onPress={action.onPress} style={{ color: t.fg }} className="pt-1 font-body-extrabold text-[14px] underline">
            {action.label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
