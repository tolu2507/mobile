import { useEffect, useState } from 'react';

import { NumberFlow } from '@/components/reacticx/molecules/number-flow';

/** Rolls a number up from `from` once mounted, after `delay` ms (Reacticx number-flow digits). */
export function CountUp({ value, from = 0, delay = 300, fontSize = 22, color, fontWeight = '800' }: { value: number; from?: number; delay?: number; fontSize?: number; color: string; fontWeight?: '600' | '700' | '800' }) {
  const [shown, setShown] = useState(from);
  useEffect(() => {
    const t = setTimeout(() => setShown(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return <NumberFlow value={shown} fontSize={fontSize} color={color} fontWeight={fontWeight} />;
}
