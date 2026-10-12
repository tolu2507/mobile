import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';

import type { Quest } from '@/types/api';

const icons: Record<Quest['icon'], keyof typeof MaterialCommunityIcons.glyphMap> = {
  math: 'sigma',
  science: 'flask-outline',
  book: 'book-open-variant',
  globe: 'earth',
  art: 'palette-outline',
  words: 'alphabetical-variant',
};

export const toneColors: Record<Quest['tone'], { bg: string; fg: string; bar: string; solid: string; ledge: string; onSolid: string }> = {
  violet: { bg: '#E4DEFF', fg: '#4B2FE0', bar: '#6C4BFF', solid: '#6C4BFF', ledge: '#4426C9', onSolid: '#FFFFFF' },
  mint: { bg: '#D3F5EA', fg: '#0B7A5E', bar: '#19C39C', solid: '#19C39C', ledge: '#0E8F72', onSolid: '#08372B' },
  coral: { bg: '#FFE1D9', fg: '#C2410C', bar: '#E2552F', solid: '#E2552F', ledge: '#A3330F', onSolid: '#FFFFFF' },
  sky: { bg: '#EAF2FF', fg: '#1A4FA0', bar: '#2FA8FF', solid: '#2FA8FF', ledge: '#1479C2', onSolid: '#062E4D' },
  sun: { bg: '#FFF1CC', fg: '#7A5200', bar: '#FFC53D', solid: '#FFFFFF', ledge: '#F1D98A', onSolid: '#1E1838' },
};

export function SubjectIcon({ icon, tone, size = 46 }: { icon: Quest['icon']; tone: Quest['tone']; size?: number }) {
  const t = toneColors[tone];
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.3, backgroundColor: t.bg }} className="items-center justify-center">
      <MaterialCommunityIcons name={icons[icon]} size={size * 0.52} color={t.fg} />
    </View>
  );
}

export { icons as subjectIcons };
