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
  /** Text and icons on `land` (passes 4.5:1). */
  ink: string;
  /** Text on `bg`, softer than ink. */
  muted: string;
  /** Locked nodes and empty progress. */
  locked: string;
};

const WORLDS: Record<Quest['icon'], World> = {
  math: { key: 'math', name: 'Number Island', bg: '#FFF1E2', land: '#FF7A2F', ledge: '#C9520F', ink: '#2A0E02', muted: '#7A3A12', locked: '#F2D6BC' },
  words: { key: 'words', name: 'Word Forest', bg: '#E6F8EE', land: '#2FB36B', ledge: '#1B7E48', ink: '#04230F', muted: '#145C35', locked: '#BFE6CF' },
  science: { key: 'science', name: 'Space Lab', bg: '#EEEBFF', land: '#8C7CFF', ledge: '#5545D1', ink: '#130B45', muted: '#3F338F', locked: '#D4CEFA' },
  globe: { key: 'globe', name: 'Heritage Land', bg: '#E2F6F4', land: '#14B3AE', ledge: '#0B7C78', ink: '#032B2A', muted: '#0B5C5C', locked: '#B9E3E0' },
  book: { key: 'book', name: 'Wisdom Hills', bg: '#FFF6DA', land: '#FFC53D', ledge: '#C99300', ink: '#3D2A00', muted: '#6E4C00', locked: '#F3E2AE' },
  art: { key: 'art', name: 'Colour Coast', bg: '#FFEAF3', land: '#FF6FAE', ledge: '#C9407E', ink: '#3A0820', muted: '#8A1F52', locked: '#F7C9DD' },
};

export function worldFor(slug: string): World {
  return WORLDS[subjectLook(slug).icon];
}
