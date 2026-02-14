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
  qualityOptions?: string[];
  autoPlay: boolean;
  onAutoPlayChange: (value: boolean) => void;
  showSubtitles: boolean;
  onShowSubtitlesChange: (value: boolean) => void;
  audioTracks?: Array<{
    id: string;
    label: string;
    language?: string;
  }>;
  selectedAudioTrackId?: string | null;
  onAudioTrackChange?: (trackId: string | null) => void;
  subtitleTracks?: Array<{
    id: string;
    label: string;
    language?: string;
  }>;
  selectedSubtitleTrackId?: string | null;
  onSubtitleTrackChange?: (trackId: string | null) => void;
}

const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const defaultVideoQualities = ['Auto', '1080p', '720p', '480p', '360p'];

type SettingsMenuItem =
  | 'playbackSpeed'
  | 'quality'
  | 'audio'
  | 'subtitles'
  | 'preferences'
  | null;

export default function SettingsDialog({
  visible,
  onClose,
  playbackSpeed,
  onPlaybackSpeedChange,
  quality,
  onQualityChange,
  qualityOptions,
  autoPlay,
  onAutoPlayChange,
  showSubtitles,
  onShowSubtitlesChange,
  audioTracks = [],
  selectedAudioTrackId = null,
  onAudioTrackChange,
  subtitleTracks = [],
  selectedSubtitleTrackId = null,
  onSubtitleTrackChange,
}: SettingsDialogProps) {
  const [activeMenu, setActiveMenu] = useState<SettingsMenuItem>(null);
  const hasAudioTracks = audioTracks.length > 0;
  const hasSubtitleTracks = subtitleTracks.length > 0;
  const selectedAudioLabel = audioTracks.find(
    (track) => track.id === selectedAudioTrackId
  )?.label;
  const selectedSubtitleLabel = subtitleTracks.find(
    (track) => track.id === selectedSubtitleTrackId
  )?.label;
  const audioValue = selectedAudioLabel || 'Auto';
  const subtitlesValue = showSubtitles
    ? selectedSubtitleLabel || 'On'
    : 'Off';
  const videoQualities =
    qualityOptions && qualityOptions.length > 0
      ? qualityOptions
      : defaultVideoQualities;

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
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close settings"
          hitSlop={10}
        >
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.menuList}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuItemPress('playbackSpeed')}
          accessibilityRole="button"
          accessibilityLabel="Playback speed"
          accessibilityHint="Opens playback speed options"
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
          accessibilityRole="button"
          accessibilityLabel="Video quality"
          accessibilityHint="Opens video quality options"
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

        {hasAudioTracks && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuItemPress('audio')}
            accessibilityRole="button"
            accessibilityLabel={`Audio track, current ${audioValue}`}
            accessibilityHint="Opens audio track options"
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="volume-medium-outline" size={24} color="#007AFF" />
              <Text style={styles.menuItemTitle}>Audio</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue}>{audioValue}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        )}

        {hasSubtitleTracks && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => handleMenuItemPress('subtitles')}
            accessibilityRole="button"
            accessibilityLabel={`Subtitles, current ${subtitlesValue}`}
            accessibilityHint="Opens subtitle options"
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="chatbox-ellipses-outline" size={24} color="#007AFF" />
              <Text style={styles.menuItemTitle}>Subtitles</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Text style={styles.menuItemValue}>{subtitlesValue}</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => handleMenuItemPress('preferences')}
          accessibilityRole="button"
          accessibilityLabel="Preferences"
          accessibilityHint="Opens autoplay and subtitle preferences"
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
        <TouchableOpacity
          onPress={handleBackToMenu}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to settings menu"
          hitSlop={10}
        >
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
              accessibilityRole="radio"
              accessibilityLabel={`Playback speed ${speed}x`}
              accessibilityState={{ selected: playbackSpeed === speed }}
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
        <TouchableOpacity
          onPress={handleBackToMenu}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to settings menu"
          hitSlop={10}
        >
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
              accessibilityRole="radio"
              accessibilityLabel={`Video quality ${q}`}
              accessibilityState={{ selected: quality === q }}
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
        <TouchableOpacity
          onPress={handleBackToMenu}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to settings menu"
          hitSlop={10}
        >
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
              accessibilityRole="switch"
              accessibilityLabel="AutoPlay"
              accessibilityHint="Automatically plays videos when loaded"
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
              accessibilityRole="switch"
              accessibilityLabel="Show subtitles"
              accessibilityHint="Displays subtitles when available"
            />
          </View>
        </View>
      </View>
    </>
  );

  const renderSubtitlesSheet = () => (
    <>
      <View style={styles.sheetHeader}>
        <TouchableOpacity
          onPress={handleBackToMenu}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to settings menu"
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.sheetTitle}>Subtitles</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.sheetContent}>
        <View style={styles.qualityList}>
          <TouchableOpacity
            style={[
              styles.qualityItem,
              !showSubtitles && styles.qualityItemActive,
            ]}
            onPress={() => {
              onShowSubtitlesChange(false);
              onSubtitleTrackChange?.(null);
              setTimeout(handleBackToMenu, 200);
            }}
            accessibilityRole="radio"
            accessibilityLabel="Subtitles off"
            accessibilityState={{ selected: !showSubtitles }}
          >
            <Text
              style={[
                styles.qualityText,
                !showSubtitles && styles.qualityTextActive,
              ]}
            >
              Off
            </Text>
            {!showSubtitles && (
              <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
            )}
          </TouchableOpacity>

          {subtitleTracks.map((track) => {
            const isActive = showSubtitles && selectedSubtitleTrackId === track.id;
            return (
              <TouchableOpacity
                key={track.id}
                style={[styles.qualityItem, isActive && styles.qualityItemActive]}
                onPress={() => {
                  onShowSubtitlesChange(true);
                  onSubtitleTrackChange?.(track.id);
                  setTimeout(handleBackToMenu, 200);
                }}
                accessibilityRole="radio"
                accessibilityLabel={`Subtitle track ${track.label}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[styles.qualityText, isActive && styles.qualityTextActive]}
                >
                  {track.label}
                </Text>
                {isActive && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </>
  );

  const renderAudioSheet = () => (
    <>
      <View style={styles.sheetHeader}>
        <TouchableOpacity
          onPress={handleBackToMenu}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to settings menu"
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.sheetTitle}>Audio</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.sheetContent}>
        <View style={styles.qualityList}>
          {audioTracks.map((track) => {
            const isActive = selectedAudioTrackId === track.id;
            return (
              <TouchableOpacity
                key={track.id}
                style={[styles.qualityItem, isActive && styles.qualityItemActive]}
                onPress={() => {
                  onAudioTrackChange?.(track.id);
                  setTimeout(handleBackToMenu, 200);
                }}
                accessibilityRole="radio"
                accessibilityLabel={`Audio track ${track.label}`}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[styles.qualityText, isActive && styles.qualityTextActive]}
                >
                  {track.label}
                </Text>
                {isActive && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      accessibilityViewIsModal
    >
      <Pressable
        style={styles.overlay}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Close settings"
        accessibilityHint="Closes the settings dialog"
      >
        <Pressable
          style={styles.container}
          onPress={(e) => e.stopPropagation()}
          accessible={false}
        >
          <View style={styles.dragHandle} />
          
          {!activeMenu && renderMainMenu()}
          {activeMenu === 'playbackSpeed' && renderPlaybackSpeedSheet()}
          {activeMenu === 'quality' && renderQualitySheet()}
          {activeMenu === 'audio' && renderAudioSheet()}
          {activeMenu === 'subtitles' && renderSubtitlesSheet()}
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
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
