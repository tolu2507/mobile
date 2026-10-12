import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/** All on-device storage for Nexus lives in MMKV (fast, synchronous, sandboxed to the app). */
export const storage = createMMKV({ id: 'nexus' });

/** Adapter so Zustand's `persist` can save into MMKV. */
export const mmkvStorage: StateStorage = {
  getItem: (key) => storage.getString(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => {
    storage.remove(key);
  },
};

/** The Expo push token registered for the signed-in person on this phone (removed on sign-out). */
export const PUSH_TOKEN_KEY = 'push-token';
