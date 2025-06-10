/* app/practice.tsx — Enhanced with smooth transitions and professional swipe dial */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ─── CONFIGURATION CONSTANTS ─── */

// Tinder-style Card Stack Configuration
const CARD_STACK_CONFIG = {
  VISIBLE_CARDS: 3, // Total cards visible (current + background)
  SCALES: [1.0, 1, 1] as const, // Scale for each card position [current, next, third]
  Y_OFFSETS: [0, 20, 40] as const, // Vertical offset for each position
  OPACITIES: [2.0, 2.0 , 1.0] as const, // Opacity for each position
  Z_INDICES: [2, 1, 0] as const, // Z-index for proper layering
};

// Animation Timing Configuration - Faster & Snappier
const ANIMATION_CONFIG = {
  STACK_SPRING: { damping: 18, stiffness: 180 }, // Faster stack transitions
  CARD_FLIP: { damping: 18, stiffness: 220, mass: 0.7 }, // Snappier card flip
  SWIPE_EXIT: { duration: 280, easing: Easing.out(Easing.cubic) }, // Faster exit
  SPRING_BACK: { damping: 20, stiffness: 400, mass: 0.6 }, // Quicker return to center
  TIMING: {
    ADVANCE_DELAY: 150, // Faster transition
    RESET_DELAY: 300, // Quicker reset
  },
} as const;

// Swipe & Gesture Configuration
const SWIPE_CONFIG = {
  THRESHOLD_DISTANCE: 100,
  THRESHOLD_VELOCITY: 800,
  CARD_ROTATION_MAX: 12,
  CARD_TILT_MAX: 8,
  ACTIVE_OFFSET: 8, // Minimum movement to activate gesture
} as const;

// Dial Configuration
const DIAL_CONFIG = {
  ACTIVATION_DISTANCE: 0,
  MAX_DISTANCE: 150,
  SIZE: 180,
} as const;

// Card Layout Configuration
const CARD_CONFIG = {
  WIDTH_RATIO: 0.9,
  HEIGHT_RATIO: 0.75,
} as const;

// Storage
const SCORE_STORAGE_KEY = 'deckScores';

// Anki-style scoring
const DIFFICULTY = {
  AGAIN: 'again',   // left swipe - red
  HARD: 'hard',     // down swipe - yellow  
  GOOD: 'good',     // up swipe - green
  EASY: 'easy',     // right swipe - blue
} as const;

type DifficultyType = typeof DIFFICULTY[keyof typeof DIFFICULTY];
type Card = { question: string; answer: string };
type ScoreMap = Record<number, { again: number; hard: number; good: number; easy: number }>;

// Color schemes
const getColors = (isDark: boolean) => ({
  background: isDark ? '#000000' : '#f8f9fa',
  cardBackground: isDark ? '#1c1c1e' : '#ffffff',
  cardBackBackground: isDark ? '#2c2c2e' : '#f8f9fa',
  text: isDark ? '#ffffff' : '#2c3e50',
  loadingText: isDark ? '#8e8e93' : '#6c757d',
  cardBorder: isDark ? '#2c2c2e' : '#e9ecef',
  dialBackground: '#ffffff',
  indicatorBackground: 'rgba(0, 122, 255, 0.9)',
});

