
import MaterialIcons from '@react-native-vector-icons/material-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export interface PlaybackOptionsProps {
  isPlaying: boolean;
  onSeekBack: () => void;
  onTogglePlayPause: () => void;
  onSeekForward: () => void;
  onToggleFullscreen?: () => void;
  onToggleSettingsMenu?: () => void;
  showFullscreenButton?: boolean;
  showSettingsMenuButton?: boolean;
  showTransportButtons?: boolean;
  compact?: boolean;
}

export const PlaybackOptions: React.FC<PlaybackOptionsProps> = ({
  isPlaying,
  onSeekBack,
  onTogglePlayPause,
  onSeekForward,
  onToggleFullscreen,
  onToggleSettingsMenu,
  showFullscreenButton = Boolean(onToggleFullscreen),
  showSettingsMenuButton = Boolean(onToggleSettingsMenu),
  showTransportButtons = true,
  compact = false,
}) => {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {showFullscreenButton && onToggleFullscreen ? (
        <Pressable
          style={({ pressed }) => [styles.optionButton, compact && styles.optionButtonCompact, pressed && styles.optionButtonPressed]}
          onPress={onToggleFullscreen}
          accessibilityRole="button"
          accessibilityLabel="Toggle fullscreen"
          testID="core-toggle-fullscreen-button"
        >
          <MaterialIcons
            name="crop-free"
            color="white"
            size={compact ? 20 : 24}
            style={[styles.fullscreenIcon, compact && styles.fullscreenIconCompact]}
          />
        </Pressable>
      ) : null}
      {showTransportButtons ? (
        <>
          <Pressable
            style={({ pressed }) => [styles.optionButton, pressed && styles.optionButtonPressed]}
            onPress={onSeekBack}
            accessibilityRole="button"
            accessibilityLabel="Seek backward 10 seconds"
          >
            <View style={styles.seekButtonVisual}>
             <MaterialIcons name="forward-10" color="white" size={44} style={styles.seekIcon} />
            </View>
          </Pressable>

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

          <Pressable
            style={({ pressed }) => [styles.optionButton, pressed && styles.optionButtonPressed]}
            onPress={onSeekForward}
            accessibilityRole="button"
            accessibilityLabel="Seek forward 10 seconds"
          >
            <View style={styles.seekButtonVisual}>
             <MaterialIcons name="replay-10" color="white" size={44} style={styles.seekIcon} />
            </View>
          </Pressable>
        </>
      ) : null}

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
