import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

interface LoadingIndicatorProps {
  size?: number;
  color?: string;
  variant?: 'dots' | 'ring' | 'neon' | 'wave' | 'brand' | 'combo';
  brandColors?: string[];
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 48,
  color = '#FFFFFF',
  variant = 'dots',
  brandColors = ['#00F5FF', '#FF00E5', '#FFE66D'],
}) => {
  const spin = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const createDotLoop = (value: Animated.Value, delayMs: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delayMs),
          Animated.timing(value, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 350,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );

    const createWaveLoop = (value: Animated.Value, delayMs: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delayMs),
          Animated.timing(value, {
            toValue: 1,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 240,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      );

    const dot1Anim = createDotLoop(dot1, 0);
    const dot2Anim = createDotLoop(dot2, 120);
    const dot3Anim = createDotLoop(dot3, 240);
    const wave1Anim = createWaveLoop(wave1, 0);
    const wave2Anim = createWaveLoop(wave2, 120);
    const wave3Anim = createWaveLoop(wave3, 240);

    if (variant === 'wave') {
      wave1Anim.start();
      wave2Anim.start();
      wave3Anim.start();
    } else {
      spinAnim.start();
      dot1Anim.start();
      dot2Anim.start();
      dot3Anim.start();
    }

    return () => {
      spinAnim.stop();
      dot1Anim.stop();
      dot2Anim.stop();
      dot3Anim.stop();
      wave1Anim.stop();
      wave2Anim.stop();
      wave3Anim.stop();
    };
  }, [dot1, dot2, dot3, spin, variant, wave1, wave2, wave3]);

  const ringSize = Math.max(28, size);
  const ringBorder = Math.max(2, Math.round(ringSize * 0.08));
  const dotSize = Math.max(6, Math.round(ringSize * 0.16));
  const waveWidth = Math.max(4, Math.round(ringSize * 0.12));
  const waveHeight = Math.max(18, Math.round(ringSize * 0.5));
  const waveGap = Math.max(4, Math.round(ringSize * 0.1));

  const spinStyle = {
    transform: [
      {
        rotate: spin.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  const buildDotStyle = (value: Animated.Value) => ({
    transform: [
      {
        scale: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0.7, 1.2],
        }),
      },
    ],
    opacity: value.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    }),
  });

  const buildWaveStyle = (value: Animated.Value) => ({
    transform: [
      {
        scaleY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0.4, 1],
        }),
      },
    ],
    opacity: value.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1],
    }),
  });

  const neonGlowStyle =
    variant === 'neon'
      ? {
          shadowColor: color,
          shadowOpacity: 0.9,
          shadowRadius: Math.round(ringSize * 0.35),
          shadowOffset: { width: 0, height: 0 },
        }
      : undefined;

  const showRing = variant === 'ring' || variant === 'neon' || variant === 'combo';
  const showDots = variant === 'dots' || variant === 'brand' || variant === 'combo';

  return (
    <View style={styles.container}>
      {showRing && (
        <Animated.View
          style={[
            styles.ring,
            {
              width: ringSize,
              height: ringSize,
              borderRadius: ringSize / 2,
              borderWidth: ringBorder,
              borderColor: 'rgba(255, 255, 255, 0.35)',
              borderTopColor: color,
            },
            neonGlowStyle,
            spinStyle,
          ]}
        />
      )}

      {variant === 'wave' && (
        <View style={[styles.waveContainer, { height: waveHeight }]}>
          <Animated.View
            style={[
              styles.waveBar,
              {
                width: waveWidth,
                height: waveHeight,
                backgroundColor: color,
                marginRight: waveGap,
              },
              buildWaveStyle(wave1),
            ]}
          />
          <Animated.View
            style={[
              styles.waveBar,
              {
                width: waveWidth,
                height: waveHeight,
                backgroundColor: color,
                marginRight: waveGap,
              },
              buildWaveStyle(wave2),
            ]}
          />
          <Animated.View
            style={[
              styles.waveBar,
              {
                width: waveWidth,
                height: waveHeight,
                backgroundColor: color,
              },
              buildWaveStyle(wave3),
            ]}
          />
        </View>
      )}

      {showDots && (
        <View style={[styles.dots, { marginTop: Math.round(ringSize * 0.25) }]}>
          <Animated.View
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: variant === 'brand' ? (brandColors[0] ?? color) : color,
              },
              buildDotStyle(dot1),
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: variant === 'brand' ? (brandColors[1] ?? color) : color,
              },
              buildDotStyle(dot2),
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: variant === 'brand' ? (brandColors[2] ?? color) : color,
              },
              buildDotStyle(dot3),
            ]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveBar: {
    borderRadius: 4,
  },
  dot: {
    opacity: 0.9,
  },
});

export default LoadingIndicator;
