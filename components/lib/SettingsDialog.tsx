import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SettingsDialogProps {
  visible: boolean;
  onClose: () => void;
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
  quality: string;
  onQualityChange: (quality: string) => void;
  autoPlay: boolean;
  onAutoPlayChange: (value: boolean) => void;
  showSubtitles: boolean;
  onShowSubtitlesChange: (value: boolean) => void;
}

const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const videoQualities = ['Auto', '1080p', '720p', '480p', '360p'];

export default function SettingsDialog({
  visible,
  onClose,
  playbackSpeed,
  onPlaybackSpeedChange,
  quality,
  onQualityChange,
  autoPlay,
  onAutoPlayChange,
  showSubtitles,
  onShowSubtitlesChange,
}: SettingsDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.dialogContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Playback Speed */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Playback Speed</Text>
              <View style={styles.optionsGrid}>
                {playbackSpeeds.map((speed) => (
                  <TouchableOpacity
                    key={speed}
                    style={[
                      styles.optionButton,
                      playbackSpeed === speed && styles.optionButtonActive,
                    ]}
                    onPress={() => onPlaybackSpeedChange(speed)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        playbackSpeed === speed && styles.optionTextActive,
                      ]}
                    >
                      {speed}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Video Quality */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Video Quality</Text>
              <View style={styles.optionsList}>
                {videoQualities.map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[
                      styles.listItem,
                      quality === q && styles.listItemActive,
                    ]}
                    onPress={() => onQualityChange(q)}
                  >
                    <Text
                      style={[
                        styles.listItemText,
                        quality === q && styles.listItemTextActive,
                      ]}
                    >
                      {q}
                    </Text>
                    {quality === q && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Toggle Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preferences</Text>
              
              <View style={styles.toggleItem}>
                <Text style={styles.toggleLabel}>AutoPlay</Text>
                <Switch
                  value={autoPlay}
                  onValueChange={onAutoPlayChange}
                  trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.toggleItem}>
                <Text style={styles.toggleLabel}>Show Subtitles</Text>
                <Switch
                  value={showSubtitles}
                  onValueChange={onShowSubtitlesChange}
                  trackColor={{ false: '#D1D1D6', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '85%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    backgroundColor: '#F9F9F9',
    minWidth: 60,
    alignItems: 'center',
  },
  optionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  optionsList: {
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  listItemActive: {
    backgroundColor: '#E3F2FD',
  },
  listItemText: {
    fontSize: 15,
    color: '#333',
  },
  listItemTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  toggleLabel: {
    fontSize: 15,
    color: '#000',
  },
});
