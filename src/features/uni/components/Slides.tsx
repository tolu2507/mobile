import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInLeft, FadeInRight, ZoomIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { playSound } from '@/lib/sounds';
import { fonts } from '@/theme';
import type { Slide } from '../types';
import { CLASS } from './classroom-theme';
import { Visual } from './Visual';

/** Body text with **key terms** picked out. */
export function Rich({ text, size = 17, color = CLASS.text }: { text: string; size?: number; color?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return (
    <Text style={{ color, fontSize: size, lineHeight: Math.round(size * 1.55), fontFamily: fonts.body }}>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? (
          <Text key={i} style={{ fontFamily: fonts.bodyBold, color: CLASS.sun }}>
            {p.slice(2, -2)}
          </Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}

const Heading = ({ children, delay = 0 }: { children: string; delay?: number }) => (
  <Animated.Text entering={FadeInDown.delay(delay).duration(450)} accessibilityRole="header" style={{ color: CLASS.text, fontFamily: fonts.display, fontSize: 27, lineHeight: 32 }}>
    {children}
  </Animated.Text>
);

const Tag = ({ icon, label, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }) => (
  <Animated.View entering={FadeIn.duration(300)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11, backgroundColor: `${color}26` }}>
    <Ionicons name={icon} size={14} color={color} />
    <Text style={{ color, fontFamily: fonts.bodyExtrabold, fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' }}>{label}</Text>
  </Animated.View>
);

// ── Teach ───────────────────────────────────────────────

function Teach({ s }: { s: Extract<Slide, { kind: 'teach' }> }) {
  return (
    <View style={{ gap: 18 }}>
      <Heading>{s.heading}</Heading>
      <Animated.View entering={FadeInDown.delay(120).duration(450)}>
        <Rich text={s.body} />
      </Animated.View>
      {s.visual ? <Visual visual={s.visual} /> : null}
    </View>
  );
}

// ── Example: a real-life scene ──────────────────────────

function Example({ s }: { s: Extract<Slide, { kind: 'example' }> }) {
  return (
    <View style={{ gap: 18 }}>
      <Tag icon="sparkles" label="Real life" color={CLASS.mint} />
      <Heading>{s.heading}</Heading>
      <Animated.View entering={FadeInDown.delay(150).springify().damping(16)} style={{ borderRadius: 24, padding: 20, backgroundColor: CLASS.card, borderWidth: 1, borderColor: CLASS.line, gap: 14 }}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: CLASS.mintSoft, alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name="account-voice" size={22} color={CLASS.mint} />
          </View>
          <Text style={{ color: CLASS.muted, fontFamily: fonts.bodySemibold, fontSize: 13 }}>Picture this…</Text>
        </View>
        <Rich text={s.story} size={16.5} color={CLASS.soft} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(550).duration(450)} style={{ flexDirection: 'row', gap: 12, borderLeftWidth: 4, borderLeftColor: CLASS.sun, paddingLeft: 14, paddingVertical: 4 }}>
        <View style={{ flex: 1 }}>
          <Rich text={s.takeaway} size={16.5} />
        </View>
      </Animated.View>
    </View>
  );
}

// ── Check: a quick question ─────────────────────────────

function Check({ s, answered, onAnswer }: { s: Extract<Slide, { kind: 'check' }>; answered: number | null; onAnswer: (index: number) => void }) {
  const done = answered !== null;
  return (
    <View style={{ gap: 18 }}>
      <Tag icon="help-circle" label="Quick check" color={CLASS.sun} />
      <Heading>{s.question}</Heading>
      <View style={{ gap: 10 }}>
        {s.options.map((o, i) => {
          const right = i === s.answerIndex;
          const picked = answered === i;
          const bg = !done ? CLASS.card : right ? CLASS.mintSoft : picked ? CLASS.coralSoft : CLASS.card;
          const border = !done ? CLASS.line : right ? CLASS.mint : picked ? CLASS.coral : CLASS.line;
          return (
            <Animated.View key={i} entering={FadeInDown.delay(100 + i * 90).duration(380)}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: done, selected: picked }}
                accessibilityLabel={`Option ${'ABCD'[i]}: ${o}${done && right ? ', correct answer' : ''}`}
                disabled={done}
                onPress={() => {
                  const ok = i === s.answerIndex;
                  Haptics.notificationAsync(ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
                  if (ok) playSound('chime');
                  onAnswer(i);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 14, backgroundColor: bg, borderWidth: 1.5, borderColor: border, opacity: done && !right && !picked ? 0.55 : 1 }}
              >
                <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: done && right ? CLASS.mint : done && picked ? CLASS.coral : 'rgba(255,255,255,0.1)' }}>
                  {done && (right || picked) ? (
                    <Ionicons name={right ? 'checkmark' : 'close'} size={18} color={CLASS.ink} />
                  ) : (
                    <Text style={{ color: CLASS.text, fontFamily: fonts.bodyExtrabold, fontSize: 13 }}>{'ABCD'[i]}</Text>
                  )}
                </View>
                <Text style={{ flex: 1, color: CLASS.text, fontFamily: fonts.bodySemibold, fontSize: 15.5, lineHeight: 21 }}>{o}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
      {done ? (
        <Animated.View entering={ZoomIn.springify().damping(15)} style={{ borderRadius: 20, padding: 16, gap: 6, backgroundColor: answered === s.answerIndex ? CLASS.mintSoft : CLASS.coralSoft }}>
          <Text style={{ color: answered === s.answerIndex ? CLASS.mint : CLASS.coral, fontFamily: fonts.bodyExtrabold, fontSize: 15 }}>
            {answered === s.answerIndex ? 'Exactly right!' : 'Not quite. Here’s why:'}
          </Text>
          <Rich text={s.why} size={15.5} />
        </Animated.View>
      ) : null}
    </View>
  );
}

// ── Compare ─────────────────────────────────────────────

function Compare({ s }: { s: Extract<Slide, { kind: 'compare' }> }) {
  const side = (x: { title: string; points: string[] }, colour: string, from: 'left' | 'right') => (
    <Animated.View entering={(from === 'left' ? FadeInLeft : FadeInRight).delay(from === 'left' ? 150 : 350).springify().damping(16)} style={{ flex: 1, borderRadius: 22, padding: 14, gap: 10, backgroundColor: CLASS.card, borderTopWidth: 4, borderTopColor: colour }}>
      <Text style={{ color: colour, fontFamily: fonts.display, fontSize: 17 }}>{x.title}</Text>
      {x.points.map((p, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 6 }}>
          <View style={{ marginTop: 8, width: 5, height: 5, borderRadius: 3, backgroundColor: colour }} />
          <Text style={{ flex: 1, color: CLASS.soft, fontFamily: fonts.body, fontSize: 14, lineHeight: 20 }}>{p}</Text>
        </View>
      ))}
    </Animated.View>
  );
  return (
    <View style={{ gap: 18 }}>
      <Heading>{s.heading}</Heading>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {side(s.left, '#818CF8', 'left')}
        {side(s.right, '#2DD4BF', 'right')}
      </View>
    </View>
  );
}

// ── Steps: a timeline ───────────────────────────────────

function Steps({ s }: { s: Extract<Slide, { kind: 'steps' }> }) {
  return (
    <View style={{ gap: 18 }}>
      <Heading>{s.heading}</Heading>
      <View>
        {s.steps.map((st, i) => (
          <Animated.View key={i} entering={FadeInLeft.delay(150 + i * 230).springify().damping(16)} style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: CLASS.accent, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontFamily: fonts.bodyExtrabold, fontSize: 14 }}>{i + 1}</Text>
              </View>
              {i < s.steps.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: CLASS.line, marginVertical: 2 }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: 18, gap: 3 }}>
              <Text style={{ color: CLASS.text, fontFamily: fonts.bodyBold, fontSize: 16 }}>{st.title}</Text>
              <Text style={{ color: CLASS.soft, fontFamily: fonts.body, fontSize: 14.5, lineHeight: 21 }}>{st.detail}</Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

// ── Terms: tap to flip ──────────────────────────────────

function FlipCard({ term, meaning, delay }: { term: string; meaning: string; delay: number }) {
  const [open, setOpen] = useState(false);
  const turn = useSharedValue(0);
  const front = useAnimatedStyle(() => ({ transform: [{ perspective: 800 }, { rotateX: `${turn.value * 180}deg` }], opacity: turn.value < 0.5 ? 1 : 0 }));
  const back = useAnimatedStyle(() => ({ transform: [{ perspective: 800 }, { rotateX: `${turn.value * 180 - 180}deg` }], opacity: turn.value >= 0.5 ? 1 : 0 }));
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(380)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={open ? `${term}: ${meaning}` : `${term}. Tap to see the meaning`}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          turn.set(withTiming(open ? 0 : 1, { duration: 380 }));
          setOpen(!open);
        }}
        style={{ minHeight: 76 }}
      >
        <Animated.View style={[{ position: 'absolute', inset: 0, borderRadius: 18, padding: 14, backgroundColor: CLASS.card, borderWidth: 1, borderColor: CLASS.line, flexDirection: 'row', alignItems: 'center', gap: 10 }, front]}>
          <Text style={{ flex: 1, color: CLASS.text, fontFamily: fonts.display, fontSize: 18 }}>{term}</Text>
          <Ionicons name="sync" size={18} color={CLASS.muted} />
        </Animated.View>
        <Animated.View style={[{ borderRadius: 18, padding: 14, backgroundColor: CLASS.sunSoft, borderWidth: 1, borderColor: CLASS.sun, minHeight: 76, justifyContent: 'center' }, back]}>
          <Text style={{ color: CLASS.sun, fontFamily: fonts.bodyBold, fontSize: 13, marginBottom: 2 }}>{term}</Text>
          <Text style={{ color: CLASS.text, fontFamily: fonts.body, fontSize: 15, lineHeight: 21 }}>{meaning}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function Terms({ s }: { s: Extract<Slide, { kind: 'terms' }> }) {
  return (
    <View style={{ gap: 14 }}>
      <Heading>{s.heading}</Heading>
      <Text style={{ color: CLASS.muted, fontFamily: fonts.body, fontSize: 14 }}>Say what each one means in your head, then tap to check.</Text>
      {s.terms.map((t, i) => (
        <FlipCard key={i} term={t.term} meaning={t.meaning} delay={120 + i * 110} />
      ))}
    </View>
  );
}

// ── Lecturer: how it's examined ─────────────────────────

function Lecturer({ s }: { s: Extract<Slide, { kind: 'lecturer' }> }) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ gap: 16 }}>
      <Tag icon="school" label="Exam corner" color="#F472B6" />
      <Heading>{s.heading}</Heading>
      <Animated.View entering={FadeInDown.delay(120).duration(420)}>
        <Rich text={s.body} size={16} color={CLASS.soft} />
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(300).springify().damping(16)} style={{ borderRadius: 22, padding: 16, gap: 10, backgroundColor: '#fff' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name="file-document-edit-outline" size={18} color={CLASS.accentDeep} />
          <Text style={{ color: CLASS.accentDeep, fontFamily: fonts.bodyExtrabold, fontSize: 12, letterSpacing: 0.6 }}>EXAM QUESTION</Text>
        </View>
        <Text style={{ color: CLASS.ink, fontFamily: fonts.bodySemibold, fontSize: 16, lineHeight: 23 }}>{s.sampleQuestion}</Text>
      </Animated.View>
      {show ? (
        <Animated.View entering={FadeInDown.springify().damping(16)} style={{ borderRadius: 20, padding: 16, gap: 6, backgroundColor: CLASS.mintSoft }}>
          <Text style={{ color: CLASS.mint, fontFamily: fonts.bodyExtrabold, fontSize: 14 }}>How to answer it</Text>
          <Rich text={s.howToAnswer} size={15.5} />
        </Animated.View>
      ) : (
        <Pressable accessibilityRole="button" onPress={() => setShow(true)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 16, paddingVertical: 13, borderWidth: 1.5, borderColor: CLASS.mint }}>
          <Ionicons name="bulb-outline" size={18} color={CLASS.mint} />
          <Text style={{ color: CLASS.mint, fontFamily: fonts.bodyBold, fontSize: 15 }}>Show me how to answer it</Text>
        </Pressable>
      )}
      {s.scholars.length ? (
        <Animated.View entering={FadeIn.delay(500)} style={{ gap: 8 }}>
          <Text style={{ color: CLASS.muted, fontFamily: fonts.bodySemibold, fontSize: 13 }}>Names worth quoting in your answer</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {s.scholars.map((n) => (
              <View key={n} style={{ borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: CLASS.card, borderWidth: 1, borderColor: CLASS.line }}>
                <Text style={{ color: CLASS.text, fontFamily: fonts.bodySemibold, fontSize: 13 }}>{n}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

// ── Recap: points tick in one by one ────────────────────

function Recap({ s }: { s: Extract<Slide, { kind: 'recap' }> }) {
  return (
    <View style={{ gap: 18 }}>
      <Tag icon="checkmark-done" label="Recap" color={CLASS.mint} />
      <Heading>What you now know</Heading>
      <View style={{ gap: 10 }}>
        {s.points.map((p, i) => (
          <Animated.View key={i} entering={FadeInDown.delay(200 + i * 280).springify().damping(15)} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderRadius: 18, padding: 14, backgroundColor: CLASS.card }}>
            <Animated.View entering={ZoomIn.delay(380 + i * 280).springify()} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: CLASS.mint, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
              <Ionicons name="checkmark" size={16} color={CLASS.ink} />
            </Animated.View>
            <View style={{ flex: 1 }}>
              <Rich text={p} size={15.5} />
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

/** One classroom slide. `answered` / `onAnswer` drive quick checks. */
export function SlideView({ slide, answered, onAnswer }: { slide: Slide; answered: number | null; onAnswer: (index: number) => void }) {
  switch (slide.kind) {
    case 'teach': return <Teach s={slide} />;
    case 'example': return <Example s={slide} />;
    case 'check': return <Check s={slide} answered={answered} onAnswer={onAnswer} />;
    case 'compare': return <Compare s={slide} />;
    case 'steps': return <Steps s={slide} />;
    case 'terms': return <Terms s={slide} />;
    case 'lecturer': return <Lecturer s={slide} />;
    case 'recap': return <Recap s={slide} />;
    default: return null;
  }
}

/** Plain words of a slide, for reading aloud. */
export function slideSpeech(s: Slide): string {
  const plain = (t: string) => t.replace(/\*\*/g, '');
  switch (s.kind) {
    case 'teach': return `${s.heading}. ${plain(s.body)}`;
    case 'example': return `${s.heading}. ${plain(s.story)} ${plain(s.takeaway)}`;
    case 'check': return `${s.question} ${s.options.map((o, i) => `${'ABCD'[i]}: ${o}.`).join(' ')}`;
    case 'compare': return `${s.heading}. ${s.left.title}: ${s.left.points.join('. ')}. ${s.right.title}: ${s.right.points.join('. ')}.`;
    case 'steps': return `${s.heading}. ${s.steps.map((x, i) => `Step ${i + 1}, ${x.title}: ${x.detail}`).join(' ')}`;
    case 'terms': return `${s.heading}. ${s.terms.map((t) => `${t.term}: ${t.meaning}`).join('. ')}`;
    case 'lecturer': return `${s.heading}. ${plain(s.body)} Exam question: ${s.sampleQuestion}`;
    case 'recap': return `What you now know. ${s.points.map(plain).join('. ')}`;
    default: return '';
  }
}
