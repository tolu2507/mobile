import { Text, View } from 'react-native';

const tones = [
  { bg: '#FFE1D9', fg: '#A3330F' },
  { bg: '#E4DEFF', fg: '#4426C9' },
  { bg: '#D3F5EA', fg: '#0B5A4C' },
  { bg: '#FFF1CC', fg: '#7A5200' },
];

/** Initials avatar with a colour picked from the name, so the same person always looks the same. */
export function Avatar({ initials, size = 48, radius = 16 }: { initials: string; size?: number; radius?: number }) {
  const t = tones[(initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % tones.length];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ width: size, height: size, borderRadius: radius, backgroundColor: t.bg }}
      className="items-center justify-center"
    >
      <Text style={{ color: t.fg, fontSize: size * 0.38 }} className="font-display">
        {initials}
      </Text>
    </View>
  );
}
