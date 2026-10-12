import { Text as RNText, type TextProps } from 'react-native';

type Props = TextProps & { className?: string };

/** Big friendly numbers and headings (Bricolage Grotesque). */
export function Display({ className = '', ...props }: Props) {
  return <RNText accessibilityRole="header" className={`font-display text-ink ${className}`} {...props} />;
}

/** Section and card titles. */
export function Title({ className = '', ...props }: Props) {
  return <RNText className={`font-display-bold text-[20px] text-ink ${className}`} {...props} />;
}

/** Default body copy (Figtree). Readable on budget Android screens: never below 13px. */
export function Body({ className = '', ...props }: Props) {
  return <RNText className={`font-body text-[15px] leading-[22px] text-ink ${className}`} {...props} />;
}

export function Label({ className = '', ...props }: Props) {
  return <RNText className={`font-body-bold text-[15px] text-ink ${className}`} {...props} />;
}

export function Caption({ className = '', ...props }: Props) {
  return <RNText className={`font-body text-[13px] text-ink-500 ${className}`} {...props} />;
}
