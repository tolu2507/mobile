import * as Speech from 'expo-speech';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from './storage';

/** Whether the app reads nursery questions aloud. Remembered on this phone. */
export const useVoice = create<{ muted: boolean; toggle: () => void }>()(
  persist(
    (set) => ({
      muted: false,
      toggle: () =>
        set((s) => {
          if (!s.muted) Speech.stop();
          return { muted: !s.muted };
        }),
    }),
    { name: 'voice', storage: createJSONStorage(() => mmkvStorage) },
  ),
);

/** Reads text aloud for young children: a little slower than normal, cutting off anything still being said. Silent when muted. */
export function say(text: string, onDone?: () => void) {
  Speech.stop();
  if (useVoice.getState().muted) return onDone?.();
  Speech.speak(text, {
    rate: 0.85,
    pitch: 1.05,
    onDone,
    onStopped: onDone,
    onError: onDone,
  });
}

export function hush() {
  Speech.stop();
}
