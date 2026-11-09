import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { fonts } from '@/theme';
import type { BrainRegion, NeuronPart, Visual as VisualSpec } from '../types';
import { CLASS } from './classroom-theme';

/** A soft, endless pulse (0.35 → 1) for whatever is highlighted. */
function usePulse(delay = 0) {
  const v = useSharedValue(0.35);
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [v, delay]);
  return useAnimatedStyle(() => ({ opacity: v.value }));
}

const Label = ({ children, color = CLASS.text, size = 13, center = true, bold = false }: { children: string; color?: string; size?: number; center?: boolean; bold?: boolean }) => (
  <Text style={{ color, fontSize: size, lineHeight: size * 1.3, fontFamily: bold ? fonts.bodyBold : fonts.bodySemibold, textAlign: center ? 'center' : 'left' }}>{children}</Text>
);

// ── Flow: steps with arrows ─────────────────────────────

function Flow({ nodes }: { nodes: string[] }) {
  return (
    <View style={{ gap: 4, alignItems: 'stretch' }}>
      {nodes.map((n, i) => (
        <View key={i} style={{ alignItems: 'center', gap: 4 }}>
          <Animated.View entering={FadeInDown.delay(150 + i * 260).springify().damping(14)} style={{ alignSelf: 'stretch' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, paddingVertical: 11, paddingHorizontal: 14, backgroundColor: i === nodes.length - 1 ? CLASS.sunSoft : CLASS.card, borderWidth: 1, borderColor: i === nodes.length - 1 ? CLASS.sun : CLASS.line }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: i === nodes.length - 1 ? CLASS.sun : CLASS.accent }}>
                <Text style={{ color: i === nodes.length - 1 ? CLASS.ink : '#fff', fontFamily: fonts.bodyExtrabold, fontSize: 13 }}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Label center={false} bold>{n}</Label>
              </View>
            </View>
          </Animated.View>
          {i < nodes.length - 1 ? (
            <Animated.View entering={FadeIn.delay(300 + i * 260)}>
              <Ionicons name="arrow-down" size={18} color={CLASS.muted} />
            </Animated.View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

// ── Cycle: labels round a ring with a travelling dot ────

function Cycle({ nodes }: { nodes: string[] }) {
  const size = 260;
  const r = 92;
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 6000, easing: Easing.linear }), -1, false);
  }, [spin]);
  const orbit = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={CLASS.line} strokeWidth={3} strokeDasharray="6 8" fill="none" />
      </Svg>
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, orbit]}>
        <View style={{ position: 'absolute', left: size / 2 - 7, top: size / 2 - r - 7, width: 14, height: 14, borderRadius: 7, backgroundColor: CLASS.sun }} />
      </Animated.View>
      {nodes.map((n, i) => {
        const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
        const x = size / 2 + Math.cos(a) * r;
        const y = size / 2 + Math.sin(a) * r;
        return (
          <Animated.View key={i} entering={ZoomIn.delay(150 + i * 220).springify()} style={{ position: 'absolute', left: x - 52, top: y - 22, width: 104 }}>
            <View style={{ borderRadius: 14, paddingVertical: 7, paddingHorizontal: 6, backgroundColor: CLASS.cardSolid, borderWidth: 1, borderColor: CLASS.accent }}>
              <Label size={12} bold>{n}</Label>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ── Pyramid ─────────────────────────────────────────────

function Pyramid({ levels }: { levels: string[] }) {
  return (
    <View style={{ alignItems: 'center', gap: 5 }}>
      {levels.map((l, i) => {
        const width = 38 + (62 * (i + 1)) / levels.length;
        return (
          <Animated.View key={i} entering={FadeInDown.delay(120 + i * 220).springify().damping(15)} style={{ width: `${width}%` }}>
            <LinearGradient colors={[i === 0 ? CLASS.sun : CLASS.accent, i === 0 ? '#F59E0B' : CLASS.accentDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8 }}>
              <Label color={i === 0 ? CLASS.ink : '#fff'} bold size={12.5}>{l}</Label>
            </LinearGradient>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ── Venn: two circles slide together ────────────────────

function Venn({ left, right, both }: { left: string; right: string; both: string }) {
  const x = useSharedValue(40);
  useEffect(() => {
    x.value = withDelay(250, withSpring(0, { damping: 13 }));
  }, [x]);
  const l = useAnimatedStyle(() => ({ transform: [{ translateX: -x.value }] }));
  const r = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const D = 150;
  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      <View style={{ width: D * 1.62, height: D, alignSelf: 'center' }}>
        <Animated.View style={[{ position: 'absolute', left: 0, width: D, height: D, borderRadius: D / 2, backgroundColor: 'rgba(99,102,241,0.38)', borderWidth: 2, borderColor: '#818CF8', justifyContent: 'center', paddingLeft: 14, paddingRight: D * 0.42 }, l]}>
          <Label size={12} bold>{left}</Label>
        </Animated.View>
        <Animated.View style={[{ position: 'absolute', right: 0, width: D, height: D, borderRadius: D / 2, backgroundColor: 'rgba(20,184,166,0.36)', borderWidth: 2, borderColor: '#2DD4BF', justifyContent: 'center', paddingRight: 14, paddingLeft: D * 0.42 }, r]}>
          <Label size={12} bold>{right}</Label>
        </Animated.View>
      </View>
      <Animated.View entering={FadeInDown.delay(700)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14, backgroundColor: CLASS.sunSoft, borderWidth: 1, borderColor: CLASS.sun }}>
        <Ionicons name="git-merge-outline" size={16} color={CLASS.sun} />
        <Label size={12.5} bold>{`Both: ${both}`}</Label>
      </Animated.View>
    </View>
  );
}

// ── Scale: the beam tips towards the heavier side ───────

function Scale({ left, right, heavier }: { left: string; right: string; heavier: 'left' | 'right' | 'even' }) {
  const tilt = useSharedValue(0);
  useEffect(() => {
    const to = heavier === 'left' ? -12 : heavier === 'right' ? 12 : 0;
    tilt.value = withDelay(300, withSequence(withTiming(to * 1.6, { duration: 450 }), withSpring(to, { damping: 6 })));
  }, [tilt, heavier]);
  const beam = useAnimatedStyle(() => ({ transform: [{ rotate: `${tilt.value}deg` }] }));
  const pan = (label: string) => (
    <View style={{ width: 118, alignItems: 'center', gap: 4 }}>
      <View style={{ width: 2, height: 26, backgroundColor: CLASS.muted }} />
      <View style={{ width: 118, minHeight: 50, borderRadius: 14, paddingHorizontal: 6, paddingVertical: 8, backgroundColor: CLASS.cardSolid, borderWidth: 1, borderColor: CLASS.accent, justifyContent: 'center' }}>
        <Label size={12} bold>{label}</Label>
      </View>
    </View>
  );
  return (
    <View style={{ alignItems: 'center', height: 190 }}>
      <Animated.View style={[{ width: 280, alignItems: 'center' }, beam]}>
        <View style={{ width: 280, height: 6, borderRadius: 3, backgroundColor: CLASS.sun }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 280, marginTop: -2 }}>
          {pan(left)}
          {pan(right)}
        </View>
      </Animated.View>
      <View style={{ position: 'absolute', top: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: CLASS.sun }} />
      <View style={{ position: 'absolute', bottom: 0, width: 0, height: 0, borderLeftWidth: 26, borderRightWidth: 26, borderBottomWidth: 36, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: CLASS.line }} />
    </View>
  );
}

// ── Stat: one big figure ────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  const glow = usePulse(400);
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[{ position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(250,204,21,0.14)' }, glow]} />
        <Animated.Text entering={ZoomIn.delay(150).springify().damping(9)} style={{ color: CLASS.sun, fontFamily: fonts.display, fontSize: value.length > 7 ? 42 : 58, textAlign: 'center' }}>
          {value}
        </Animated.Text>
      </View>
      <Animated.View entering={FadeInDown.delay(450)} style={{ maxWidth: 280 }}>
        <Label size={14}>{label}</Label>
      </Animated.View>
    </View>
  );
}

// ── Brain: side view, front on the left ─────────────────

const LOBES: Record<'frontal-lobe' | 'parietal-lobe' | 'occipital-lobe' | 'temporal-lobe' | 'cerebellum' | 'brainstem', string> = {
  'frontal-lobe': 'M40,120 C30,70 70,30 125,28 L135,28 L140,110 C110,118 80,135 60,150 C48,142 42,132 40,120 Z',
  'parietal-lobe': 'M135,28 C175,26 215,40 235,70 L180,105 L140,110 Z',
  'occipital-lobe': 'M235,70 C258,95 262,125 250,148 L205,140 L180,105 Z',
  'temporal-lobe': 'M60,150 C80,135 110,118 140,110 L180,105 L205,140 C185,160 150,170 115,168 C90,166 70,160 60,150 Z',
  cerebellum: 'M205,145 C225,145 250,150 252,165 C250,185 220,192 200,182 C190,172 192,155 205,145 Z',
  brainstem: 'M165,165 C175,170 185,172 195,175 L188,215 L170,215 Z',
};
const PREFRONTAL = 'M40,120 C30,70 60,38 95,32 L100,120 C80,128 62,140 60,150 C48,142 42,132 40,120 Z';

function deep(region: BrainRegion, color: string, width = 1) {
  switch (region) {
    case 'thalamus': return <Ellipse cx={150} cy={102} rx={15} ry={9} fill={color} />;
    case 'hypothalamus': return <Ellipse cx={133} cy={120} rx={9} ry={6} fill={color} />;
    case 'amygdala': return <Circle cx={140} cy={140} r={7} fill={color} />;
    case 'hippocampus': return <Path d="M146,138 C160,146 178,144 190,130" stroke={color} strokeWidth={7 * width} strokeLinecap="round" fill="none" />;
    case 'corpus-callosum': return <Path d="M95,84 C120,62 180,62 205,88" stroke={color} strokeWidth={7 * width} strokeLinecap="round" fill="none" />;
    default: return null;
  }
}

function Brain({ region, label }: { region: BrainRegion; label: string }) {
  const pulse = usePulse(300);
  const lobes = Object.entries(LOBES);
  const isLobe = region in LOBES;
  const isDeep = ['thalamus', 'hypothalamus', 'amygdala', 'hippocampus', 'corpus-callosum'].includes(region);
  const W = 300;
  const H = 220;
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Animated.View entering={ZoomIn.springify().damping(14)} style={{ width: W, height: H }}>
        <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute' }}>
          {lobes.map(([k, d]) => (
            <Path key={k} d={d} fill="rgba(255,255,255,0.10)" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
          ))}
          {/* Folds, for texture */}
          <Path d="M70,80 C85,70 95,90 110,78 M150,50 C165,60 175,45 195,58 M90,140 C105,130 125,145 140,132 M215,95 C225,105 232,98 240,110" stroke="rgba(255,255,255,0.22)" strokeWidth={1.5} fill="none" />
          {isDeep ? (['thalamus', 'hypothalamus', 'amygdala', 'hippocampus', 'corpus-callosum'] as BrainRegion[]).map((r) => <G key={r} opacity={0.35}>{deep(r, 'rgba(255,255,255,0.5)', 0.6)}</G>) : null}
        </Svg>
        <Animated.View style={[{ position: 'absolute', width: W, height: H }, pulse]}>
          <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            {region === 'whole-brain'
              ? lobes.map(([k, d]) => <Path key={k} d={d} fill={CLASS.sun} opacity={0.85} />)
              : region === 'prefrontal-cortex'
                ? <Path d={PREFRONTAL} fill={CLASS.sun} />
                : isLobe
                  ? <Path d={LOBES[region as keyof typeof LOBES]} fill={CLASS.sun} />
                  : deep(region, CLASS.sun, 1.2)}
          </Svg>
        </Animated.View>
        <View style={{ position: 'absolute', left: 6, top: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="arrow-back" size={12} color={CLASS.muted} />
          <Text style={{ color: CLASS.muted, fontFamily: fonts.body, fontSize: 11 }}>front</Text>
        </View>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(400)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14, backgroundColor: CLASS.sunSoft, borderWidth: 1, borderColor: CLASS.sun }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: CLASS.sun }} />
        <Label size={13} bold>{label}</Label>
      </Animated.View>
    </View>
  );
}

// ── Neuron: with a signal running down the axon ─────────

/** Each part of the neuron, drawn in the colour given. */
function neuronPart(part: Exclude<NeuronPart, 'whole'>, c: string) {
  switch (part) {
    case 'dendrites': return <Path d="M58,70 L22,40 M58,70 L14,72 M58,70 L24,104 M30,46 L18,30 M20,72 L6,62 M28,100 L14,114" stroke={c} strokeWidth={5} strokeLinecap="round" fill="none" />;
    case 'cell-body': return <Circle cx={70} cy={70} r={22} fill={c} />;
    case 'axon': return <Line x1={92} y1={70} x2={262} y2={70} stroke={c} strokeWidth={6} strokeLinecap="round" />;
    case 'myelin': return <G>{[112, 150, 188, 226].map((x) => <Rect key={x} x={x} y={62} width={28} height={16} rx={8} fill={c} />)}</G>;
    case 'terminals': return <Path d="M262,70 L284,48 M262,70 L290,70 M262,70 L284,92" stroke={c} strokeWidth={5} strokeLinecap="round" fill="none" />;
    case 'synapse': return <Rect x={292} y={38} width={14} height={64} rx={6} fill={c} />;
  }
}
const NEURON_PARTS: Exclude<NeuronPart, 'whole'>[] = ['dendrites', 'cell-body', 'axon', 'myelin', 'terminals', 'synapse'];

function Neuron({ part, label }: { part: NeuronPart; label: string }) {
  const pulse = usePulse(300);
  const signal = useSharedValue(0);
  useEffect(() => {
    signal.value = withRepeat(withSequence(withTiming(0, { duration: 0 }), withTiming(1, { duration: 1400, easing: Easing.in(Easing.quad) }), withTiming(1, { duration: 500 })), -1, false);
  }, [signal]);
  const spark = useAnimatedStyle(() => ({ transform: [{ translateX: 92 + signal.value * 168 }], opacity: signal.value < 0.98 ? 1 : 0 }));
  const W = 316;
  const H = 140;
  const base = 'rgba(255,255,255,0.55)';
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Animated.View entering={FadeIn.duration(500)} style={{ width: W, height: H }}>
        <Svg width={W} height={H} style={{ position: 'absolute' }}>
          {NEURON_PARTS.map((k) => <G key={k}>{neuronPart(k, base)}</G>)}
          {/* The next cell, across the gap */}
          <Path d="M310,40 L316,40 M310,100 L316,100" stroke={base} strokeWidth={4} />
        </Svg>
        <Animated.View style={[{ position: 'absolute', top: 70 - 7, left: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: '#FDE047', shadowColor: '#FDE047', shadowOpacity: 0.9, shadowRadius: 8 }, spark]} />
        <Animated.View style={[{ position: 'absolute', width: W, height: H }, pulse]}>
          <Svg width={W} height={H}>{part === 'whole' ? NEURON_PARTS.map((k) => <G key={k}>{neuronPart(k, CLASS.sun)}</G>) : neuronPart(part, CLASS.sun)}</Svg>
        </Animated.View>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(400)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14, backgroundColor: CLASS.sunSoft, borderWidth: 1, borderColor: CLASS.sun }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: CLASS.sun }} />
        <Label size={13} bold>{label}</Label>
      </Animated.View>
    </View>
  );
}

// ── Spectrum: where an idea sits between two poles ──────

function Spectrum({ left, right, marker, label }: { left: string; right: string; marker: number; label: string }) {
  const at = useSharedValue(0);
  const width = useSharedValue(0);
  useEffect(() => {
    at.value = withDelay(300, withSpring(marker / 100, { damping: 12 }));
  }, [at, marker]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: at.value * width.value - 12 }] }));
  return (
    <View style={{ gap: 12, paddingTop: 34 }}>
      <View onLayout={(e) => width.set(e.nativeEvent.layout.width)}>
        <LinearGradient colors={['#6366F1', '#14B8A6', '#FACC15']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 12, borderRadius: 6 }} />
        <Animated.View style={[{ position: 'absolute', top: -34, left: 0, alignItems: 'center', width: 24 }, knob]}>
          <View style={{ position: 'absolute', bottom: 14, width: 150, alignItems: 'center' }}>
            <View style={{ borderRadius: 10, backgroundColor: CLASS.sun, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text numberOfLines={1} style={{ color: CLASS.ink, fontFamily: fonts.bodyBold, fontSize: 11.5 }}>{label}</Text>
            </View>
          </View>
          <View style={{ marginTop: 26, width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', borderWidth: 4, borderColor: CLASS.sun }} />
        </Animated.View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <View style={{ maxWidth: '45%' }}><Label size={12} center={false}>{left}</Label></View>
        <View style={{ maxWidth: '45%' }}><Text style={{ color: CLASS.text, fontSize: 12, fontFamily: fonts.bodySemibold, textAlign: 'right' }}>{right}</Text></View>
      </View>
    </View>
  );
}

// ── Icons: 2–4 ideas as pictures ────────────────────────

function Icons({ items }: { items: { icon: string; label: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
      {items.map((it, i) => (
        <Animated.View key={i} entering={ZoomIn.delay(120 + i * 180).springify().damping(11)} style={{ width: items.length === 4 ? '45%' : items.length === 3 ? '30%' : '45%', alignItems: 'center', gap: 8, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 6, backgroundColor: CLASS.card, borderWidth: 1, borderColor: CLASS.line }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: CLASS.accent }}>
            <Ionicons name={(it.icon in Ionicons.glyphMap ? it.icon : 'bulb') as keyof typeof Ionicons.glyphMap} size={24} color="#fff" />
          </View>
          <Label size={12.5} bold>{it.label}</Label>
        </Animated.View>
      ))}
    </View>
  );
}

/** Draws a lesson visual, animated in. Unknown shapes draw nothing. */
export function Visual({ visual }: { visual: VisualSpec }) {
  const body = (() => {
    switch (visual.type) {
      case 'flow': return <Flow nodes={visual.nodes} />;
      case 'cycle': return <Cycle nodes={visual.nodes} />;
      case 'pyramid': return <Pyramid levels={visual.levels} />;
      case 'venn': return <Venn left={visual.left} right={visual.right} both={visual.both} />;
      case 'scale': return <Scale left={visual.left} right={visual.right} heavier={visual.heavier} />;
      case 'stat': return <Stat value={visual.value} label={visual.label} />;
      case 'brain': return <Brain region={visual.region} label={visual.label} />;
      case 'neuron': return <Neuron part={visual.part} label={visual.label} />;
      case 'spectrum': return <Spectrum left={visual.left} right={visual.right} marker={visual.marker} label={visual.label} />;
      case 'icons': return <Icons items={visual.items} />;
      default: return null;
    }
  })();
  if (!body) return null;
  return (
    <Animated.View entering={FadeIn.delay(200).duration(400)} style={{ borderRadius: 24, padding: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: CLASS.line }}>
      {body}
    </Animated.View>
  );
}

