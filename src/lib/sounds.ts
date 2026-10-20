import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { useVoice } from './speech';

/** Short effects made for BrainBox (synthesised, see assets/sounds). */
const SOURCES = {
  whoosh: require('../../assets/sounds/whoosh.wav'),
  chime: require('../../assets/sounds/chime.wav'),
  coin: require('../../assets/sounds/coin.wav'),
  fanfare: require('../../assets/sounds/fanfare.wav'),
};
export type Sound = keyof typeof SOURCES;

// A handful of players kept for the life of the app, so effects start instantly the second time.
const players: Partial<Record<Sound, AudioPlayer>> = {};
let modeSet = false;

/**
 * Plays an effect unless the child turned sounds off (the same switch as the nursery voice).
 * Quiet when the phone is on silent or vibrate, and mixes with music instead of stopping it. Never throws.
 */
export function playSound(name: Sound) {
  if (useVoice.getState().muted) return;
  try {
    if (!modeSet) {
      modeSet = true;
      void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers', shouldPlayInBackground: false }).catch(() => {});
    }
    const player = (players[name] ??= createAudioPlayer(SOURCES[name]));
    void player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // A sound effect is never worth an error.
  }
}
