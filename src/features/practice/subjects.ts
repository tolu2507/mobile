import type { Quest } from '@/types/api';

type Look = { icon: Quest['icon']; tone: Quest['tone'] };

/** Icon and colour for an exam subject, by its slug. */
export function subjectLook(slug: string): Look {
  if (/math|quantitative|numeracy/.test(slug)) return { icon: 'math', tone: 'violet' };
  if (/english|literature|verbal|french|yoruba|igbo|hausa|arabic/.test(slug)) return { icon: 'words', tone: 'coral' };
  if (/physics|chemistry|biology|science|agric|technology|computer|health/.test(slug)) return { icon: 'science', tone: 'mint' };
  if (/religious|crs|irs|moral/.test(slug)) return { icon: 'book', tone: 'sun' };
  if (/art|music|creative/.test(slug)) return { icon: 'art', tone: 'sun' };
  return { icon: 'globe', tone: 'sky' }; // economics, government, geography, history, civic, social studies, commerce, accounting…
}
