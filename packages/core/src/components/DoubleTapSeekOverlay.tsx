import MaterialIcons from '@react-native-vector-icons/material-icons';
import React from 'react';
import { Animated, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

const DOUBLE_TAP_DELAY_MS = 300;

interface DoubleTapSeekOverlayProps {
  onSeekBackward: () => void;
  onSeekForward: () => void;
  onSingleTap: () => void;
}

interface SeekIndicatorProps {
  side: 'left' | 'right';
  animValue: Animated.Value;
}

const SeekIndicator = ({ side, animValue }: SeekIndicatorProps) => (
  <Animated.View
    style={[
      styles.indicatorWrapper,
      side === 'left' ? styles.indicatorWrapperLeft : styles.indicatorWrapperRight,
      { opacity: animValue },
    ]}
    pointerEvents="none"
  >
    <View style={styles.indicatorPill}>
      {side === 'left' ? (
        <>
          <MaterialIcons name="fast-rewind" size={32} color="#FFFFFF" />
          <Text style={styles.indicatorText}>10s</Text>
        </>
      ) : (
        <>
          <Text style={styles.indicatorText}>10s</Text>
          <MaterialIcons name="fast-forward" size={32} color="#FFFFFF" />
        </>
      )}
    </View>
  </Animated.View>
);

export const DoubleTapSeekOverlay = ({
  onSeekBackward,
  onSeekForward,
  onSingleTap,
}: DoubleTapSeekOverlayProps) => {
  const leftTapTimeRef = React.useRef<number>(0);
  const rightTapTimeRef = React.useRef<number>(0);
  const leftSingleTapTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const rightSingleTapTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const leftAnimValue = React.useRef(new Animated.Value(0)).current;
  const rightAnimValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    return () => {
      if (leftSingleTapTimerRef.current !== null) clearTimeout(leftSingleTapTimerRef.current);
      if (rightSingleTapTimerRef.current !== null) clearTimeout(rightSingleTapTimerRef.current);
    };
  }, []);

  const showIndicator = React.useCallback(
    (side: 'left' | 'right') => {
      const animValue = side === 'left' ? leftAnimValue : rightAnimValue;
      animValue.stopAnimation();
      animValue.setValue(0);
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.delay(450),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [leftAnimValue, rightAnimValue],
  );

  const handleLeftPress = React.useCallback(() => {
    const now = Date.now();
    const elapsed = now - leftTapTimeRef.current;

    if (elapsed < DOUBLE_TAP_DELAY_MS && leftTapTimeRef.current !== 0) {
      // Double-tap: cancel pending single-tap and seek backward
      if (leftSingleTapTimerRef.current !== null) {
        clearTimeout(leftSingleTapTimerRef.current);
        leftSingleTapTimerRef.current = null;
      }
      leftTapTimeRef.current = 0;
      onSeekBackward();
      showIndicator('left');
    } else {
      // First tap: record time and wait to see if a second tap arrives
      leftTapTimeRef.current = now;
      if (leftSingleTapTimerRef.current !== null) clearTimeout(leftSingleTapTimerRef.current);
      leftSingleTapTimerRef.current = setTimeout(() => {
        leftTapTimeRef.current = 0;
        leftSingleTapTimerRef.current = null;
        onSingleTap();
      }, DOUBLE_TAP_DELAY_MS);
    }
  }, [onSeekBackward, onSingleTap, showIndicator]);

  const handleRightPress = React.useCallback(() => {
    const now = Date.now();
    const elapsed = now - rightTapTimeRef.current;

    if (elapsed < DOUBLE_TAP_DELAY_MS && rightTapTimeRef.current !== 0) {
      // Double-tap: cancel pending single-tap and seek forward
      if (rightSingleTapTimerRef.current !== null) {
        clearTimeout(rightSingleTapTimerRef.current);
        rightSingleTapTimerRef.current = null;
      }
      rightTapTimeRef.current = 0;
      onSeekForward();
      showIndicator('right');
    } else {
      // First tap: record time and wait to see if a second tap arrives
      rightTapTimeRef.current = now;
      if (rightSingleTapTimerRef.current !== null) clearTimeout(rightSingleTapTimerRef.current);
      rightSingleTapTimerRef.current = setTimeout(() => {
        rightTapTimeRef.current = 0;
        rightSingleTapTimerRef.current = null;
        onSingleTap();
      }, DOUBLE_TAP_DELAY_MS);
    }
  }, [onSeekForward, onSingleTap, showIndicator]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <TouchableWithoutFeedback
        onPress={handleLeftPress}
        testID="double-tap-left"
        accessibilityRole="button"
        accessibilityLabel="Double tap to seek backward 10 seconds"
        accessibilityHint="Double tap to seek backward"
      >
        <View style={styles.half} />
      </TouchableWithoutFeedback>
      <TouchableWithoutFeedback
        onPress={handleRightPress}
        testID="double-tap-right"
        accessibilityRole="button"
        accessibilityLabel="Double tap to seek forward 10 seconds"
        accessibilityHint="Double tap to seek forward"
      >
        <View style={styles.half} />
      </TouchableWithoutFeedback>
      <SeekIndicator side="left" animValue={leftAnimValue} />
      <SeekIndicator side="right" animValue={rightAnimValue} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
  half: {
    flex: 1,
  },
  indicatorWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorWrapperLeft: {
    left: 0,
  },
  indicatorWrapperRight: {
    right: 0,
  },
  indicatorPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  indicatorText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

