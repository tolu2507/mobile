import { Text, View } from 'react-native';

const tones = {
  sun: { bg: '#FFF1CC', fg: '#7A5200' },
  mint: { bg: '#E2F5EF', fg: '#0B5A4C' },
  violet: { bg: '#F1EDFF', fg: '#4426C9' },
  coral: { bg: '#FFE7DF', fg: '#A3330F' },
  sky: { bg: '#EAF2FF', fg: '#1A4FA0' },
  amber: { bg: '#FFF4E5', fg: '#7A3D00' },
  glass: { bg: 'rgba(255,255,255,0.16)', fg: '#FFFFFF' },
} as const;

export type PillTone = keyof typeof tones;

export function Pill({ label, tone = 'sun', icon }: { label: string; tone?: PillTone; icon?: React.ReactNode }) {
  const t = tones[tone];
  return (
    <View style={{ backgroundColor: t.bg }} className="flex-row items-center gap-1.5 self-start rounded-full px-3 py-1.5">
      {icon}
      <Text style={{ color: t.fg }} className="font-body-bold text-[13px]">
        {label}
      </Text>
    </View>
  );
}
