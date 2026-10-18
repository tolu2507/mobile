/**
 * A small LaTeX reader for exam questions: enough for school maths (fractions, powers, roots,
 * symbols, units), so we can draw it with plain React Native views on Android, iOS and the web.
 */

export type MathNode =
  | { t: 'text'; s: string; italic?: boolean; op?: boolean; bold?: boolean }
  | { t: 'frac'; num: MathNode[]; den: MathNode[] }
  | { t: 'sup'; body: MathNode[] }
  | { t: 'sub'; body: MathNode[] }
  | { t: 'sqrt'; body: MathNode[]; index?: MathNode[] }
  | { t: 'over'; body: MathNode[] }
  | { t: 'matrix'; rows: MathNode[][][]; delim: '(' | '[' | '|' | '' };

/**
 * A run of prose or of maths. Prose is split into words so lines wrap naturally.
 * `glue` means there was no space before it in the source ("$x$." or "($M$)"), so it stays on the same line with no gap.
 */
export type Piece = { kind: 'word'; s: string; glue: boolean; italic?: boolean } | { kind: 'math'; nodes: MathNode[]; glue: boolean } | { kind: 'break' };

const SYMBOLS: Record<string, string> = {
  times: '×', div: '÷', pm: '±', mp: '∓', cdot: '·', ast: '∗', le: '≤', leq: '≤', ge: '≥', geq: '≥', ne: '≠', neq: '≠',
  approx: '≈', equiv: '≡', sim: '∼', cong: '≅', propto: '∝', infty: '∞', angle: '∠', triangle: '△', degree: '°', circ: '°',
  therefore: '∴', because: '∵', to: '→', rightarrow: '→', leftarrow: '←', Rightarrow: '⇒', Leftrightarrow: '⇔', iff: '⇔',
  implies: '⇒', in: '∈', notin: '∉', ni: '∋', subset: '⊂', subseteq: '⊆', supset: '⊃', cup: '∪', cap: '∩', emptyset: '∅',
  varnothing: '∅', forall: '∀', exists: '∃', neg: '¬', land: '∧', lor: '∨', sum: 'Σ', prod: 'Π', int: '∫', partial: '∂',
  nabla: '∇', perp: '⊥', parallel: '∥', mid: '|', ldots: '…', cdots: '⋯', dots: '…', prime: '′', naira: '₦',
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ',
  iota: 'ι', kappa: 'κ', lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', upsilon: 'υ',
  phi: 'φ', varphi: 'φ', chi: 'χ', psi: 'ψ', omega: 'ω', Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ', Pi: 'Π',
  Sigma: 'Σ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω', lbrace: '{', rbrace: '}', langle: '⟨', rangle: '⟩', vert: '|', lvert: '|',
  rvert: '|', percent: '%', quad: '  ', qquad: '    ', colon: ':',
};
const OPERATORS = new Set(['+', '−', '=', '×', '÷', '±', '∓', '<', '>', '≤', '≥', '≠', '≈', '≡', '→', '⇒', '⇔', '∈', '∉', '⊂', '⊆', '∪', '∩', '∼', '≅', '∝', '·']);
const FUNCTIONS = new Set(['sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'cosec', 'log', 'ln', 'exp', 'lim', 'max', 'min', 'det', 'arcsin', 'arccos', 'arctan', 'sinh', 'cosh', 'tanh', 'mod', 'gcd']);
const RAW_TEXT = new Set(['text', 'textrm', 'mathrm', 'mbox', 'operatorname', 'textit', 'mathit', 'textnormal']);
const BOLD = new Set(['mathbf', 'textbf', 'boldsymbol', 'bm']);
const OVER = new Set(['overline', 'bar', 'vec', 'hat', 'widehat', 'overrightarrow']);

class Reader {
  i = 0;
  constructor(readonly s: string) {}
  peek() {
    return this.s[this.i];
  }
  done() {
    return this.i >= this.s.length;
  }
  skipSpace() {
    while (!this.done() && /\s/.test(this.s[this.i])) this.i++;
  }
  /** The text inside the next {…}, braces balanced, without reading commands. */
  rawGroup() {
    this.skipSpace();
    if (this.peek() !== '{') return this.done() ? '' : this.s[this.i++];
    let depth = 0;
    const start = ++this.i;
    while (!this.done()) {
      const c = this.s[this.i];
      if (c === '\\') this.i += 2;
      else if (c === '{') {
        depth++;
        this.i++;
      }
      else if (c === '}' && depth-- === 0) break;
      else this.i++;
    }
    const out = this.s.slice(start, this.i);
    this.i++;
    return out.replace(/\\([{}%$&#_ ])/g, '$1');
  }
}

const text = (s: string, extra: Partial<Extract<MathNode, { t: 'text' }>> = {}): MathNode => ({ t: 'text', s, ...extra });

function readSeq(r: Reader, until?: '}' | ']'): MathNode[] {
  const out: MathNode[] = [];
  while (!r.done()) {
    const c = r.peek();
    if (c === until) {
      r.i++;
      break;
    }
    if (c === '}') {
      r.i++; // stray closing brace
      continue;
    }
    if (/\s/.test(c) || c === '&') {
      r.i++;
      continue;
    }
    if (c === '{') {
      r.i++;
      out.push(...readSeq(r, '}'));
    } else if (c === '^' || c === '_') {
      r.i++;
      out.push({ t: c === '^' ? 'sup' : 'sub', body: readArg(r) });
    } else if (c === '\\') {
      out.push(...readCommand(r));
    } else if (/[0-9.,₦£€]/.test(c)) {
      let s = '';
      if (/[₦£€]/.test(c)) s += r.s[r.i++]; // a currency sign stays with its amount
      while (!r.done() && /[0-9.,]/.test(r.peek())) s += r.s[r.i++];
      out.push(text(s));
    } else if (/[A-Za-z]/.test(c)) {
      r.i++;
      out.push(text(c, { italic: true }));
    } else {
      r.i++;
      const ch = c === '-' ? '−' : c === '*' ? '×' : c === "'" ? '′' : c;
      // A minus at the start, or after an operator or opening bracket, is a sign ("−3"), not subtraction.
      const prev = out[out.length - 1];
      const unary = (ch === '−' || ch === '+') && (!prev || (prev.t === 'text' && (prev.op || /[([{,]$/.test(prev.s))));
      out.push(text(ch, OPERATORS.has(ch) && !unary ? { op: true } : {}));
    }
  }
  return out;
}

/** One argument: {…}, a command, or a single character. */
function readArg(r: Reader): MathNode[] {
  r.skipSpace();
  const c = r.peek();
  if (c === undefined) return [];
  if (c === '{') {
    r.i++;
    return readSeq(r, '}');
  }
  if (c === '\\') return readCommand(r);
  r.i++;
  if (/[A-Za-z]/.test(c)) return [text(c, { italic: true })];
  return [text(c === '-' ? '−' : c)];
}

function readCommand(r: Reader): MathNode[] {
  r.i++; // the backslash
  const one = r.peek();
  if (one === undefined) return [];
  if (!/[A-Za-z]/.test(one)) {
    r.i++;
    if (one === ',' || one === ';' || one === ':' || one === ' ' || one === '>') return [text(' ')];
    if (one === '!' || one === '\\') return [];
    return [text(one)]; // \{ \} \% \$ \& \# \_ \|
  }
  let name = '';
  while (!r.done() && /[A-Za-z]/.test(r.peek())) name += r.s[r.i++];

  if (name === 'begin') {
    const env = r.rawGroup();
    const delim = ({ pmatrix: '(', bmatrix: '[', vmatrix: '|', matrix: '' } as const)[env as 'matrix'];
    const end = r.s.indexOf(`\\end{${env}}`, r.i);
    if (delim === undefined || end < 0) return [text(env)];
    const body = r.s.slice(r.i, end);
    r.i = end + `\\end{${env}}`.length;
    const rows = body.split('\\\\').map((row) => row.split('&').map((cell) => parseMath(cell.trim()))).filter((row) => row.some((c) => c.length));
    return [{ t: 'matrix', rows, delim }];
  }
  if (name === 'frac' || name === 'dfrac' || name === 'tfrac' || name === 'cfrac') return [{ t: 'frac', num: readArg(r), den: readArg(r) }];
  if (name === 'sqrt') {
    r.skipSpace();
    let index: MathNode[] | undefined;
    if (r.peek() === '[') {
      r.i++;
      index = readSeq(r, ']');
    }
    return [{ t: 'sqrt', body: readArg(r), index }];
  }
  if (RAW_TEXT.has(name)) return [text(r.rawGroup())];
  if (BOLD.has(name)) return readArg(r).map((n) => (n.t === 'text' ? { ...n, bold: true, italic: false } : n));
  if (OVER.has(name)) return [{ t: 'over', body: readArg(r) }];
  if (name === 'left' || name === 'right' || name === 'big' || name === 'Big' || name === 'bigg' || name === 'Bigg') {
    r.skipSpace();
    if (name !== 'left' && name !== 'right') return [];
    const d = readArg(r);
    return d.length === 1 && d[0].t === 'text' && d[0].s === '.' ? [] : d;
  }
  if (name === 'displaystyle' || name === 'textstyle' || name === 'limits' || name === 'nolimits') return [];
  if (FUNCTIONS.has(name)) return [text(name), text(' ')];
  const sym = SYMBOLS[name];
  if (sym) return [text(sym, OPERATORS.has(sym) ? { op: true } : {})];
  return [text(name)];
}

/** The last plain text node at the top level of some maths, if it ends with one. */
const lastText = (nodes: MathNode[]) => {
  const n = nodes[nodes.length - 1];
  return n?.t === 'text' ? n : null;
};

export function parseMath(src: string): MathNode[] {
  return readSeq(new Reader(src));
}

/** Splits text on $…$ (and $$…$$). Escaped \$ stays a dollar sign. Markdown bold markers are dropped. */
export function parseRich(input: string): Piece[] {
  const out: Piece[] = [];
  let spaceBefore = true; // whether the source had a space just before the next piece
  let italic = false; // inside *…* (English questions mark the tested word this way)
  const prose = (s: string) => {
    s.replace(/\\\$/g, '$')
      .replace(/\*\*/g, '')
      .split('\n')
      .forEach((line, i) => {
        if (i > 0) {
          out.push({ kind: 'break' });
          spaceBefore = true;
        }
        const words = line.split(/ +/);
        words.forEach((w, j) => {
          const prev = out[out.length - 1];
          const glue = j === 0 && !spaceBefore;
          const tail = glue && prev?.kind === 'math' ? lastText(prev.nodes) : null;
          const punct = w.match(/^[.,;:!?)\]]+/)?.[0];
          if (tail && punct) {
            tail.s += punct;
            w = w.slice(punct.length);
          }
          // *word* or *two words*, possibly followed by punctuation: "*candid*."
          const opens = /^\*[^*]/.test(w);
          if (opens) w = w.slice(1);
          const closes = (italic || opens) && /[^*]\*[^\w*]*$/.test(w);
          let after = '';
          if (closes) {
            after = w.match(/\*([^\w*]*)$/)![1];
            w = w.slice(0, w.length - after.length - 1);
          }
          if (w) out.push({ kind: 'word', s: w, glue, ...(italic || opens ? { italic: true } : {}) });
          if (after) out.push({ kind: 'word', s: after, glue: true });
          if (opens) italic = true;
          if (closes) italic = false;
          spaceBefore = true;
        });
        spaceBefore = words[words.length - 1] === '';
      });
  };
  const re = /(?<!\\)\$\$?([^$]+?)(?<!\\)\$\$?/g;
  let last = 0;
  for (const m of input.matchAll(re)) {
    if (m.index > last) prose(input.slice(last, m.index));
    else if (m.index === 0) spaceBefore = true;
    const nodes = parseMath(m[1]);
    const prev = out[out.length - 1];
    let glue = !spaceBefore;
    // "(" or "[" right before the maths moves inside it.
    if (!spaceBefore && prev?.kind === 'word' && /[([]$/.test(prev.s) && nodes[0]?.t === 'text') {
      const open = prev.s.match(/[([]+$/)![0];
      nodes[0] = { ...nodes[0], s: open + nodes[0].s };
      prev.s = prev.s.slice(0, -open.length);
      if (!prev.s) {
        out.pop();
        glue = prev.glue;
      }
    }
    out.push({ kind: 'math', nodes, glue });
    spaceBefore = false;
    last = m.index + m[0].length;
  }
  if (last < input.length) prose(input.slice(last));
  return out;
}

/** What a screen reader should say for a piece of maths. */
export function speak(nodes: MathNode[]): string {
  return nodes
    .map((n) => {
      switch (n.t) {
        case 'text':
          return { '+': ' plus ', '−': ' minus ', '×': ' times ', '÷': ' divided by ', '=': ' equals ', '±': ' plus or minus ', '≤': ' at most ', '≥': ' at least ', '≠': ' is not ', '°': ' degrees' }[n.s] ?? n.s;
        case 'frac':
          return ` ${speak(n.num)} over ${speak(n.den)} `;
        case 'sup':
          return speak(n.body) === 'degrees' ? ' degrees' : speak(n.body) === '2' ? ' squared' : speak(n.body) === '3' ? ' cubed' : ` to the power ${speak(n.body)} `;
        case 'sub':
          return ` sub ${speak(n.body)} `;
        case 'sqrt':
          return n.index ? ` root ${speak(n.index)} of ${speak(n.body)} ` : ` square root of ${speak(n.body)} `;
        case 'over':
          return ` ${speak(n.body)} bar `;
        case 'matrix':
          return ` ${n.delim === '|' ? 'determinant' : 'matrix'} with rows ${n.rows.map((row) => row.map(speak).join(', ')).join('; ')} `;
      }
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

export const speakRich = (input: string) =>
  parseRich(input)
    .map((p) => (p.kind === 'word' ? p.s : p.kind === 'math' ? speak(p.nodes) : '.'))
    .join(' ');
