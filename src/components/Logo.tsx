import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { palette } from '@/theme';

/** The N; its last stroke is a learner, whose sun-yellow head is drawn separately so it can move. */
export const LOGO_N = 'M27 75 V31 L69 73 V50';
export const LOGO_HEAD = { cx: 69, cy: 29, r: 9.5 };

/** The Nexus mark. `tile` puts it on the violet rounded square used for the app icon. */
export function LogoMark({ size = 40, tile = true }: { size?: number; tile?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox={tile ? '0 0 100 100' : '15 15 70 70'} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {tile ? <Rect width={100} height={100} rx={26} fill={palette.violet[500]} /> : null}
      <Path d={LOGO_N} fill="none" stroke="#FFFFFF" strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
      <Circle {...LOGO_HEAD} fill={palette.sun[400]} />
    </Svg>
  );
}
