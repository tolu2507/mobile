import { View, type ViewProps } from 'react-native';

type Props = ViewProps & { className?: string; tone?: 'white' | 'ink' | 'soft' };

/** White surface with the BrainBox "ledge" shadow. */
export function Card({ className = '', tone = 'white', style, ...props }: Props) {
  const toneClass = tone === 'ink' ? 'bg-ink' : tone === 'soft' ? 'bg-white/70' : 'bg-white';
  return (
    <View
      className={`rounded-card p-4 ${toneClass} ${className}`}
      style={[tone === 'white' ? { shadowColor: '#2A1E7A', shadowOpacity: 0.06, shadowRadius: 0, shadowOffset: { width: 0, height: 2 }, elevation: 1 } : null, style]}
      {...props}
    />
  );
}
