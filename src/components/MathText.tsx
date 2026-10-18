import { memo, useMemo } from 'react';
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { parseRich, speakRich, type MathNode, type Piece } from '@/lib/latex';
import { fonts, palette } from '@/theme';

type Props = {
  text: string;
  size?: number;
  color?: string;
  fontFamily?: string;
  /** Font for numbers and letters inside $…$. Defaults to the prose font. */
  mathFont?: string;
  style?: StyleProp<ViewStyle>;
};

const MIN = 11;

/**
 * Text with $…$ maths (fractions, powers, roots, symbols) drawn with plain views, so it works on
 * Android, iOS and the web without a WebView. Text without maths is a single <Text>.
 */
export const MathText = memo(function MathText({ text, size = 16, color = palette.ink.DEFAULT, fontFamily = fonts.body, mathFont, style }: Props) {
  const pieces = useMemo(() => (text.includes('$') ? parseRich(text) : null), [text]);
  const base: TextStyle = { fontSize: size, lineHeight: Math.round(size * 1.35), color, fontFamily };
  if (!pieces) return <Text style={[base, style as StyleProp<TextStyle>]}>{text}</Text>;

  // Glued pieces ("$x$." or "($M$)") share a chunk, so they wrap together with no gap.
  const chunks: (Piece[] | 'break')[] = [];
  for (const p of pieces) {
    if (p.kind === 'break') chunks.push('break');
    else if (p.glue && Array.isArray(chunks[chunks.length - 1])) (chunks[chunks.length - 1] as Piece[]).push(p);
    else chunks.push([p]);
  }
  const gap = size * 0.28;
  const ctx: Ctx = { color, font: mathFont ?? fontFamily };

  return (
    <View accessible accessibilityRole="text" accessibilityLabel={speakRich(text)} style={[{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: size * 0.2 }, style]}>
      {chunks.map((chunk, i) =>
        chunk === 'break' ? (
          <View key={i} style={{ width: '100%' }} />
        ) : (
          <View key={i} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', maxWidth: '100%', flexShrink: 1, marginRight: gap }}>
            {chunk.map((p, j) => (p.kind === 'word' ? <Text key={j} style={base}>{p.s}</Text> : p.kind === 'math' ? <MathRow key={j} nodes={p.nodes} size={size} ctx={ctx} /> : null))}
          </View>
        ),
      )}
    </View>
  );
});

type Ctx = { color: string; font: string };

function MathRow({ nodes, size, ctx }: { nodes: MathNode[]; size: number; ctx: Ctx }) {
  const rule = Math.max(1, size / 14);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', maxWidth: '100%', flexShrink: 1 }}>
      {nodes.map((n, i) => {
        switch (n.t) {
          case 'text':
            return (
              <Text
                key={i}
                style={{
                  fontSize: size,
                  lineHeight: Math.round(size * 1.3),
                  color: ctx.color,
                  fontFamily: n.bold ? fonts.bodyBold : ctx.font,
                  fontStyle: n.italic ? 'italic' : 'normal',
                  marginHorizontal: n.op ? size * 0.22 : 0,
                }}
              >
                {n.s}
              </Text>
            );
          case 'frac': {
            const inner = Math.max(MIN, size * 0.85);
            return (
              <View key={i} style={{ alignItems: 'center', marginHorizontal: 2, paddingVertical: 1 }}>
                <MathRow nodes={n.num} size={inner} ctx={ctx} />
                <View style={{ alignSelf: 'stretch', height: rule, backgroundColor: ctx.color, marginVertical: 1 }} />
                <MathRow nodes={n.den} size={inner} ctx={ctx} />
              </View>
            );
          }
          case 'sup':
          case 'sub': {
            const inner = Math.max(MIN - 1, size * 0.68);
            // In a centred row, a bottom margin lifts the box and a top margin drops it.
            return (
              <View key={i} style={n.t === 'sup' ? { marginBottom: size * 0.7, marginLeft: 1 } : { marginTop: size * 0.55, marginLeft: 1 }}>
                <MathRow nodes={n.body} size={inner} ctx={ctx} />
              </View>
            );
          }
          case 'sqrt':
            return (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-end', marginHorizontal: 1 }}>
                {n.index ? (
                  <View style={{ marginBottom: size * 0.55, marginRight: -size * 0.15 }}>
                    <MathRow nodes={n.index} size={Math.max(MIN - 2, size * 0.55)} ctx={ctx} />
                  </View>
                ) : null}
                <Text style={{ fontSize: size * 1.15, lineHeight: Math.round(size * 1.4), color: ctx.color, fontFamily: ctx.font }}>√</Text>
                <View style={{ borderTopWidth: rule * 1.2, borderColor: ctx.color, paddingTop: 1, paddingHorizontal: 2 }}>
                  <MathRow nodes={n.body} size={size} ctx={ctx} />
                </View>
              </View>
            );
          case 'over':
            return (
              <View key={i} style={{ borderTopWidth: rule * 1.2, borderColor: ctx.color, paddingTop: 1 }}>
                <MathRow nodes={n.body} size={size} ctx={ctx} />
              </View>
            );
        }
      })}
    </View>
  );
}
