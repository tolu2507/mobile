import type { MaterialCommunityIcons } from '@expo/vector-icons';

import { subjectLook } from '@/features/practice/subjects';
import type { Quest } from '@/types/api';

/** How a world looks. Every subject belongs to one world, picked by its family (see subjectLook). */
export type World = {
  key: Quest['icon'];
  name: string;
  /** Screen background inside the world. */
  bg: string;
  /** Header and current-level colour; text on it uses `ink`. */
  land: string;
  /** The darker "ledge" under land-coloured shapes. */
  ledge: string;
  /** The water around the island. */
  sea: string;
  /** Text and icons on `land` (passes 4.5:1). */
  ink: string;
  /** Text on `bg`, softer than ink. */
  muted: string;
  /** Locked nodes and empty progress. */
  locked: string;
  glyph: { text: string } | { icon: keyof typeof MaterialCommunityIcons.glyphMap };
};

const WORLDS: Record<Quest['icon'], World> = {
  math: { key: 'math', name: 'Number Island', bg: '#FFF1E2', land: '#FF7A2F', ledge: '#C9520F', sea: '#9BDBFF', ink: '#2A0E02', muted: '#7A3A12', locked: '#F2D6BC', glyph: { text: '123' } },
  words: { key: 'words', name: 'Word Forest', bg: '#E6F8EE', land: '#2FB36B', ledge: '#1B7E48', sea: '#9BDBFF', ink: '#04230F', muted: '#145C35', locked: '#BFE6CF', glyph: { text: 'Aa' } },
  science: { key: 'science', name: 'Space Lab', bg: '#EEEBFF', land: '#8C7CFF', ledge: '#5545D1', sea: '#2B2760', ink: '#130B45', muted: '#3F338F', locked: '#D4CEFA', glyph: { icon: 'atom' } },
  globe: { key: 'globe', name: 'Heritage Land', bg: '#E2F6F4', land: '#14B3AE', ledge: '#0B7C78', sea: '#9BDBFF', ink: '#032B2A', muted: '#0B5C5C', locked: '#B9E3E0', glyph: { icon: 'earth' } },
  book: { key: 'book', name: 'Wisdom Hills', bg: '#FFF6DA', land: '#FFC53D', ledge: '#C99300', sea: '#9BDBFF', ink: '#3D2A00', muted: '#6E4C00', locked: '#F3E2AE', glyph: { icon: 'book-open-variant' } },
  art: { key: 'art', name: 'Colour Coast', bg: '#FFEAF3', land: '#FF6FAE', ledge: '#C9407E', sea: '#9BDBFF', ink: '#3A0820', muted: '#8A1F52', locked: '#F7C9DD', glyph: { icon: 'palette' } },
};

export function worldFor(slug: string): World {
  return WORLDS[subjectLook(slug).icon];
}
