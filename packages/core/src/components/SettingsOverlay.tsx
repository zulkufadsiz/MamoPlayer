import MaterialIcons from '@react-native-vector-icons/material-icons';
import React from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SettingsSection } from '../types/settings';

export interface SettingsOverlayProps {
  sections: SettingsSection[];
  isFullscreen?: boolean;
  onClose: () => void;
  /** Optional content rendered at the bottom of the settings panel, below all sections. */
  extraContent?: React.ReactNode;
}

export const SettingsOverlay: React.FC<SettingsOverlayProps> = ({
  sections,
  isFullscreen = false,
  onClose,
  extraContent,
}) => {
  const entrance = React.useRef(new Animated.Value(0)).current;
  const isClosingRef = React.useRef(false);

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
          <View style={styles.iconButtonPlaceholder} />
          <Text style={styles.title}>Settings</Text>
          <Pressable
            onPress={requestClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
          >
            <MaterialIcons name="close" color="#E5E7EB" size={20} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.menuList}
          contentContainerStyle={styles.menuListContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          testID="settings-menu-root-scroll"
        >
          {sections.map((section, index) => (
            <View key={section.id} testID={`settings-menu-${section.id}`} style={index > 0 ? styles.sectionSeparator : undefined}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.items.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={item.onPress}
                  style={({ pressed }) => [
                    styles.menuItem,
                    item.selected && styles.menuItemSelected,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected: item.selected }}
                  testID={`settings-item-${section.id}-${item.id}`}
                >
                  <Text style={[styles.menuItemTitle, item.selected && styles.menuItemTitleSelected]}>
                    {item.label}
                  </Text>
                  {item.selected ? (
                    <MaterialIcons name="check" color="#F3F4F6" size={24} />
                  ) : (
                    <View style={styles.checkPlaceholder} />
                  )}
                </Pressable>
              ))}
            </View>
          ))}
          {extraContent}
        </ScrollView>
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
  sectionSeparator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.35)',
  },
  sectionTitle: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
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
  checkPlaceholder: {
    width: 24,
    height: 24,
  },
  buttonPressed: {
    opacity: 0.75,
  },
});
