import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
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

type SettingsMenuItem = 'playbackSpeed' | 'quality' | 'preferences' | null;

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
  const [activeMenu, setActiveMenu] = useState<SettingsMenuItem>(null);

  const handleClose = () => {
    setActiveMenu(null);
    onClose();
  };

  const handleMenuItemPress = (menu: SettingsMenuItem) => {
    setActiveMenu(menu);
  };

  const handleBackToMenu = () => {
    setActiveMenu(null);
  };

  const renderMainMenu = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.menuList}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuItemPress('playbackSpeed')}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="speedometer-outline" size={24} color="#007AFF" />
            <Text style={styles.menuItemTitle}>Playback Speed</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text style={styles.menuItemValue}>{playbackSpeed}x</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuItemPress('quality')}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="videocam-outline" size={24} color="#007AFF" />
            <Text style={styles.menuItemTitle}>Video Quality</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text style={styles.menuItemValue}>{quality}</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuItemPress('preferences')}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="options-outline" size={24} color="#007AFF" />
            <Text style={styles.menuItemTitle}>Preferences</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderPlaybackSpeedSheet = () => (
    <>
      <View style={styles.sheetHeader}>
        <TouchableOpacity onPress={handleBackToMenu} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.sheetTitle}>Playback Speed</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.sheetContent}>
        <View style={styles.optionsGrid}>
          {playbackSpeeds.map((speed) => (
            <TouchableOpacity
              key={speed}
              style={[
                styles.speedButton,
                playbackSpeed === speed && styles.speedButtonActive,
              ]}
              onPress={() => {
                onPlaybackSpeedChange(speed);
                setTimeout(handleBackToMenu, 300);
              }}
            >
              <Text
                style={[
                  styles.speedText,
                  playbackSpeed === speed && styles.speedTextActive,
                ]}
              >
                {speed}x
              </Text>
              {playbackSpeed === speed && (
                <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </>
  );

  const renderQualitySheet = () => (
    <>
      <View style={styles.sheetHeader}>
        <TouchableOpacity onPress={handleBackToMenu} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.sheetTitle}>Video Quality</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.sheetContent}>
        <View style={styles.qualityList}>
          {videoQualities.map((q) => (
            <TouchableOpacity
              key={q}
              style={[
                styles.qualityItem,
                quality === q && styles.qualityItemActive,
              ]}
              onPress={() => {
                onQualityChange(q);
                setTimeout(handleBackToMenu, 300);
              }}
            >
              <Text
                style={[
                  styles.qualityText,
                  quality === q && styles.qualityTextActive,
                ]}
              >
                {q}
              </Text>
              {quality === q && (
                <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </>
  );

  const renderPreferencesSheet = () => (
    <>
      <View style={styles.sheetHeader}>
        <TouchableOpacity onPress={handleBackToMenu} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.sheetTitle}>Preferences</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.sheetContent}>
        <View style={styles.preferencesList}>
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>AutoPlay</Text>
              <Text style={styles.preferenceDescription}>
                Automatically play videos when loaded
              </Text>
            </View>
            <Switch
              value={autoPlay}
              onValueChange={onAutoPlayChange}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>Show Subtitles</Text>
              <Text style={styles.preferenceDescription}>
                Display subtitles when available
              </Text>
            </View>
            <Switch
              value={showSubtitles}
              onValueChange={onShowSubtitlesChange}
              trackColor={{ false: '#D1D1D6', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={styles.container}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.dragHandle} />
          
          {!activeMenu && renderMainMenu()}
          {activeMenu === 'playbackSpeed' && renderPlaybackSpeedSheet()}
          {activeMenu === 'quality' && renderQualitySheet()}
          {activeMenu === 'preferences' && renderPreferencesSheet()}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  menuList: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItemValue: {
    fontSize: 14,
    color: '#999',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  sheetContent: {
    padding: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  speedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    minWidth: 90,
  },
  speedButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  speedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  speedTextActive: {
    color: '#007AFF',
  },
  qualityList: {
    gap: 12,
  },
  qualityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  qualityItemActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  qualityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  qualityTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  preferencesList: {
    gap: 20,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 13,
    color: '#999',
  },
});
