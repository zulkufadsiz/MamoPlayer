import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const SPEED_OPTIONS = [0.5, 1, 1.25, 1.5, 2] as const;

export interface SettingsOverlayProps {
  showPlaybackSpeed: boolean;
  showMute: boolean;
  playbackRate: number;
  muted: boolean;
  onSelectPlaybackRate: (rate: number) => void;
  onToggleMuted: () => void;
  onClose: () => void;
}

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({
  showPlaybackSpeed,
  showMute,
  playbackRate,
  muted,
  onSelectPlaybackRate,
  onToggleMuted,
  onClose,
}) => {
  return (
    <View style={styles.overlayContainer} testID="settings-overlay">
      <Pressable
        testID="settings-overlay-backdrop"
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close settings"
      />
      <View style={styles.panel}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Settings</Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ pressed }) => [styles.closeButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>

        {showPlaybackSpeed ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Playback Speed</Text>
            <View style={styles.speedRow}>
              {SPEED_OPTIONS.map(rate => {
                const selected = playbackRate === rate;
                return (
                  <Pressable
                    key={rate}
                    style={({ pressed }) => [
                      styles.speedButton,
                      selected && styles.speedButtonSelected,
                      pressed && styles.buttonPressed,
                    ]}
                    onPress={() => onSelectPlaybackRate(rate)}
                    accessibilityRole="button"
                    accessibilityLabel={`${rate}x`}
                    accessibilityState={{ selected }}
                  >
                    <Text style={[styles.speedText, selected && styles.speedTextSelected]}>{rate}x</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {showMute ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mute</Text>
            <Pressable
              onPress={onToggleMuted}
              style={({ pressed }) => [styles.toggleButton, pressed && styles.buttonPressed]}
              accessibilityRole="checkbox"
              accessibilityLabel="Muted"
              accessibilityState={{ checked: muted }}
            >
              <Text style={styles.toggleText}>{muted ? 'Muted' : 'Unmuted'}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  panel: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#F3F4F6',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  closeButton: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  closeButtonText: {
    color: '#F3F4F6',
    fontSize: 12,
    lineHeight: 16,
  },
  section: {
    marginTop: 10,
  },
  sectionTitle: {
    color: '#F3F4F6',
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
  },
  speedRow: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speedButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(243, 244, 246, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  speedButtonSelected: {
    borderColor: '#F3F4F6',
    backgroundColor: 'rgba(243, 244, 246, 0.2)',
  },
  speedText: {
    color: '#F3F4F6',
    fontSize: 12,
    lineHeight: 16,
  },
  speedTextSelected: {
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(243, 244, 246, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  toggleText: {
    color: '#F3F4F6',
    fontSize: 12,
    lineHeight: 16,
  },
  buttonPressed: {
    opacity: 0.75,
  },
});
