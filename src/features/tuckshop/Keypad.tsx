import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { palette } from '@/theme';

type Key = string | 'back' | null;

/**
 * Big on-screen number pad for the counter. No system keyboard: it's quicker, the keys are large
 * enough for small fingers, and it looks the same on every Android phone.
 */
export function Keypad({ onKey, extra = null, disabled, tone = 'light' }: { onKey: (key: string | 'back') => void; extra?: string | null; disabled?: boolean; tone?: 'light' | 'dark' }) {
  const rows: Key[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [extra, '0', 'back'],
  ];
  const dark = tone === 'dark';
  return (
    <View style={{ gap: 10, opacity: disabled ? 0.5 : 1 }}>
      {rows.map((row, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
          {row.map((key, j) =>
            key === null ? (
              <View key={j} style={{ flex: 1 }} />
            ) : (
              <Pressable
                key={j}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel={key === 'back' ? 'Delete' : key}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onKey(key);
                }}
                style={({ pressed }) => ({
                  flex: 1,
                  height: 64,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: dark ? (pressed ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.14)') : pressed ? palette.ink[200] : palette.white,
                })}
              >
                {key === 'back' ? (
                  <Ionicons name="backspace-outline" size={26} color={dark ? palette.white : palette.ink.DEFAULT} />
                ) : (
                  <Text style={{ fontSize: 26, color: dark ? palette.white : palette.ink.DEFAULT }} className="font-display-bold">
                    {key}
                  </Text>
                )}
              </Pressable>
            ),
          )}
        </View>
      ))}
    </View>
  );
}
