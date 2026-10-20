import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { palette } from '@/theme';

/** A lowercase b whose stem is a learner; the sun-yellow head is drawn separately so it can move. The tile is the "box". */
export const LOGO_B = 'M40.5 42 V80 H47.5 A16 16 0 0 0 47.5 48 H40.5';
export const LOGO_HEAD = { cx: 40.5, cy: 24, r: 10.5 };
/** The mark alone, without the tile, fills this part of the 100-unit grid (the splash image is cut the same way). */
export const MARK_VIEWBOX = '7.5 7.5 85 85';

/** The BrainBox mark. `tile` puts it on the violet rounded square used for the app icon. */
export function LogoMark({ size = 40, tile = true }: { size?: number; tile?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox={tile ? '0 0 100 100' : MARK_VIEWBOX} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {tile ? <Rect width={100} height={100} rx={26} fill={palette.violet[500]} /> : null}
      <Path d={LOGO_B} fill="none" stroke="#FFFFFF" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
      <Circle {...LOGO_HEAD} fill={palette.sun[400]} />
    </Svg>
  );
}
