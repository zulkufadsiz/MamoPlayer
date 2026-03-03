import MaterialIcons from '@react-native-vector-icons/material-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const SPEED_OPTIONS = [0.5, 1, 1.25, 1.5, 2] as const;

const getSpeedLabel = (rate: number): string => {
  if (rate === 1) {
    return 'Normal';
  }

  return `${rate}x`;
};

export interface SettingsOverlayProps {
  showPlaybackSpeed: boolean;
  showMute: boolean;
  playbackRate: number;
  muted: boolean;
  isFullscreen?: boolean;
  onSelectPlaybackRate: (rate: number) => void;
  onToggleMuted: () => void;
  onClose: () => void;
}

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({
  showPlaybackSpeed,
  showMute,
  playbackRate,
  muted,
  isFullscreen = false,
  onSelectPlaybackRate,
  onToggleMuted,
  onClose,
}) => {
  const [activeMenu, setActiveMenu] = React.useState<'root' | 'playback-speed' | 'mute'>('root');

  const menuTitle = React.useMemo(() => {
    if (activeMenu === 'playback-speed') {
      return 'Playback speed';
    }

    if (activeMenu === 'mute') {
      return 'Mute';
    }

    return 'Settings';
  }, [activeMenu]);

  const handleSelectMuted = React.useCallback((nextMuted: boolean) => {
    if (nextMuted !== muted) {
      onToggleMuted();
      return;
    }

    onToggleMuted();
  }, [muted, onToggleMuted]);

  const goToRoot = React.useCallback(() => {
    setActiveMenu('root');
  }, []);

  const goToPlaybackSpeed = React.useCallback(() => {
    setActiveMenu('playback-speed');
  }, []);

  const goToMute = React.useCallback(() => {
    setActiveMenu('mute');
  }, []);

  return (
    <View
      style={[styles.overlayContainer, isFullscreen && styles.overlayContainerFullscreen]}
      testID="settings-overlay"
    >
      <Pressable
        testID="settings-overlay-backdrop"
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close settings"
      />
      <View style={[styles.panel, isFullscreen && styles.panelFullscreen]}>
        <View style={styles.headerRow}>
          {activeMenu !== 'root' ? (
            <Pressable
              onPress={goToRoot}
              accessibilityRole="button"
              accessibilityLabel="Back to settings menu"
              style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
              testID="settings-menu-back"
            >
              <MaterialIcons name="chevron-left" color="#E5E7EB" size={28} />
            </Pressable>
          ) : (
            <View style={styles.iconButtonPlaceholder} />
          )}

          <Text style={styles.title}>{menuTitle}</Text>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
          >
            <MaterialIcons name="close" color="#E5E7EB" size={20} />
          </Pressable>
        </View>

        {activeMenu === 'root' ? (
          <ScrollView
            style={styles.menuList}
            contentContainerStyle={styles.menuListContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {showPlaybackSpeed ? (
              <Pressable
                onPress={goToPlaybackSpeed}
                style={({ pressed }) => [styles.menuItem, pressed && styles.buttonPressed]}
                accessibilityRole="button"
                accessibilityLabel="Open playback speed settings"
                testID="settings-menu-playback-speed"
              >
                <Text style={styles.menuItemTitle}>Playback Speed</Text>
                <View style={styles.menuItemRight}>
                  <Text style={styles.menuItemValue}>{getSpeedLabel(playbackRate)}</Text>
                  <MaterialIcons name="chevron-right" color="#9CA3AF" size={20} />
                </View>
              </Pressable>
            ) : null}

            {showMute ? (
              <Pressable
                onPress={goToMute}
                style={({ pressed }) => [styles.menuItem, pressed && styles.buttonPressed]}
                accessibilityRole="button"
                accessibilityLabel="Open mute settings"
                testID="settings-menu-mute"
              >
                <Text style={styles.menuItemTitle}>Mute</Text>
                <View style={styles.menuItemRight}>
                  <Text style={styles.menuItemValue}>{muted ? 'Muted' : 'Unmuted'}</Text>
                  <MaterialIcons name="chevron-right" color="#9CA3AF" size={20} />
                </View>
              </Pressable>
            ) : null}
          </ScrollView>
        ) : null}

        {activeMenu === 'playback-speed' ? (
          <ScrollView
            style={styles.menuList}
            contentContainerStyle={styles.menuListContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {SPEED_OPTIONS.map(rate => {
              const selected = playbackRate === rate;
              return (
                <Pressable
                  key={rate}
                  onPress={() => onSelectPlaybackRate(rate)}
                  style={({ pressed }) => [
                    styles.menuItem,
                    selected && styles.menuItemSelected,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${rate}x`}
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.menuItemTitle, selected && styles.menuItemTitleSelected]}>
                    {getSpeedLabel(rate)}
                  </Text>
                  {selected ? (
                    <MaterialIcons name="check" color="#F3F4F6" size={24} />
                  ) : (
                    <View style={styles.checkPlaceholder} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {activeMenu === 'mute' ? (
          <ScrollView
            style={styles.menuList}
            contentContainerStyle={styles.menuListContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Pressable
              onPress={() => handleSelectMuted(false)}
              style={({ pressed }) => [
                styles.menuItem,
                !muted && styles.menuItemSelected,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Unmuted"
              accessibilityState={{ selected: !muted }}
            >
              <Text style={[styles.menuItemTitle, !muted && styles.menuItemTitleSelected]}>Unmuted</Text>
              {!muted ? (
                <MaterialIcons name="check" color="#F3F4F6" size={24} />
              ) : (
                <View style={styles.checkPlaceholder} />
              )}
            </Pressable>

            <Pressable
              onPress={() => handleSelectMuted(true)}
              style={({ pressed }) => [
                styles.menuItem,
                muted && styles.menuItemSelected,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Muted"
              accessibilityState={{ selected: muted }}
            >
              <Text style={[styles.menuItemTitle, muted && styles.menuItemTitleSelected]}>Muted</Text>
              {muted ? (
                <MaterialIcons name="check" color="#F3F4F6" size={24} />
              ) : (
                <View style={styles.checkPlaceholder} />
              )}
            </Pressable>
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
    zIndex: 100,
    elevation: 100,
  },
  overlayContainerFullscreen: {
    alignItems: 'center',
    paddingRight: 0,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panel: {
    width: 320,
    maxWidth: '84%',
    maxHeight: '78%',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: 'rgba(17, 24, 39, 0.98)',
    zIndex: 101,
    elevation: 101,
  },
  panelFullscreen: {
    width: '44%',
    maxWidth: 460,
    minWidth: 360,
    maxHeight: '72%',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.35)',
    paddingBottom: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    color: '#E5E7EB',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPlaceholder: {
    width: 34,
    height: 34,
  },
  menuList: {
    marginTop: 4,
  },
  menuListContent: {
    paddingBottom: 4,
  },
  menuItem: {
    paddingHorizontal: 0,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(148, 163, 184, 0.3)',
  },
  menuItemSelected: {},
  menuItemTitle: {
    color: '#E5E7EB',
    fontSize: 14,
    lineHeight: 20,
  },
  menuItemTitleSelected: {
    fontWeight: '600',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuItemValue: {
    color: '#9CA3AF',
    fontSize: 14,
    lineHeight: 20,
  },
  checkPlaceholder: {
    width: 24,
    height: 24,
  },
  buttonPressed: {
    opacity: 0.75,
  },
});