/* ─── Swipe Dial Component ─── */
function SwipeDial({
  x,
  y,
  isDark,
  dialOpacity,
  dialScale,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
  isDark: boolean;
  dialOpacity: SharedValue<number>;
  dialScale: SharedValue<number>;
}) {
  const dialStyle = useAnimatedStyle(() => {
    const absX = Math.abs(x.value);
    const absY = Math.abs(y.value);
    const maxDistance = Math.max(absX, absY);
    
    // Dial opacity is now only controlled by dialOpacity shared value
    // Position is only used for color and scale, not opacity
    
    // Determine dominant direction and set color
    const isHorizontal = absX > absY;
    let color = '#000';
    
    if (maxDistance > DIAL_CONFIG.ACTIVATION_DISTANCE) {
      if (isHorizontal) {
        if (x.value > 0) {
          color = '#007AFF'; // Right - Easy (Blue)
        } else {
          color = '#FF3B30'; // Left - Again (Red)
        }
      } else {
        if (y.value < 0) {
          color = '#34C759'; // Up - Good (Green)
        } else {
          color = '#FF9500'; // Down - Hard (Orange)
        }
      }
    }
    
    return {
      opacity: dialOpacity.value,
      transform: [
        { scale: dialScale.value },
      ],
      borderColor: color,
      backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
      // All shadow properties animated with dial opacity
      shadowColor: '#000',
      shadowOpacity: 0.25 * dialOpacity.value,
      shadowRadius: 12 * dialOpacity.value,
      shadowOffset: { width: 0, height: 6 * dialOpacity.value },
      elevation: 12 * dialOpacity.value,
    };
  });

  return (
    <Animated.View style={[styles.swipeDial, dialStyle]} pointerEvents="none">
      <DialText x={x} y={y} dialOpacity={dialOpacity} />
    </Animated.View>
  );
}

/* ─── Dial Text Component ─── */
function DialText({
  x,
  y,
  dialOpacity,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
  dialOpacity: SharedValue<number>;
}) {
  // Easy text (right swipe)
  const easyStyle = useAnimatedStyle(() => {
    const absX = Math.abs(x.value);
    const absY = Math.abs(y.value);
    const maxDistance = Math.max(absX, absY);
    const isHorizontal = absX > absY;
    const isEasy = isHorizontal && x.value > 0 && maxDistance > DIAL_CONFIG.ACTIVATION_DISTANCE;
    
    return {
      opacity: (isEasy ? 1 : 0) * dialOpacity.value,
      position: 'absolute' as const,
    };
  });

  // Again text (left swipe)
  const againStyle = useAnimatedStyle(() => {
    const absX = Math.abs(x.value);
    const absY = Math.abs(y.value);
    const maxDistance = Math.max(absX, absY);
    const isHorizontal = absX > absY;
    const isAgain = isHorizontal && x.value < 0 && maxDistance > DIAL_CONFIG.ACTIVATION_DISTANCE;
    
    return {
      opacity: (isAgain ? 1 : 0) * dialOpacity.value,
      position: 'absolute' as const,
    };
  });

  // Good text (up swipe)
  const goodStyle = useAnimatedStyle(() => {
    const absX = Math.abs(x.value);
    const absY = Math.abs(y.value);
    const maxDistance = Math.max(absX, absY);
    const isVertical = absY > absX;
    const isGood = isVertical && y.value < 0 && maxDistance > DIAL_CONFIG.ACTIVATION_DISTANCE;
    
    return {
      opacity: (isGood ? 1 : 0) * dialOpacity.value,
      position: 'absolute' as const,
    };
  });

  // Hard text (down swipe)
  const hardStyle = useAnimatedStyle(() => {
    const absX = Math.abs(x.value);
    const absY = Math.abs(y.value);
    const maxDistance = Math.max(absX, absY);
    const isVertical = absY > absX;
    const isHard = isVertical && y.value > 0 && maxDistance > DIAL_CONFIG.ACTIVATION_DISTANCE;
    
    return {
      opacity: (isHard ? 1 : 0) * dialOpacity.value,
      position: 'absolute' as const,
    };
  });

  return (
    <>
      <Animated.Text style={[styles.dialLabel, styles.easyText, easyStyle]}>
        EASY
      </Animated.Text>
      <Animated.Text style={[styles.dialLabel, styles.againText, againStyle]}>
        AGAIN
      </Animated.Text>
      <Animated.Text style={[styles.dialLabel, styles.goodText, goodStyle]}>
        GOOD
      </Animated.Text>
      <Animated.Text style={[styles.dialLabel, styles.hardText, hardStyle]}>
        HARD
      </Animated.Text>
    </>
  );
}

