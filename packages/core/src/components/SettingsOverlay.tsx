import MaterialIcons from '@react-native-vector-icons/material-icons';
import React from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SettingsOverlayExtraMenuItem } from '../types/settings';

const SPEED_OPTIONS = [0.5, 1, 1.25, 1.5, 2] as const;
const ROOT_MENU_KEY = 'root';
const PLAYBACK_SPEED_MENU_KEY = 'playback-speed';
const MUTE_MENU_KEY = 'mute';
const EXTRA_MENU_PREFIX = 'extra:';

const getSpeedLabel = (rate: number): string => {
  if (rate === 1) {
    return 'Normal';
  }

  return `${rate}x`;
};

export interface SettingsOverlayProps {
  showPlaybackSpeed: boolean;
  showMute: boolean;
  extraItems?: React.ReactNode;
  extraMenuItems?: SettingsOverlayExtraMenuItem[];
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
  extraItems,
  extraMenuItems,
  playbackRate,
  muted,
  isFullscreen = false,
  onSelectPlaybackRate,
  onToggleMuted,
  onClose,
}) => {
  const [activeMenu, setActiveMenu] = React.useState<string>(ROOT_MENU_KEY);
  const entrance = React.useRef(new Animated.Value(0)).current;
  const isClosingRef = React.useRef(false);
  const resolvedExtraMenuItems = extraMenuItems ?? [];

  const activeExtraMenuItem = React.useMemo(
    () =>
      resolvedExtraMenuItems.find(
        (extraMenuItem) => activeMenu === `${EXTRA_MENU_PREFIX}${extraMenuItem.key}`,
      ),
    [activeMenu, resolvedExtraMenuItems],
  );

  const animateTo = React.useCallback((toValue: number, onDone?: () => void) => {
    Animated.timing(entrance, {
      toValue,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      onDone?.();
    });
  }, [entrance]);

  React.useEffect(() => {
    animateTo(1);
  }, [animateTo]);

  const menuTitle = React.useMemo(() => {
    if (activeMenu === PLAYBACK_SPEED_MENU_KEY) {
      return 'Playback speed';
    }

    if (activeMenu === MUTE_MENU_KEY) {
      return 'Mute';
    }

    if (activeExtraMenuItem) {
      return activeExtraMenuItem.title;
    }

    return 'Settings';
  }, [activeExtraMenuItem, activeMenu]);

  const handleSelectMuted = React.useCallback((nextMuted: boolean) => {
    if (nextMuted !== muted) {
      onToggleMuted();
      return;
    }

    onToggleMuted();
  }, [muted, onToggleMuted]);

  const goToRoot = React.useCallback(() => {
    setActiveMenu(ROOT_MENU_KEY);
  }, []);

  const goToPlaybackSpeed = React.useCallback(() => {
    setActiveMenu(PLAYBACK_SPEED_MENU_KEY);
  }, []);

  const goToMute = React.useCallback(() => {
    setActiveMenu(MUTE_MENU_KEY);
  }, []);

  const goToExtraMenu = React.useCallback((menuKey: string) => {
    setActiveMenu(`${EXTRA_MENU_PREFIX}${menuKey}`);
  }, []);

  const requestClose = React.useCallback(() => {
    if (isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    animateTo(0, onClose);
  }, [animateTo, onClose]);

  const panelAnimatedStyle = React.useMemo(
    () => ({
      opacity: entrance,
      transform: [
        {
          translateY: entrance.interpolate({
            inputRange: [0, 1],
            outputRange: [48, 0],
          }),
        },
      ],
    }),
    [entrance],
  );

  return (
    <View
      style={[styles.overlayContainer, isFullscreen && styles.overlayContainerFullscreen]}
      testID="settings-overlay"
    >
      <Pressable
        testID="settings-overlay-backdrop"
        style={styles.backdrop}
        onPress={requestClose}
        accessibilityRole="button"
        accessibilityLabel="Close settings"
      />
      <Animated.View style={[styles.panel, isFullscreen && styles.panelFullscreen, panelAnimatedStyle]}>
        <View style={styles.headerRow}>
          {activeMenu !== ROOT_MENU_KEY ? (
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
            onPress={requestClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
          >
            <MaterialIcons name="close" color="#E5E7EB" size={20} />
          </Pressable>
        </View>

        {activeMenu === ROOT_MENU_KEY ? (
          <ScrollView
            style={styles.menuList}
            contentContainerStyle={styles.menuListContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
            testID="settings-menu-root-scroll"
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

            {resolvedExtraMenuItems.map((extraMenuItem) => (
              <Pressable
                key={extraMenuItem.key}
                onPress={() => goToExtraMenu(extraMenuItem.key)}
                style={({ pressed }) => [styles.menuItem, pressed && styles.buttonPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Open ${extraMenuItem.title} settings`}
                testID={`settings-menu-extra-${extraMenuItem.key}`}
              >
                <Text style={styles.menuItemTitle}>{extraMenuItem.title}</Text>
                <View style={styles.menuItemRight}>
                  {extraMenuItem.value ? (
                    <Text style={styles.menuItemValue}>{extraMenuItem.value}</Text>
                  ) : null}
                  <MaterialIcons name="chevron-right" color="#9CA3AF" size={20} />
                </View>
              </Pressable>
            ))}

            {extraItems ? <View style={styles.extraItemsContainer}>{extraItems}</View> : null}
          </ScrollView>
        ) : null}

        {activeMenu === PLAYBACK_SPEED_MENU_KEY ? (
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

        {activeMenu === MUTE_MENU_KEY ? (
          <View style={styles.menuList}>
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
          </View>
        ) : null}

        {activeExtraMenuItem ? (
          <ScrollView
            style={styles.menuList}
            contentContainerStyle={styles.menuListContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {activeExtraMenuItem.options.map((option) => {
              const selected = activeExtraMenuItem.selectedOptionId === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => activeExtraMenuItem.onSelectOption(option.id)}
                  style={({ pressed }) => [
                    styles.menuItem,
                    selected && styles.menuItemSelected,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected }}
                  testID={`settings-extra-option-${activeExtraMenuItem.key}-${option.id}`}
                >
                  <Text style={[styles.menuItemTitle, selected && styles.menuItemTitleSelected]}>
                    {option.label}
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
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 100,
  },
  overlayContainerFullscreen: {
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panel: {
    alignSelf: 'flex-end',
    marginRight: 16,
    width: 320,
    maxWidth: '84%',
    maxHeight: '78%',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: 'rgba(17, 24, 39, 0.98)',
    zIndex: 101,
    elevation: 101,
  },
  panelFullscreen: {
    alignSelf: 'flex-end',
    marginRight: 18,
    marginTop: 28,
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
  extraItemsContainer: {
    marginTop: 8,
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
