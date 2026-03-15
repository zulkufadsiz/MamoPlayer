import React from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';

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
      testID="buffering-indicator"
    >
      <View style={styles.backdrop}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