/* ─── Question/Answer Indicator Component ─── */
function QuestionAnswerIndicator({
  flip,
  style,
}: {
  flip: SharedValue<number>;
  style?: any;
}) {
  const questionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flip.value, [0, 0.5, 1], [1, 0, 0], 'clamp'),
  }));

  const answerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flip.value, [0, 0.5, 1], [0, 0, 1], 'clamp'),
  }));

  return (
    <Animated.View style={[styles.questionAnswerIndicator, style]}>
      <Animated.Text style={[styles.questionAnswerText, questionStyle]}>
        Q
      </Animated.Text>
      <Animated.Text style={[styles.questionAnswerText, answerStyle]}>
        A
      </Animated.Text>
    </Animated.View>
  );
}

/* ─── main Practice screen ─── */
export default function Practice() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getColors(isDark);
  const CARD_W = width * CARD_CONFIG.WIDTH_RATIO;
  const CARD_H = height * CARD_CONFIG.HEIGHT_RATIO;

  const [deck, setDeck] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<ScoreMap>({});
  
  /* shared anim values for the active card */
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rotZ = useSharedValue(0);
  const rotX = useSharedValue(0);
  const flip = useSharedValue(0);
  const dialOpacity = useSharedValue(0);
  const dialScale = useSharedValue(0.8);
  
  /* Card stack shared values - configurable */
  const nextCardScale = useSharedValue(CARD_STACK_CONFIG.SCALES[1] as number);
  const nextCardTranslateY = useSharedValue(CARD_STACK_CONFIG.Y_OFFSETS[1] as number);
  const nextCardOpacity = useSharedValue(CARD_STACK_CONFIG.OPACITIES[1] as number);
  
  const thirdCardScale = useSharedValue(CARD_STACK_CONFIG.SCALES[2] as number);
  const thirdCardTranslateY = useSharedValue(CARD_STACK_CONFIG.Y_OFFSETS[2] as number);
  const thirdCardOpacity = useSharedValue(CARD_STACK_CONFIG.OPACITIES[2] as number);

  /* Remove underlying card stack */

  /* load deck + scores only once */
  useEffect(() => {
    (async () => {
      const d = await AsyncStorage.getItem('deck');
      if (d) setDeck(JSON.parse(d));

      const s = await AsyncStorage.getItem(SCORE_STORAGE_KEY);
      if (s) setScores(JSON.parse(s));
    })();
  }, []);

  /* persist scores on change */
  useEffect(() => {
    AsyncStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(scores));
  }, [scores]);



  /* reset anim values */
  useEffect(() => {
    x.value = 0;
    y.value = 0;
    rotZ.value = 0;
    rotX.value = 0;
    flip.value = 0;
    dialOpacity.value = 0;
    dialScale.value = 0.8;
    
    // Reset card stack animation values to initial positions
    // (The advance function handles the smooth animation, this resets for the new layout)
    setTimeout(() => {
      nextCardScale.value = CARD_STACK_CONFIG.SCALES[1] as number;
      nextCardTranslateY.value = CARD_STACK_CONFIG.Y_OFFSETS[1] as number;
      nextCardOpacity.value = CARD_STACK_CONFIG.OPACITIES[1] as number;
      
      thirdCardScale.value = CARD_STACK_CONFIG.SCALES[2] as number;
      thirdCardTranslateY.value = CARD_STACK_CONFIG.Y_OFFSETS[2] as number;
      thirdCardOpacity.value = CARD_STACK_CONFIG.OPACITIES[2] as number;
    }, ANIMATION_CONFIG.TIMING.RESET_DELAY);
  }, [idx, x, y, rotZ, rotX, flip, dialOpacity, dialScale, nextCardScale, nextCardTranslateY, nextCardOpacity, thirdCardScale, thirdCardTranslateY, thirdCardOpacity]);

  const record = useCallback(
    (difficulty: DifficultyType) =>
      setScores((s: ScoreMap) => ({
        ...s,
        [idx]: {
          again: difficulty === 'again' ? (s[idx]?.again ?? 0) + 1 : s[idx]?.again ?? 0,
          hard: difficulty === 'hard' ? (s[idx]?.hard ?? 0) + 1 : s[idx]?.hard ?? 0,
          good: difficulty === 'good' ? (s[idx]?.good ?? 0) + 1 : s[idx]?.good ?? 0,
          easy: difficulty === 'easy' ? (s[idx]?.easy ?? 0) + 1 : s[idx]?.easy ?? 0,
        },
      })),
    [idx],
  );

  /* animate card stack forward */
  const animateStackForward = useCallback(() => {
    // Animate next card to current position (position 0)
    nextCardScale.value = withSpring(CARD_STACK_CONFIG.SCALES[0], ANIMATION_CONFIG.STACK_SPRING);
    nextCardTranslateY.value = withSpring(CARD_STACK_CONFIG.Y_OFFSETS[0], ANIMATION_CONFIG.STACK_SPRING);
    nextCardOpacity.value = withSpring(CARD_STACK_CONFIG.OPACITIES[0], ANIMATION_CONFIG.STACK_SPRING);
    
    // Animate third card to next position (position 1)
    thirdCardScale.value = withSpring(CARD_STACK_CONFIG.SCALES[1], ANIMATION_CONFIG.STACK_SPRING);
    thirdCardTranslateY.value = withSpring(CARD_STACK_CONFIG.Y_OFFSETS[1], ANIMATION_CONFIG.STACK_SPRING);
    thirdCardOpacity.value = withSpring(CARD_STACK_CONFIG.OPACITIES[1], ANIMATION_CONFIG.STACK_SPRING);
  }, [nextCardScale, nextCardTranslateY, nextCardOpacity, thirdCardScale, thirdCardTranslateY, thirdCardOpacity]);

  /* advance to next index */
  const advance = useCallback(() => {
    // First animate the stack forward
    animateStackForward();
    
    // Then update the index after a short delay
    setTimeout(() => {
      setIdx((currentIdx) => (currentIdx + 1 < deck.length ? currentIdx + 1 : currentIdx));
    }, ANIMATION_CONFIG.TIMING.ADVANCE_DELAY);
  }, [deck.length, animateStackForward]);

  /* vibration feedback for swipe */
  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);



  /* ─── Enhanced Gesture definitions ─── */

  /* Tap-to-flip with configurable animation */
  const tap = Gesture.Tap().onEnd(() => {
    flip.value = withSpring(flip.value ? 0 : 1, ANIMATION_CONFIG.CARD_FLIP);
  });

  /* Enhanced Pan gesture with configurable sensitivity */
  const pan = Gesture.Pan()
    .activeOffsetX([-SWIPE_CONFIG.ACTIVE_OFFSET, SWIPE_CONFIG.ACTIVE_OFFSET])
    .activeOffsetY([-SWIPE_CONFIG.ACTIVE_OFFSET, SWIPE_CONFIG.ACTIVE_OFFSET])
    .onUpdate((e: any) => {
      x.value = e.translationX;
      y.value = e.translationY;
      
      // Smoother rotation curves
      rotZ.value = (x.value / width) * SWIPE_CONFIG.CARD_ROTATION_MAX * 0.8;
      rotX.value = (y.value / height) * SWIPE_CONFIG.CARD_TILT_MAX * 0.6;
      
      // Control dial fade in and scale based on movement
      const absX = Math.abs(x.value);
      const absY = Math.abs(y.value);
      const maxDistance = Math.max(absX, absY);
      
      if (maxDistance > DIAL_CONFIG.ACTIVATION_DISTANCE) {
        const targetOpacity = interpolate(maxDistance, [DIAL_CONFIG.ACTIVATION_DISTANCE, DIAL_CONFIG.MAX_DISTANCE], [0, 1], 'clamp');
        const targetScale = interpolate(maxDistance, [DIAL_CONFIG.ACTIVATION_DISTANCE, DIAL_CONFIG.MAX_DISTANCE], [0.8, 1.1], 'clamp');
        dialOpacity.value = withSpring(targetOpacity, { damping: 20, stiffness: 2000 });
        dialScale.value = withSpring(targetScale, { damping: 20, stiffness: 2000 });
      }
    })
    .onEnd((e: any) => {
      const absX = Math.abs(x.value);
      const absY = Math.abs(y.value);
      const velX = Math.abs(e.velocityX);
      const velY = Math.abs(e.velocityY);
      
      // More responsive swipe detection
      const isHorizontal = absX > absY;
      const swipeThreshold = SWIPE_CONFIG.THRESHOLD_DISTANCE;
      const velocity = isHorizontal ? velX : velY;
      const distance = isHorizontal ? absX : absY;
      
      const isSwipe = distance > swipeThreshold || velocity > SWIPE_CONFIG.THRESHOLD_VELOCITY;
      
      if (isSwipe) {
        // Trigger haptic feedback for successful swipe
        runOnJS(triggerHaptic)();
        
        let difficulty: DifficultyType;
        let targetX = 0;
        let targetY = 0;
        
        if (isHorizontal) {
          if (x.value > 0) {
            difficulty = DIFFICULTY.EASY;
            targetX = width * 1.3;
          } else {
            difficulty = DIFFICULTY.AGAIN;
            targetX = -width * 1.3;
          }
        } else {
          if (y.value < 0) {
            difficulty = DIFFICULTY.GOOD;
            targetY = -height * 1.3;
          } else {
            difficulty = DIFFICULTY.HARD;
            targetY = height * 1.3;
          }
        }
        
        // Lock dial at full size and opacity, then fade out with delay on swipe
        dialScale.value = 1.1; // Lock at full size
        dialOpacity.value = 1.0; // Lock at full opacity
        dialOpacity.value = withDelay(300, withSpring(0, { damping: 20, stiffness: 200 }));
        
        // Smooth card exit animation
        x.value = withTiming(targetX, ANIMATION_CONFIG.SWIPE_EXIT);
        y.value = withTiming(targetY, ANIMATION_CONFIG.SWIPE_EXIT, (finished?: boolean) => {
          if (finished) {
            runOnJS(record)(difficulty);
            runOnJS(advance)();
          }
        });
      } else {
        // Fade out dial with small delay when returning to center
        dialOpacity.value = withDelay(300, withSpring(0, { damping: 20, stiffness: 200 }));
        dialScale.value = withDelay(300, withSpring(0.8, { damping: 20, stiffness: 200 }));
        
        // Smooth spring back using config
        x.value = withSpring(0, ANIMATION_CONFIG.SPRING_BACK);
        y.value = withSpring(0, ANIMATION_CONFIG.SPRING_BACK);
        rotZ.value = withSpring(0, ANIMATION_CONFIG.SPRING_BACK);
        rotX.value = withSpring(0, ANIMATION_CONFIG.SPRING_BACK);
      }
    });

  const gesture = Gesture.Simultaneous(pan, tap);

  /* ─── Enhanced Animated styles ─── */
  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { translateX: x.value },
      { translateY: y.value },
      { rotateZ: `${rotZ.value}deg` },
      { rotateX: `${rotX.value}deg` },
      { rotateY: `${flip.value * 180}deg` },
    ],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { translateX: x.value },
      { translateY: y.value },
      { rotateZ: `${rotZ.value}deg` },
      { rotateX: `${rotX.value}deg` },
      { rotateY: `${180 + flip.value * 180}deg` },
    ],
    backfaceVisibility: 'hidden',
  }));

  const flipIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(x.value) + Math.abs(y.value), [0, 50], [1, 0], 'clamp'),
  }));

  /* Next card animated style */
  const nextCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: nextCardScale.value },
      { translateY: nextCardTranslateY.value },
    ],
    opacity: nextCardOpacity.value,
  }));

  /* Third card animated style */
  const thirdCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: thirdCardScale.value },
      { translateY: thirdCardTranslateY.value },
    ],
    opacity: thirdCardOpacity.value,
  }));



  /* ─── guard if deck is empty ─── */
  if (!deck.length) {
    return (
      <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.loadingText }]}>Loading deck…</Text>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Question/Answer Indicator - Near Dynamic Island */}
      <QuestionAnswerIndicator 
        flip={flip} 
        style={[flipIndicatorStyle, { 
          position: 'absolute',
          top: insets.top - 8, // Position much closer to actual island
          right: 20, // Closer to where island actually is
          zIndex: 1000,
        }]} 
      />
      
      {/* Swipe Dial Indicator */}
      <SwipeDial x={x} y={y} isDark={isDark} dialOpacity={dialOpacity} dialScale={dialScale} />

      {/* Card Stack Container */}
      <View style={styles.cardStack}>
        {/* Third Card (Furthest Back) */}
        {idx + 2 < deck.length && (
          <Animated.View
            style={[
              styles.cardStackItem,
              thirdCardStyle,
              { zIndex: CARD_STACK_CONFIG.Z_INDICES[2] }
            ]}
            pointerEvents="none"
          >
            <Animated.View
              style={[
                styles.card,
                styles.shadow,
                { 
                  width: CARD_W, 
                  height: CARD_H, 
                  alignSelf: 'center',
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.txt, { color: colors.text }]}>{deck[idx + 2]?.question}</Text>
            </Animated.View>
          </Animated.View>
        )}

        {/* Next Card (Middle) */}
        {idx + 1 < deck.length && (
          <Animated.View
            style={[
              styles.cardStackItem,
              nextCardStyle,
              { zIndex: CARD_STACK_CONFIG.Z_INDICES[1] }
            ]}
            pointerEvents="none"
          >
            <Animated.View
              style={[
                styles.card,
                styles.shadow,
                { 
                  width: CARD_W, 
                  height: CARD_H, 
                  alignSelf: 'center',
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.txt, { color: colors.text }]}>{deck[idx + 1]?.question}</Text>
            </Animated.View>
          </Animated.View>
        )}

        {/* Current Card (Front) */}
        <View style={[styles.cardStackItem, { zIndex: CARD_STACK_CONFIG.Z_INDICES[0] }]}>
          <GestureDetector gesture={gesture}>
            <Animated.View>
              {/* Front face */}
              <Animated.View
                style={[
                  styles.card,
                  styles.shadow,
                  { 
                    width: CARD_W, 
                    height: CARD_H, 
                    alignSelf: 'center',
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.cardBorder,
                  },
                  frontStyle,
                ]}
              >
                <Text style={[styles.txt, { color: colors.text }]}>{deck[idx]?.question}</Text>
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
                    backgroundColor: colors.cardBackBackground,
                    borderColor: colors.cardBorder,
                  },
                  backStyle,
                ]}
              >
                <Text style={[styles.txt, { color: colors.text }]}>{deck[idx]?.answer}</Text>
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

/* ─── Enhanced styles ─── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 0, // Let the tab bar handle bottom spacing
  },
  card: {
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  shadow: {
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  back: {
    backfaceVisibility: 'hidden',
  },
  txt: {
    fontSize: 24,
    textAlign: 'center',
    padding: 32,
    lineHeight: 32,
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    padding: 30,
    fontSize: 18,
  },
  // Swipe Dial Styles
  swipeDial: {
    position: 'absolute',
    top: '50%',
    marginTop: -(DIAL_CONFIG.SIZE / 2),
    alignSelf: 'center',
    width: DIAL_CONFIG.SIZE,
    height: DIAL_CONFIG.SIZE,
    borderRadius: DIAL_CONFIG.SIZE / 2,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    // All shadow properties now controlled by animated style
  },
  dialLabel: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  easyText: {
    color: '#007AFF',
  },
  againText: {
    color: '#FF3B30',
  },
  goodText: {
    color: '#34C759',
  },
  hardText: {
    color: '#FF9500',
  },
  questionAnswerIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  questionAnswerText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    color: 'white',
    position: 'absolute',
  },
  cardStack: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardStackItem: {
    position: 'absolute',
  },
});
