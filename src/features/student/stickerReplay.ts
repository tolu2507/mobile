import { create } from 'zustand';

import type { Badge } from '@/types/api';

/** A collected sticker the child tapped to watch its unlock again. StickerCelebrations plays it. */
export const useStickerReplay = create<{ badge: Badge | null; replay: (b: Badge) => void; stop: () => void }>()((set) => ({
  badge: null,
  replay: (badge) => set({ badge }),
  stop: () => set({ badge: null }),
}));
