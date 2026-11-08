import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { AVATARS } from '@/features/student/avatars';

const tones = [
  { bg: '#FFE1D9', fg: '#A3330F' },
  { bg: '#E4DEFF', fg: '#4426C9' },
  { bg: '#D3F5EA', fg: '#0B5A4C' },
  { bg: '#FFF1CC', fg: '#7A5200' },
];

/** A child's picked cartoon avatar, else initials with a colour picked from the name, so the same person always looks the same. */
export function Avatar({ initials, avatar, size = 48, radius = 16 }: { initials: string; avatar?: string | null; size?: number; radius?: number }) {
  const t = tones[(initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % tones.length];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ width: size, height: size, borderRadius: radius, backgroundColor: t.bg, overflow: 'hidden' }}
      className="items-center justify-center"
    >
      {avatar && AVATARS[avatar] ? (
        <Image source={AVATARS[avatar]} style={{ width: size * 0.92, height: size * 0.92, marginTop: size * 0.08 }} contentFit="contain" />
      ) : (
        <Text style={{ color: t.fg, fontSize: size * 0.38 }} className="font-display">
          {initials}
        </Text>
      )}
    </View>
  );
}
