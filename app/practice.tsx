/* app/practice.tsx — Enhanced with smooth transitions and professional swipe dial */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, useColorScheme, useWindowDimensions } from 'react-native';
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
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ─── constants ─── */
const SWIPE_THRESHOLD_DISTANCE = 100;
const SWIPE_THRESHOLD_VELOCITY = 800;
const CARD_ROTATION_MAX = 12;
const CARD_TILT_MAX = 8;
const CARD_STACK_SIZE = 3;
const SCORE_STORAGE_KEY = 'deckScores';

// Dial settings
const DIAL_ACTIVATION_DISTANCE = 0;
const DIAL_MAX_DISTANCE = 150;
const DIAL_SIZE = 180;

// Animation timings
const SWIPE_EXIT_DURATION = 400;
const CARD_STACK_DELAY_BASE = 5000;
const CARD_STACK_DELAY_INCREMENT = 0;

// Card sizing
const CARD_WIDTH_RATIO = 0.9;
const CARD_HEIGHT_RATIO = 0.75;
const CARD_SCALE_DECREMENT = 0.06;
const CARD_TRANSLATE_Y_INCREMENT = 9;

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
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
  isDark: boolean;
}) {
  const dialStyle = useAnimatedStyle(() => {
    const absX = Math.abs(x.value);
    const absY = Math.abs(y.value);
    const maxDistance = Math.max(absX, absY);
    const opacity = interpolate(maxDistance, [DIAL_ACTIVATION_DISTANCE, DIAL_MAX_DISTANCE], [0, 1], 'clamp');
    
    // Determine dominant direction and set color
    const isHorizontal = absX > absY;
    let color = '#000';
    
    if (maxDistance > DIAL_ACTIVATION_DISTANCE) {
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
      opacity,
      transform: [
        { scale: interpolate(maxDistance, [DIAL_ACTIVATION_DISTANCE, DIAL_MAX_DISTANCE], [0.8, 1.1], 'clamp') },
      ],
      borderColor: color,
      backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
    };
  });

  return (
    <Animated.View style={[styles.swipeDial, dialStyle]} pointerEvents="none">
      <DialText x={x} y={y} />
    </Animated.View>
  );
}

/* ─── Dial Text Component ─── */
function DialText({
  x,
  y,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
}) {
  // Easy text (right swipe)
  const easyStyle = useAnimatedStyle(() => {
    const absX = Math.abs(x.value);
    const absY = Math.abs(y.value);
    const maxDistance = Math.max(absX, absY);
    const isHorizontal = absX > absY;
    const isEasy = isHorizontal && x.value > 0 && maxDistance > DIAL_ACTIVATION_DISTANCE;
    
    return {
      opacity: isEasy ? 1 : 0,
      position: 'absolute' as const,
    };
  });

  // Again text (left swipe)
  const againStyle = useAnimatedStyle(() => {
    const absX = Math.abs(x.value);
    const absY = Math.abs(y.value);
    const maxDistance = Math.max(absX, absY);
    const isHorizontal = absX > absY;
    const isAgain = isHorizontal && x.value < 0 && maxDistance > DIAL_ACTIVATION_DISTANCE;
    
    return {
      opacity: isAgain ? 1 : 0,
      position: 'absolute' as const,
    };
  });

  // Good text (up swipe)
  const goodStyle = useAnimatedStyle(() => {
    const absX = Math.abs(x.value);
    const absY = Math.abs(y.value);
    const maxDistance = Math.max(absX, absY);
    const isVertical = absY > absX;
    const isGood = isVertical && y.value < 0 && maxDistance > DIAL_ACTIVATION_DISTANCE;
    
    return {
      opacity: isGood ? 1 : 0,
      position: 'absolute' as const,
    };
  });

  // Hard text (down swipe)
  const hardStyle = useAnimatedStyle(() => {
    const absX = Math.abs(x.value);
    const absY = Math.abs(y.value);
    const maxDistance = Math.max(absX, absY);
    const isVertical = absY > absX;
    const isHard = isVertical && y.value > 0 && maxDistance > DIAL_ACTIVATION_DISTANCE;
    
    return {
      opacity: isHard ? 1 : 0,
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
  const CARD_W = width * CARD_WIDTH_RATIO;
  const CARD_H = height * CARD_HEIGHT_RATIO;

  const [deck, setDeck] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<ScoreMap>({});
  /* shared anim values for the active card */
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const rotZ = useSharedValue(0);
  const rotX = useSharedValue(0);
  const flip = useSharedValue(0);

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
  }, [idx]);

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

  /* advance to next index immediately */
  const advance = useCallback(() => {
    setIdx((i: number) => (i + 1 < deck.length ? i + 1 : i));
  }, [deck.length]);

  /* vibration feedback for swipe */
  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);



  /* ─── Enhanced Gesture definitions ─── */

  /* Tap-to-flip with ultra-smooth animation */
  const tap = Gesture.Tap().onEnd(() => {
    flip.value = withSpring(flip.value ? 0 : 1, {
      damping: 20,
      stiffness: 180,
      mass: 0.8,
    });
  });

  /* Enhanced Pan gesture with smooth dial feedback */
  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .activeOffsetY([-8, 8])
    .onUpdate((e: any) => {
      x.value = e.translationX;
      y.value = e.translationY;
      
      // Smoother rotation curves
      rotZ.value = (x.value / width) * CARD_ROTATION_MAX * 0.8;
      rotX.value = (y.value / height) * CARD_TILT_MAX * 0.6;
    })
    .onEnd((e: any) => {
      const absX = Math.abs(x.value);
      const absY = Math.abs(y.value);
      const velX = Math.abs(e.velocityX);
      const velY = Math.abs(e.velocityY);
      
      // More responsive swipe detection
      const isHorizontal = absX > absY;
      const swipeThreshold = SWIPE_THRESHOLD_DISTANCE;
      const velocity = isHorizontal ? velX : velY;
      const distance = isHorizontal ? absX : absY;
      
      const isSwipe = distance > swipeThreshold || velocity > SWIPE_THRESHOLD_VELOCITY;
      
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
        
        // Smooth card exit animation
        const exitConfig = {
          duration: SWIPE_EXIT_DURATION,
          easing: Easing.out(Easing.cubic),
        };
        
        x.value = withTiming(targetX, exitConfig);
        y.value = withTiming(targetY, exitConfig, (finished?: boolean) => {
          if (finished) {
            runOnJS(record)(difficulty);
            runOnJS(advance)();
          }
        });
      } else {
        // Buttery smooth spring back
        const springConfig = { damping: 25, stiffness: 250, mass: 0.8 };
        x.value = withSpring(0, springConfig);
        y.value = withSpring(0, springConfig);
        rotZ.value = withSpring(0, springConfig);
        rotX.value = withSpring(0, springConfig);
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
      <SwipeDial x={x} y={y} isDark={isDark} />

      {/* Active card with enhanced gestures */}
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
    marginTop: -(DIAL_SIZE / 2),
    alignSelf: 'center',
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_SIZE / 2,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
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
});
