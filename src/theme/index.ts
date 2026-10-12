import { fonts, palette, roles } from './tokens';

export { fonts, palette, roles };
export type RoleKey = keyof typeof roles;
export type RoleTheme = (typeof roles)[RoleKey];
