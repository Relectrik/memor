/* app/practice.tsx — stable swipe + no “end after one” bug */

import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

/* ─── constants ─── */
const THRESHOLD_X = 120;
const THRESHOLD_V = 900;
const MAX_ROT     = 15;
const STACK       = 3;            // 1 active + 2 preloaded
const SCORE_KEY   = 'deckScores';

type Card = { question: string; answer: string };
type ScoreMap = Record<number, { right: number; wrong: number }>;

/* ─── UnderCard component (calls hooks safely) ─── */
function UnderCard({
  card,
  opacitySV,
  scale,
  w,
  h,
}: {
  card: Card | undefined;
  opacitySV: Animated.SharedValue<number>;
  scale: number;
  w: number;
  h: number;
}) {
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacitySV.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { width: w, height: h, position: 'absolute', alignSelf: 'center', transform: [{ scale }] },
        fadeStyle,
        card && styles.card,
        card && styles.shadow,
      ]}
    >
      {card && (
        <>
          <BlurView
            intensity={40}
            tint="light"
            style={{ ...StyleSheet.absoluteFillObject, borderRadius: 12 }}
          />
          <Text style={styles.txt}>{card.question}</Text>
        </>
      )}
    </Animated.View>
  );
}

/* ─── main Practice screen ─── */
export default function Practice() {
  const { width, height } = useWindowDimensions();
  const CARD_W = width;
  const CARD_H = height * 0.9;

  const [deck, setDeck]   = useState<Card[]>([]);
  const [idx,  setIdx]    = useState(0);
  const [scores, setScores] = useState<ScoreMap>({});

  /* shared anim values for the active card */
  const x    = useSharedValue(0);
  const rot  = useSharedValue(0);
  const flip = useSharedValue(0);

  /* shared opacities for underlying cards (fixed length) */
  const underOp = Array.from({ length: STACK - 1 }, () => useSharedValue(0));

  /* load deck + scores only once */
  useEffect(() => {
    (async () => {
      const d = await AsyncStorage.getItem('deck');
      if (d) setDeck(JSON.parse(d));

      const s = await AsyncStorage.getItem(SCORE_KEY);
      if (s) setScores(JSON.parse(s));
    })();
  }, []);

  /* persist scores on change */
  useEffect(() => {
    AsyncStorage.setItem(SCORE_KEY, JSON.stringify(scores));
  }, [scores]);

  /* reset anim values & fade-in under cards whenever idx changes */
  useEffect(() => {
    x.value = 0; rot.value = 0; flip.value = 0;
    underOp.forEach((op, i) => {
      op.value = 0;
      op.value = withTiming([4, 0][i] ?? 0, { duration: 1000, delay: 1000 });
    });
  }, [idx]);

  const record = useCallback(
    (right: boolean) =>
      setScores(s => ({
        ...s,
        [idx]: {
          right: right ? (s[idx]?.right ?? 0) + 1 : s[idx]?.right ?? 0,
          wrong: right ? s[idx]?.wrong ?? 0 : (s[idx]?.wrong ?? 0) + 1,
        },
      })),
    [idx],
  );

  /* advance to next index safely (JS context) */
  const advance = useCallback(() => {
    setIdx(i => (i + 1 < deck.length ? i + 1 : i));
  }, [deck.length]);

  /* ─── Gesture definitions (new API) ─── */

  /* Tap-to-flip */
  const tap = Gesture.Tap().onEnd(() => {
    flip.value = withTiming(flip.value ? 0 : 1, { duration: 250 });
  });

  /* Pan-to-swipe */
  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate(e => {
      x.value = e.translationX;
      rot.value = (x.value / width) * MAX_ROT;
    })
    .onEnd(e => {
      const swipe =
        Math.abs(x.value) > THRESHOLD_X || Math.abs(e.velocityX) > THRESHOLD_V;
      if (swipe) {
        const right = x.value > 0;
        x.value = withTiming(
          right ? width * 1.1 : -width * 1.1,
          {},
          finished => {
            if (finished) {
              runOnJS(record)(right);
              /* call JS helper to bump idx, using latest deck.length */
              runOnJS(advance)();
              /* do NOT reset x/rot/flip here—let the effect do it after idx updates */
            }
          },
        );
      } else {
        x.value = withSpring(0);
        rot.value = withSpring(0);
      }
    });

  const gesture = Gesture.Simultaneous(pan, tap);

  /* ─── Animated styles for active card ─── */
  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { translateX: x.value },
      { rotateZ: `${rot.value}deg` },
      { rotateY: `${flip.value * 180}deg` },
    ],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { translateX: x.value },
      { rotateZ: `${rot.value}deg` },
      { rotateY: `${180 + flip.value * 180}deg` },
    ],
    backfaceVisibility: 'hidden',
  }));

  const likeOp = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, 100], [0, 1]),
  }));
  const nopeOp = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, -100], [0, 1]),
  }));

  /* ─── guard if deck is empty ─── */
  if (!deck.length) {
    return (
      <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={{ textAlign: 'center', padding: 30 }}>Loading deck…</Text>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center' }}>
      {/* Preload STACK - 1 cards underneath */}
      {Array.from({ length: STACK - 1 }).map((_, offset) => {
        const card = deck[idx + 1 + offset];
        return (
          <UnderCard
            key={offset}
            card={card}
            opacitySV={underOp[offset]}
            scale={0.9 - 0.05 * offset}
            w={CARD_W}
            h={CARD_H}
          />
        );
      })}

      {/* Active card (swipe + flip) */}
      <GestureDetector gesture={gesture}>
        <Animated.View>
          <Animated.View
            style={[
              styles.card,
              styles.shadow,
              { width: CARD_W, height: CARD_H, alignSelf: 'center' },
              frontStyle,
            ]}
          >
            <Animated.Text style={[styles.like, likeOp]}>✔️</Animated.Text>
            <Animated.Text style={[styles.nope, nopeOp]}>❌</Animated.Text>
            <Text style={styles.txt}>{deck[idx].question}</Text>
          </Animated.View>

          {/* Back face */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.card,
              styles.shadow,
              styles.back,
              {
                width: CARD_W,
                height: CARD_H,
                alignSelf: 'center',
                position: 'absolute',
              },
              backStyle,
            ]}
          >
            <Text style={styles.txt}>{deck[idx].answer}</Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

/* ─── styles ─── */
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  back: { backfaceVisibility: 'hidden' },
  txt:  { fontSize: 24, textAlign: 'center', padding: 20 },
  like: { position: 'absolute', top: 40, left: 40, fontSize: 48, color: '#2ecc71' },
  nope: { position: 'absolute', top: 40, right: 40, fontSize: 48, color: '#e74c3c' },
});
