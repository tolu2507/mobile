/**
 * BrainBox design tokens — the single source of truth for colour and type.
 * Used by tailwind.config.js (class names) and by TS code (style props, charts, icons).
 * Plain CommonJS so the Tailwind config can require it.
 */

const palette = {
  violet: { 50: '#F4F2FF', 100: '#E4DEFF', 200: '#B9A9FF', 400: '#6C4BFF', 500: '#5B3DF5', 700: '#4426C9', 800: '#3A22C9' },
  sun: { 50: '#FFF6DA', 100: '#FFF1CC', 400: '#FFC53D', 600: '#D49A00', 800: '#7A5200' },
  mint: { 50: '#E2F5EF', 100: '#D3F5EA', 400: '#19C39C', 600: '#0E8F7A', 700: '#0B6E5E', 800: '#0B5A4C' },
  coral: { 50: '#FFF5F1', 100: '#FFE1D9', 400: '#FF6B4A', 500: '#E2552F', 700: '#A3330F' },
  sky: { 100: '#EAF2FF', 400: '#2FA8FF', 600: '#1D6FE0', 800: '#1A4FA0' },
  amber: { 50: '#FFF4E5', 500: '#F08A24', 700: '#B35A00', 800: '#7A3D00' },
  ink: { DEFAULT: '#17133A', 900: '#0E0B26', 700: '#3A3660', 500: '#5A5680', 300: '#8A85B0', 200: '#E2DEF5', 100: '#EEEBFB' },
  paper: '#F5F4FB',
  white: '#FFFFFF',
};

/** Each role gets its own world: accent, soft background, and the colour of its "pressed" shadow. */
const roles = {
  student: { accent: palette.violet[500], accentSoft: palette.violet[100], bg: palette.violet[50], shadow: palette.violet[700], onAccent: palette.white },
  studentPrimary: { accent: palette.coral[500], accentSoft: palette.coral[100], bg: palette.sun[50], shadow: '#C63F1D', onAccent: palette.white },
  parent: { accent: palette.mint[600], accentSoft: palette.mint[50], bg: '#F3F8F6', shadow: palette.mint[800], onAccent: palette.white },
  tuckshop: { accent: palette.amber[500], accentSoft: palette.amber[50], bg: '#FBF7F1', shadow: palette.amber[700], onAccent: palette.white },
  staff: { accent: palette.violet[500], accentSoft: palette.violet[100], bg: palette.paper, shadow: palette.violet[700], onAccent: palette.white },
};

/** Font family names as registered by @expo-google-fonts in src/app/_layout.tsx. */
const fonts = {
  display: 'BricolageGrotesque_800ExtraBold',
  displayBold: 'BricolageGrotesque_700Bold',
  body: 'Figtree_400Regular',
  bodyMedium: 'Figtree_500Medium',
  bodySemibold: 'Figtree_600SemiBold',
  bodyBold: 'Figtree_700Bold',
  bodyExtrabold: 'Figtree_800ExtraBold',
};

module.exports = { palette, roles, fonts };
