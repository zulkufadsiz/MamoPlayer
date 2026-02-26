import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type PlaybackOptionId =
  | 'seek-back'
  | 'seek-forward'
  | 'settings'
  | 'fullscreen'
  | 'pip';

export interface PlaybackOption {
  id: PlaybackOptionId;
  icon: React.ReactNode;
  label?: string;
}

export interface PlaybackOptionsProps {
  options: PlaybackOption[];
  onPressOption: (id: PlaybackOptionId) => void;
}

export const PlaybackOptions: React.FC<PlaybackOptionsProps> = ({ options, onPressOption }) => {
  return (
    <View style={styles.container}>
      {options.map(option => (
        <Pressable
          key={option.id}
          style={({ pressed }) => [styles.optionButton, pressed && styles.optionButtonPressed]}
          onPress={() => onPressOption(option.id)}
          accessibilityRole="button"
          accessibilityLabel={option.label ?? option.id}
        >
          <View style={styles.iconContainer}>{option.icon}</View>
          {option.label ? <Text style={styles.label}>{option.label}</Text> : null}
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-start',
    gap: 12,
  },
  optionButton: {
    minWidth: 52,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  optionButtonPressed: {
    opacity: 0.75,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 14,
    color: '#F3F4F6',
    textAlign: 'center',
  },
});
