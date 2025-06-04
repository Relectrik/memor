// app/practice.tsx — full‑screen cards with slide+scale animation

import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";

/* ─── Hide the default header so Practice is truly full‑screen ─── */
export const unstable_settings = {
  headerShown: false,
};

const THRESHOLD_X = 180;
const THRESHOLD_V = 900;
const MAX_ROT = 15;
const STACK = 3; // 1 active + 2 preloaded
const SCORE_KEY = "deckScores";

type Card = { question: string; answer: string };
type ScoreMap = Record<number, { right: number }>;

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
        {
          width: w,
          height: h,
          position: "absolute",
          alignSelf: "center",
          transform: [{ scale }],
        },
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
  const CARD_H = height * 0.80; // leave extra room for header + padding

  const [deck, setDeck] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<ScoreMap>({});

  /* shared anim values for the active card */
  const x = useSharedValue(0);
  const rot = useSharedValue(0);
  const flip = useSharedValue(0);

  // a shared value for “slide + scale” transition
  const cardTransition = useSharedValue(1);

  const springConfig = {
    damping: 100,
    stiffness: 1000,
    mass: 0.1,
  };

  /* shared opacities for underlying cards (STACK−1) */
  const underOp = Array.from({ length: STACK - 1 }, () => useSharedValue(0));

  /* load deck + scores only once */
  useEffect(() => {
    (async () => {
      const d = await AsyncStorage.getItem("deck");
      if (d) setDeck(JSON.parse(d));
      const s = await AsyncStorage.getItem(SCORE_KEY);
      if (s) setScores(JSON.parse(s));
    })();
  }, []);

  /* persist scores on change */
  useEffect(() => {
    AsyncStorage.setItem(SCORE_KEY, JSON.stringify(scores));
  }, [scores]);

  /* whenever idx changes: reset X/rot/flip and play slide+scale */
  useEffect(() => {
    x.value = 0;
    rot.value = 0;
    flip.value = 0;

    // start new card “down + slightly zoomed out”
    cardTransition.value = 0;
    cardTransition.value = withTiming(1, { duration: 420 });

    // UnderCards fade‑in (same as before)
    underOp.forEach((op, i) => {
      op.value = 0;
      op.value = withTiming([4, 0][i] ?? 0, { duration: 1000, delay: 1000 });
    });
  }, [idx]);

  const record = useCallback(
    (right: boolean) =>
      setScores((s) => ({
        ...s,
        [idx]: {
          right: right ? (s[idx]?.right ?? 0) + 1 : s[idx]?.right ?? 0,
        },
      })),
    [idx]
  );

  /* advance to next card index */
  const advance = useCallback(() => {
    setIdx((i) => (i + 1 < deck.length ? i + 1 : i));
  }, [deck.length]);

  /* ─── Gesture definitions ─── */

  const tap = Gesture.Tap().onEnd(() => {
    flip.value = withTiming(flip.value ? 0 : 1, { duration: 250 });
  });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      x.value = e.translationX;
      rot.value = (x.value / width) * MAX_ROT;
    })
    .onEnd((e) => {
      const didSwipe =
        Math.abs(x.value) > THRESHOLD_X || Math.abs(e.velocityX) > THRESHOLD_V;
      if (didSwipe) {
        const right = x.value > 0;
        x.value = withTiming(
          right ? width * 1.1 : -width * 1.1,
          {},
          (finished) => {
            if (finished) {
              runOnJS(record)(right);
              runOnJS(advance)();
            }
          }
        );
      } else {
        x.value = withSpring(0, springConfig);
        rot.value = withSpring(0, springConfig);
      }
    });

  // “Race” so a drag cancels any tap
  const gesture = Gesture.Race(pan, tap);

  /* ─── Animated styles ─── */

  // Slide+scale: as cardTransition goes 0→1, translateY goes 20→0, scale goes 0.94→1
  const transitionStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(cardTransition.value, [0, 1], [20, 0]),
      },
      {
        scale: interpolate(cardTransition.value, [0, 1], [0.94, 1]),
      },
    ],
  }));

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { translateX: x.value },
      { rotateZ: `${rot.value}deg` },
      { rotateY: `${flip.value * 180}deg` },
    ],
    backfaceVisibility: "hidden",
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { translateX: x.value },
      { rotateZ: `${rot.value}deg` },
      { rotateY: `${180 + flip.value * 180}deg` },
    ],
    backfaceVisibility: "hidden",
  }));

  const likeOp = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, 100], [0, 1], "clamp"),
  }));
  const nopeOp = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, -100], [0, 1], "clamp"),
  }));

  /* ─── guard if deck is empty ─── */
  if (!deck.length) {
    return (
      <GestureHandlerRootView style={{ flex: 1, justifyContent: "center" }}>
        <Text style={{ textAlign: "center", padding: 30 }}>Loading deck…</Text>
      </GestureHandlerRootView>
    );
  }

  /* calculate progress text */
  const total = deck.length;
  const current = idx + 1;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
      <SafeAreaView style={styles.safeArea}>
        {/* ─── Custom header: “Card X / Y” with bottom margin ─── */}
        <View style={styles.topBar}>
          <Text style={styles.progressText}>
            Card {current} / {total}
          </Text>
        </View>

        {/* Pre‑render next two UnderCards */}
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

        {/* ─── Active card (swipe + flip + slide/scale) ─── */}
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              { width: CARD_W, height: CARD_H, alignSelf: "center" },
              transitionStyle,
            ]}
          >
            {/* Front face (question) */}
            <Animated.View
              style={[
                styles.card,
                styles.shadow,
                { width: CARD_W, height: CARD_H },
                frontStyle,
              ]}
            >
              <Animated.Text style={[styles.like, likeOp]}>✔️</Animated.Text>
              <Animated.Text style={[styles.nope, nopeOp]}>❌</Animated.Text>
              <Text style={styles.cardIndicator}>Question</Text>
              <Text style={styles.txt}>{deck[idx].question}</Text>
            </Animated.View>

            {/* Back face (answer) */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.card,
                styles.shadow,
                styles.back,
                {
                  width: CARD_W,
                  height: CARD_H,
                  position: "absolute",
                },
                backStyle,
              ]}
            >
              <Animated.Text style={[styles.like, likeOp]}>✔️</Animated.Text>
              <Animated.Text style={[styles.nope, nopeOp]}>❌</Animated.Text>
              <Text style={styles.cardIndicator}>Answer</Text>
              <Text style={styles.txt}>{deck[idx].answer}</Text>
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F2F2F7",
  },
  topBar: {
    height: 60,
    marginBottom: 16, // adds space below the header
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#DDDDDD",
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  shadow: {
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  back: { backfaceVisibility: "hidden" },
  txt: { fontSize: 24, textAlign: "center", padding: 20 },
  like: {
    position: "absolute",
    top: 40,
    left: 40,
    fontSize: 48,
    color: "#2ecc71",
  },
  nope: {
    position: "absolute",
    top: 40,
    right: 40,
    fontSize: 48,
    color: "#e74c3c",
  },
  cardIndicator: {
    position: "absolute",
    top: 16,
    left: 16,
    fontSize: 14,
    backgroundColor: "#f0f0f0",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    overflow: "hidden",
    color: "#333",
  },
});
