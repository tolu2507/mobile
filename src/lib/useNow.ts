import { useEffect, useState } from 'react';

/** The current time, refreshed every `every` ms, so countdowns stay live without reading the clock during render. */
export function useNow(every = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(t);
  }, [every]);
  return now;
}
