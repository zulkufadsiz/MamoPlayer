import React from 'react';
import { ActivityIndicator, Animated, StyleSheet } from 'react-native';

interface BufferingIndicatorProps {
  buffering: boolean;
}

export const BufferingIndicator = ({ buffering }: BufferingIndicatorProps) => {
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: buffering ? 1 : 0,
      duration: buffering ? 200 : 350,
      useNativeDriver: true,
    }).start();
  }, [buffering, opacityAnim]);

  return (
    <Animated.View
      style={[styles.container, { opacity: opacityAnim }]}
      pointerEvents="none"
    >
      <ActivityIndicator size="large" color="#FFFFFF" />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
