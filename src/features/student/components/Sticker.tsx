import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { palette } from '@/theme';
import type { Badge, StickerRarity } from '@/types/api';

/** Each rarity has its own colours, so a Legendary looks like a Legendary from across the room. */
export const RARITY: Record<StickerRarity, { label: string; face: string; ring: string; glow: string; text: string; backdrop: string }> = {
  COMMON: { label: 'Common', face: palette.sky[400], ring: '#BFE3FF', glow: '#7CC8FF', text: palette.sky[800], backdrop: '#06223D' },
  RARE: { label: 'Rare', face: palette.violet[500], ring: palette.violet[200], glow: '#9D85FF', text: palette.violet[800], backdrop: '#160A4D' },
  EPIC: { label: 'Epic', face: palette.coral[400], ring: '#FFC2B3', glow: '#FF9B7F', text: palette.coral[700], backdrop: '#3D0F05' },
  LEGENDARY: { label: 'Legendary', face: palette.sun[400], ring: '#FFE7A3', glow: '#FFD866', text: palette.sun[800], backdrop: '#2B1D00' },
};

/** Ionicons name from the API, or a star if this version of the app doesn't have that icon. */
export function stickerIcon(name: string | null): keyof typeof Ionicons.glyphMap {
  return name && name in Ionicons.glyphMap ? (name as keyof typeof Ionicons.glyphMap) : 'star';
}

/**
 * The sticker itself: a coloured face with a ring in its rarity's colours. Locked stickers show their
 * picture greyed out (so children can see what they're working towards) with a small padlock.
 */
export function StickerFace({ icon, rarity, earned = true, size = 64 }: { icon: string | null; rarity: StickerRarity; earned?: boolean; size?: number }) {
  const r = RARITY[rarity];
  const ring = Math.max(3, Math.round(size * 0.07));
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size,
          borderWidth: ring,
          borderColor: earned ? r.ring : palette.ink[100],
          backgroundColor: earned ? r.face : palette.ink[200],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={stickerIcon(icon)} size={size * 0.46} color={earned ? '#FFFFFF' : 'rgba(255,255,255,0.75)'} />
      </View>
      {!earned ? (
        <View style={{ position: 'absolute', right: -2, bottom: -2, width: size * 0.36, height: size * 0.36, borderRadius: size, backgroundColor: palette.ink[500], borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="lock-closed" size={size * 0.18} color="#FFFFFF" />
        </View>
      ) : null}
    </View>
  );
}

/** A gold coin: what children collect towards ₦1,000 for their family. */
export function Coin({ size = 18 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size, backgroundColor: palette.sun[400], borderWidth: Math.max(2, size * 0.12), borderColor: palette.sun[600], alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name="star" size={size * 0.48} color={palette.sun[800]} />
    </View>
  );
}

export function RarityPill({ rarity, dark = false }: { rarity: StickerRarity; dark?: boolean }) {
  const r = RARITY[rarity];
  return (
    <View style={{ backgroundColor: dark ? r.face : `${r.face}22`, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, alignSelf: 'center' }}>
      <Text style={{ color: dark ? '#FFFFFF' : r.text, letterSpacing: 1 }} className="font-body-extrabold text-[11px] uppercase">
        {r.label}
      </Text>
    </View>
  );
}

/** "7 of 25" with a bar, or a hint for stickers that can't be counted (mock ranks). */
export function StickerProgress({ b, color }: { b: Badge; color: string }) {
  if (!b.progress) return null;
  const { current, target } = b.progress;
  if (target == null) {
    return <Text className="text-center font-body text-[11px] text-ink-500">{b.code.startsWith('MOCK_') ? 'Sit a Friday mock' : 'Keep going!'}</Text>;
  }
  const pct = Math.min(1, current / target);
  return (
    <View className="w-full gap-1 px-1" accessibilityLabel={`${current} of ${target}`}>
      <View style={{ height: 6, borderRadius: 6, backgroundColor: palette.ink[100], overflow: 'hidden' }}>
        <View style={{ width: `${Math.max(pct * 100, pct > 0 ? 6 : 0)}%`, height: 6, borderRadius: 6, backgroundColor: color }} />
      </View>
      <Text className="text-center font-body-semibold text-[11px] text-ink-500">
        {current.toLocaleString()} / {target.toLocaleString()}
      </Text>
    </View>
  );
}

/** The locked sticker a child is closest to, for "Next up" teasers. */
export function nextUp(badges: Badge[] | undefined): Badge | null {
  const open = (badges ?? []).filter((b) => !b.earned && b.progress?.target);
  if (!open.length) return null;
  return open.reduce((best, b) => (b.progress!.current / b.progress!.target! > best.progress!.current / best.progress!.target! ? b : best));
}
