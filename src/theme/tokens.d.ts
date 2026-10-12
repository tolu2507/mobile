type Shade = Record<string | number, string>;
export declare const palette: {
  violet: Shade; sun: Shade; mint: Shade; coral: Shade; sky: Shade; amber: Shade;
  ink: Shade & { DEFAULT: string }; paper: string; white: string;
};
type Role = { accent: string; accentSoft: string; bg: string; shadow: string; onAccent: string };
export declare const roles: { student: Role; studentPrimary: Role; parent: Role; tutor: Role; tuckshop: Role; staff: Role };
export declare const fonts: {
  display: string; displayBold: string; body: string; bodyMedium: string;
  bodySemibold: string; bodyBold: string; bodyExtrabold: string;
};
declare const _default: { palette: typeof palette; roles: typeof roles; fonts: typeof fonts };
export default _default;
