import type { QuestIcon } from '@/types/api';

export type Mood = 'cheer' | 'think' | 'oops';

type WorldArt = {
  island: number;
  /** Tall 9:16 scene for behind the world's path. */
  bg: number;
  boss: number;
  mascot: number;
  moods: Record<Mood, number>;
};

/** Each world's Gemini art (prompts in docs/worlds-art.md), cut out and compressed to WebP in assets/worlds. */
export const WORLD_ART: Record<QuestIcon, WorldArt> = {
  math: {
    island: require('../../../assets/worlds/island-math.webp'),
    bg: require('../../../assets/worlds/bg-math.webp'),
    boss: require('../../../assets/worlds/boss-math.webp'),
    mascot: require('../../../assets/worlds/mascot-math.webp'),
    moods: {
      cheer: require('../../../assets/worlds/mascot-math-cheer.webp'),
      think: require('../../../assets/worlds/mascot-math-think.webp'),
      oops: require('../../../assets/worlds/mascot-math-oops.webp'),
    },
  },
  words: {
    island: require('../../../assets/worlds/island-words.webp'),
    bg: require('../../../assets/worlds/bg-words.webp'),
    boss: require('../../../assets/worlds/boss-words.webp'),
    mascot: require('../../../assets/worlds/mascot-words.webp'),
    moods: {
      cheer: require('../../../assets/worlds/mascot-words-cheer.webp'),
      think: require('../../../assets/worlds/mascot-words-think.webp'),
      oops: require('../../../assets/worlds/mascot-words-oops.webp'),
    },
  },
  science: {
    island: require('../../../assets/worlds/island-science.webp'),
    bg: require('../../../assets/worlds/bg-science.webp'),
    boss: require('../../../assets/worlds/boss-science.webp'),
    mascot: require('../../../assets/worlds/mascot-science.webp'),
    moods: {
      cheer: require('../../../assets/worlds/mascot-science-cheer.webp'),
      think: require('../../../assets/worlds/mascot-science-think.webp'),
      oops: require('../../../assets/worlds/mascot-science-oops.webp'),
    },
  },
  globe: {
    island: require('../../../assets/worlds/island-globe.webp'),
    bg: require('../../../assets/worlds/bg-globe.webp'),
    boss: require('../../../assets/worlds/boss-globe.webp'),
    mascot: require('../../../assets/worlds/mascot-globe.webp'),
    moods: {
      cheer: require('../../../assets/worlds/mascot-globe-cheer.webp'),
      think: require('../../../assets/worlds/mascot-globe-think.webp'),
      oops: require('../../../assets/worlds/mascot-globe-oops.webp'),
    },
  },
  book: {
    island: require('../../../assets/worlds/island-book.webp'),
    bg: require('../../../assets/worlds/bg-book.webp'),
    boss: require('../../../assets/worlds/boss-book.webp'),
    mascot: require('../../../assets/worlds/mascot-book.webp'),
    moods: {
      cheer: require('../../../assets/worlds/mascot-book-cheer.webp'),
      think: require('../../../assets/worlds/mascot-book-think.webp'),
      oops: require('../../../assets/worlds/mascot-book-oops.webp'),
    },
  },
  art: {
    island: require('../../../assets/worlds/island-art.webp'),
    bg: require('../../../assets/worlds/bg-art.webp'),
    boss: require('../../../assets/worlds/boss-art.webp'),
    mascot: require('../../../assets/worlds/mascot-art.webp'),
    moods: {
      cheer: require('../../../assets/worlds/mascot-art-cheer.webp'),
      think: require('../../../assets/worlds/mascot-art-think.webp'),
      oops: require('../../../assets/worlds/mascot-art-oops.webp'),
    },
  },
};

export const ARENA_BG = require('../../../assets/worlds/bg-arena.webp');
