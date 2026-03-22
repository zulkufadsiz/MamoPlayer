
import MaterialIcons from '@react-native-vector-icons/material-icons';
import React from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import type { CastState } from '../types/casting';

export interface PlaybackOptionsProps {
  /** Whether the player is currently playing. */
  isPlaying: boolean;
  /** Whether the player is currently in fullscreen mode. */
  isFullscreen?: boolean;
  /** Called when the user taps the seek-back button (−10 s). */
  onSeekBack?: () => void;
  /** Called when the user taps the play/pause button. */
  onTogglePlayPause: () => void;
  /** Called when the user taps the seek-forward button (+10 s). */
  onSeekForward?: () => void;
  /** Called when the user taps the fullscreen toggle button. */
  onToggleFullscreen?: () => void;
  /** Called when the user taps the settings (gear) button. */
  onToggleSettingsMenu?: () => void;
  /** Whether to render the fullscreen toggle button. Defaults to `true` when `onToggleFullscreen` is provided. */
  showFullscreenButton?: boolean;
  /** Whether to render the settings (gear) button. Defaults to `true` when `onToggleSettingsMenu` is provided. */
  showSettingsMenuButton?: boolean;
  /** Whether to render the seek-back / play-pause / seek-forward transport row. Defaults to `true`. */
  showTransportButtons?: boolean;
  /** Render in compact mode with smaller tap targets. Used in the top-right inline controls bar. */
  compact?: boolean;
  /** Current cast session state. Controls icon appearance. */
  castState?: CastState;
  /** Called when the user taps the cast button. */
  onPressCast?: () => void;
  /** Show the cast button. Defaults to false. */
  showCastButton?: boolean;
}

/** Maps a CastState to a tint colour for the cast icon. */
const castIconColor = (state: CastState | undefined): string => {
  if (state === 'connected') return '#5BB5FF';
  if (state === 'connecting') return '#FFC840';
  return 'white';
};

/** Animated cast icon that pulses while connecting. */
const CastIcon: React.FC<{ state: CastState | undefined; size: number }> = ({ state, size }) => {
  const opacity = React.useRef(new Animated.Value(1));

  React.useEffect(() => {
    if (state !== 'connecting') {
      opacity.current.setValue(1);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity.current, { toValue: 0.35, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity.current, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [state]);

  return (
    <Animated.View style={{ opacity: opacity.current }}>
      <MaterialIcons
        name={state === 'connected' ? 'cast-connected' : 'cast'}
        color={castIconColor(state)}
        size={size}
      />
    </Animated.View>
  );
};

export const PlaybackOptions: React.FC<PlaybackOptionsProps> = ({
  isPlaying,
  isFullscreen = false,
  onSeekBack,
  onTogglePlayPause,
  onSeekForward,
  onToggleFullscreen,
  onToggleSettingsMenu,
  showFullscreenButton = Boolean(onToggleFullscreen),
  showSettingsMenuButton = Boolean(onToggleSettingsMenu),
  showTransportButtons = true,
  compact = false,
  castState,
  onPressCast,
  showCastButton = false,
}) => {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {showSettingsMenuButton && onToggleSettingsMenu ? (
        <Pressable
          style={({ pressed }) => [styles.optionButton, compact && styles.optionButtonCompact, pressed && styles.optionButtonPressed]}
          onPress={onToggleSettingsMenu}
          accessibilityRole="button"
          accessibilityLabel="Open settings menu"
          testID="core-settings-menu-button"
        >
          <MaterialIcons
            name="settings"
            color="white"
            size={compact ? 20 : 44}
            style={[styles.actionIcon, compact && styles.actionIconCompact]}
          />
        </Pressable>
      ) : null}
      {showTransportButtons ? (
        <>
          {onSeekBack ? (
            <Pressable
              style={({ pressed }) => [styles.optionButton, pressed && styles.optionButtonPressed]}
              onPress={onSeekBack}
              accessibilityRole="button"
              accessibilityLabel="Seek backward 10 seconds"
            >
              <View style={styles.seekButtonVisual}>
                <MaterialIcons name="fast-rewind" color="white" size={44} style={styles.seekIcon} />
              </View>
            </Pressable>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.playPauseButton, pressed && styles.optionButtonPressed]}
            onPress={onTogglePlayPause}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            testID="core-play-pause-button"
          >
            {isPlaying ? (
              <MaterialIcons name="pause" color="white" size={30} style={styles.playPauseIcon} />
            ) : (
              <MaterialIcons name="play-arrow" color="white" size={30} style={styles.playPauseIcon} />
            )}
          </Pressable>

          {onSeekForward ? (
            <Pressable
              style={({ pressed }) => [styles.optionButton, pressed && styles.optionButtonPressed]}
              onPress={onSeekForward}
              accessibilityRole="button"
              accessibilityLabel="Seek forward 10 seconds"
            >
              <View style={styles.seekButtonVisual}>
                <MaterialIcons name="fast-forward" color="white" size={44} style={styles.seekIcon} />
              </View>
            </Pressable>
          ) : null}
        </>
      ) : null}
      {showFullscreenButton && onToggleFullscreen ? (
        <Pressable
          style={({ pressed }) => [styles.optionButton, compact && styles.optionButtonCompact, pressed && styles.optionButtonPressed]}
          onPress={onToggleFullscreen}
          accessibilityRole="button"
          accessibilityLabel={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          testID="core-toggle-fullscreen-button"
        >
          <MaterialIcons
            name={isFullscreen ? 'close-fullscreen' : 'open-in-full'}
            color="white"
            size={compact ? 20 : 24}
            style={[styles.fullscreenIcon, compact && styles.fullscreenIconCompact]}
          />
        </Pressable>
      ) : null}
      {showCastButton && onPressCast && castState !== 'unavailable' ? (
        <Pressable
          style={({ pressed }) => [
            styles.optionButton,
            compact && styles.optionButtonCompact,
            pressed && styles.optionButtonPressed,
          ]}
          onPress={onPressCast}
          accessibilityRole="button"
          accessibilityLabel={
            castState === 'connected'
              ? 'Casting — tap to disconnect'
              : castState === 'connecting'
                ? 'Connecting to cast device'
                : 'Cast to device'
          }
          testID="core-cast-button"
        >
          <CastIcon state={castState} size={compact ? 20 : 24} />
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  containerCompact: {
    gap: 2,
  },
  optionButton: {
    minWidth: 64,
    minHeight: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  optionButtonCompact: {
    minWidth: 40,
    minHeight: 40,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonPressed: {
    opacity: 0.75,
  },
  seekButtonVisual: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  seekNumber: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
    position: 'absolute',
    top: 22,
  },
  seekNumberBack: {
    paddingRight: 0,
  },
  seekNumberForward: {
    paddingLeft: 0,
  },
  seekArrow: {
    position: 'absolute',
    top: 0,
    color: 'rgba(255, 255, 255, 0.61)',
    fontSize: 44,
  },
  seekIcon: {
    opacity: 0.72,
  },
  actionIcon: {
    color: '#F3F4F6',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  actionIconCompact: {
    opacity: 0.9,
  },
  fullscreenIcon: {
    opacity: 0.9,
    fontSize: 24,
    lineHeight: 24,
  },
  fullscreenIconCompact: {
    opacity: 0.9,
  },
  playPauseIcon: {
    color: '#FFFFFF',
    fontSize: 44,
    lineHeight: 50,
    opacity: 0.82,
  },
  playIcon: {
    marginLeft: 2,
  },
});
