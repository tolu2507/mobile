/**
 * Nursery questions are pictures and a voice (see backend templates/nursery):
 * the first paragraph is the question, emoji paragraphs are the picture, and a "🔊 …" paragraph is heard but not shown.
 */
export type NurseryStem = { question: string; picture: string | null; spoken: string };

export function parseNurseryStem(stem: string): NurseryStem {
  const [question = '', ...rest] = stem.split(/\n\s*\n/).map((p) => p.trim());
  const cue = rest.find((p) => p.startsWith('🔊'))?.replace('🔊', '').trim();
  const picture = rest.filter((p) => !p.startsWith('🔊')).join('\n') || null;
  return { question, picture, spoken: cue ? `${question} ${cue}` : question };
}

/** "🐝 bee" → picture and word; "🔴" or "🍎🍎🍎" → picture only; "7" or "B" → text only. */
export function parseNurseryLabel(label: string): { picture: string | null; word: string | null } {
  const hasText = (s: string) => /[A-Za-z0-9]/.test(s);
  if (!hasText(label)) return { picture: label, word: null };
  const space = label.indexOf(' ');
  if (space > 0 && !hasText(label.slice(0, space))) return { picture: label.slice(0, space), word: label.slice(space + 1) };
  return { picture: null, word: label };
}

/** Roughly how many pictures are in a string (variation selectors and joiners don't count). */
export const pictureCount = (s: string) => [...s.replace(/[\uFE0F\u200D\s]/g, '')].length;

export const PRAISE = ['Well done!', 'Great job!', 'Yes! That’s right!', 'Brilliant!', 'You got it!', 'Super!'];
export const TRY_AGAIN = ['Oops!', 'Not that one.', 'Good try!'];

/** A picture for each nursery subtopic (names as in the backend nursery templates), so the map needs no reading. */
const TOPIC_PICTURES: Record<string, string> = {
  'Count the pictures': '🍎',
  'Find the number': '🔢',
  'More and fewer': '🍌',
  'What comes next': '➡️',
  'Adding pictures': '➕',
  'Taking away': '➖',
  'Find the letter': '🔤',
  'First sounds': '🐝',
  'Big and small letters': '🅰️',
  'Rhyming words': '🎵',
  'Find the colour': '🎨',
  'Colours of things': '🍅',
  'Find the shape': '🔺',
  'Shapes around us': '⚽',
  'Parts of my body': '👀',
  'Animal sounds': '🐄',
  'Where animals live': '🐟',
  'Things we use': '☂️',
  'Odd one out': '🤔',
};
export const topicPicture = (name: string) => TOPIC_PICTURES[name] ?? '⭐';
