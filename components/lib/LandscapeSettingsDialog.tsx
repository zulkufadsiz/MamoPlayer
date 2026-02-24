import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Ionicons = ({
  name,
  size = 20,
  color = '#fff',
}: {
  name: string;
  size?: number;
  color?: string;
}) => {
  const fallback = name.includes('close')
    ? '✕'
    : name.includes('check')
      ? '✓'
      : name.includes('chevron')
        ? '›'
        : '•';
  return <Text style={{ fontSize: size, color }}>{fallback}</Text>;
};

interface LandscapeSettingsDialogProps {
  visible: boolean;
  onClose: () => void;
  playbackSpeed: number;
  onPlaybackSpeedChange: (speed: number) => void;
  quality: string;
  onQualityChange: (quality: string) => void;
  qualityOptions?: string[];
  autoPlay: boolean;
  onAutoPlayChange: (enabled: boolean) => void;
  showSubtitles: boolean;
  onShowSubtitlesChange: (enabled: boolean) => void;
  subtitleFontSize?: number;
  onSubtitleFontSizeChange?: (size: number) => void;
  subtitleFontStyle?: 'normal' | 'bold' | 'thin' | 'italic';
  onSubtitleFontStyleChange?: (style: 'normal' | 'bold' | 'thin' | 'italic') => void;
  audioTracks?: {
    id: string;
    label: string;
    language?: string;
  }[];
  selectedAudioTrackId?: string | null;
  onAudioTrackChange?: (trackId: string | null) => void;
  subtitleTracks?: {
    id: string;
    label: string;
    language?: string;
  }[];
  selectedSubtitleTrackId?: string | null;
  onSubtitleTrackChange?: (trackId: string | null) => void;
}

export const LandscapeSettingsDialog: React.FC<LandscapeSettingsDialogProps> = ({
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
  subtitleFontSize = 18,
  onSubtitleFontSizeChange,
  subtitleFontStyle = 'normal',
  onSubtitleFontStyleChange,
  audioTracks = [],
  selectedAudioTrackId = null,
  onAudioTrackChange,
  subtitleTracks = [],
  selectedSubtitleTrackId = null,
  onSubtitleTrackChange,
}) => {
  type SectionKey =
    | 'playback'
    | 'quality'
    | 'audio'
    | 'subtitles'
    | 'subtitleStyle'
    | 'preferences';
  const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const subtitleFontSizes = [
    { label: 'Small', value: 14 },
    { label: 'Medium', value: 18 },
    { label: 'Large', value: 24 },
  ];
  const subtitleFontStyles: ('normal' | 'bold' | 'thin' | 'italic')[] = [
    'normal',
    'bold',
    'thin',
    'italic',
  ];
  const qualities =
    qualityOptions && qualityOptions.length > 0
      ? qualityOptions
      : ['Auto', '4K', '1080p', '720p', '480p', '360p'];
  const [openSection, setOpenSection] = React.useState<SectionKey | null>('playback');
  const hasAudioTracks = audioTracks.length > 0;
  const hasSubtitleTracks = subtitleTracks.length > 0;

  const toggleSection = (section: SectionKey) => {
    setOpenSection((current) => (current === section ? null : section));
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close settings"
        accessibilityHint="Closes the settings dialog"
      />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close settings"
            hitSlop={10}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Playback Speed Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('playback')}
              accessibilityRole="button"
              accessibilityLabel="Playback speed section"
              accessibilityHint="Expands or collapses playback speed options"
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="speedometer-outline" size={24} color="#fff" />
                <Text style={styles.sectionTitle}>Playback Speed</Text>
              </View>
              <Ionicons
                name={openSection === 'playback' ? 'chevron-down' : 'chevron-forward'}
                size={22}
                color="#fff"
              />
            </TouchableOpacity>
            {openSection === 'playback' && (
              <View style={styles.optionsContainer}>
                <View style={styles.optionsGrid}>
                  {playbackSpeeds.map((speed) => (
                    <TouchableOpacity
                      key={speed}
                      style={[
                        styles.speedOption,
                        playbackSpeed === speed && styles.speedOptionActive,
                      ]}
                      onPress={() => onPlaybackSpeedChange(speed)}
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
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Quality Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('quality')}
              accessibilityRole="button"
              accessibilityLabel="Video quality section"
              accessibilityHint="Expands or collapses quality options"
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="videocam-outline" size={24} color="#fff" />
                <Text style={styles.sectionTitle}>Video Quality</Text>
              </View>
              <Ionicons
                name={openSection === 'quality' ? 'chevron-down' : 'chevron-forward'}
                size={22}
                color="#fff"
              />
            </TouchableOpacity>
            {openSection === 'quality' && (
              <View style={styles.optionsContainer}>
                <View style={styles.optionsList}>
                  {qualities.map((q) => (
                    <TouchableOpacity
                      key={q}
                      style={[styles.qualityOption, quality === q && styles.qualityOptionActive]}
                      onPress={() => onQualityChange(q)}
                      accessibilityRole="radio"
                      accessibilityLabel={`Video quality ${q}`}
                      accessibilityState={{ selected: quality === q }}
                    >
                      <Text style={[styles.qualityText, quality === q && styles.qualityTextActive]}>
                        {q}
                      </Text>
                      {quality === q && <Ionicons name="checkmark" size={20} color="#E50914" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('preferences')}
              accessibilityRole="button"
              accessibilityLabel="Preferences section"
              accessibilityHint="Expands or collapses preference options"
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="options-outline" size={24} color="#fff" />
                <Text style={styles.sectionTitle}>Preferences</Text>
              </View>
              <Ionicons
                name={openSection === 'preferences' ? 'chevron-down' : 'chevron-forward'}
                size={22}
                color="#fff"
              />
            </TouchableOpacity>
            {openSection === 'preferences' && (
              <View style={styles.optionsContainer}>
                <View style={styles.preferencesList}>
                  <TouchableOpacity
                    style={styles.preferenceItem}
                    onPress={() => onAutoPlayChange(!autoPlay)}
                    accessibilityRole="switch"
                    accessibilityLabel="Auto Play"
                    accessibilityHint="Automatically plays next episode"
                    accessibilityState={{ checked: autoPlay }}
                  >
                    <View style={styles.preferenceInfo}>
                      <Text style={styles.preferenceTitle}>Auto Play</Text>
                      <Text style={styles.preferenceDescription}>
                        Automatically play next episode
                      </Text>
                    </View>
                    <View style={[styles.toggle, autoPlay && styles.toggleActive]}>
                      <View style={[styles.toggleThumb, autoPlay && styles.toggleThumbActive]} />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.preferenceItem}
                    onPress={() => onShowSubtitlesChange(!showSubtitles)}
                    accessibilityRole="switch"
                    accessibilityLabel="Subtitles"
                    accessibilityHint="Shows subtitles when available"
                    accessibilityState={{ checked: showSubtitles }}
                  >
                    <View style={styles.preferenceInfo}>
                      <Text style={styles.preferenceTitle}>Subtitles</Text>
                      <Text style={styles.preferenceDescription}>
                        Show subtitles when available
                      </Text>
                    </View>
                    <View style={[styles.toggle, showSubtitles && styles.toggleActive]}>
                      <View
                        style={[styles.toggleThumb, showSubtitles && styles.toggleThumbActive]}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Audio Section */}
          {hasAudioTracks && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('audio')}
                accessibilityRole="button"
                accessibilityLabel="Audio section"
                accessibilityHint="Expands or collapses audio track options"
              >
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="volume-medium-outline" size={24} color="#fff" />
                  <Text style={styles.sectionTitle}>Audio</Text>
                </View>
                <Ionicons
                  name={openSection === 'audio' ? 'chevron-down' : 'chevron-forward'}
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>
              {openSection === 'audio' && (
                <View style={styles.optionsContainer}>
                  <View style={styles.optionsList}>
                    {audioTracks.map((track) => {
                      const isActive = selectedAudioTrackId === track.id;
                      return (
                        <TouchableOpacity
                          key={track.id}
                          style={[styles.qualityOption, isActive && styles.qualityOptionActive]}
                          onPress={() => onAudioTrackChange?.(track.id)}
                          accessibilityRole="radio"
                          accessibilityLabel={`Audio track ${track.label}`}
                          accessibilityState={{ selected: isActive }}
                        >
                          <Text style={[styles.qualityText, isActive && styles.qualityTextActive]}>
                            {track.label}
                          </Text>
                          {isActive && <Ionicons name="checkmark" size={20} color="#E50914" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Subtitles Section */}
          {hasSubtitleTracks && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection('subtitles')}
                accessibilityRole="button"
                accessibilityLabel="Subtitles section"
                accessibilityHint="Expands or collapses subtitle options"
              >
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="chatbox-ellipses-outline" size={24} color="#fff" />
                  <Text style={styles.sectionTitle}>Subtitles</Text>
                </View>
                <Ionicons
                  name={openSection === 'subtitles' ? 'chevron-down' : 'chevron-forward'}
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>
              {openSection === 'subtitles' && (
                <View style={styles.optionsContainer}>
                  <View style={styles.optionsList}>
                    <TouchableOpacity
                      style={[styles.qualityOption, !showSubtitles && styles.qualityOptionActive]}
                      onPress={() => {
                        onShowSubtitlesChange(false);
                        onSubtitleTrackChange?.(null);
                      }}
                      accessibilityRole="radio"
                      accessibilityLabel="Subtitles off"
                      accessibilityState={{ selected: !showSubtitles }}
                    >
                      <Text
                        style={[styles.qualityText, !showSubtitles && styles.qualityTextActive]}
                      >
                        Off
                      </Text>
                      {!showSubtitles && <Ionicons name="checkmark" size={20} color="#E50914" />}
                    </TouchableOpacity>

                    {subtitleTracks.map((track) => {
                      const isActive = showSubtitles && selectedSubtitleTrackId === track.id;
                      return (
                        <TouchableOpacity
                          key={track.id}
                          style={[styles.qualityOption, isActive && styles.qualityOptionActive]}
                          onPress={() => {
                            onShowSubtitlesChange(true);
                            onSubtitleTrackChange?.(track.id);
                          }}
                          accessibilityRole="radio"
                          accessibilityLabel={`Subtitle track ${track.label}`}
                          accessibilityState={{ selected: isActive }}
                        >
                          <Text style={[styles.qualityText, isActive && styles.qualityTextActive]}>
                            {track.label}
                          </Text>
                          {isActive && <Ionicons name="checkmark" size={20} color="#E50914" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Subtitle Style Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection('subtitleStyle')}
              accessibilityRole="button"
              accessibilityLabel="Subtitle style section"
              accessibilityHint="Expands or collapses subtitle style options"
            >
              <View style={styles.sectionHeaderLeft}>
                <Ionicons name="color-palette-outline" size={24} color="#fff" />
                <Text style={styles.sectionTitle}>Subtitle Style</Text>
              </View>
              <Ionicons
                name={openSection === 'subtitleStyle' ? 'chevron-down' : 'chevron-forward'}
                size={22}
                color="#fff"
              />
            </TouchableOpacity>
            {openSection === 'subtitleStyle' && (
              <View style={styles.optionsContainer}>
                <Text style={styles.preferenceTitle}>Font Size</Text>
                <View style={styles.optionsGrid}>
                  {subtitleFontSizes.map((sizeOption) => {
                    const isActive = subtitleFontSize === sizeOption.value;
                    return (
                      <TouchableOpacity
                        key={sizeOption.label}
                        style={[styles.speedOption, isActive && styles.speedOptionActive]}
                        onPress={() => onSubtitleFontSizeChange?.(sizeOption.value)}
                        accessibilityRole="radio"
                        accessibilityLabel={`Subtitle size ${sizeOption.label}`}
                        accessibilityState={{ selected: isActive }}
                      >
                        <Text style={[styles.speedText, isActive && styles.speedTextActive]}>
                          {sizeOption.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={{ height: 12 }} />
                <Text style={styles.preferenceTitle}>Text Style</Text>
                <View style={styles.optionsList}>
                  {subtitleFontStyles.map((style) => {
                    const isActive = subtitleFontStyle === style;
                    return (
                      <TouchableOpacity
                        key={style}
                        style={[styles.qualityOption, isActive && styles.qualityOptionActive]}
                        onPress={() => onSubtitleFontStyleChange?.(style)}
                        accessibilityRole="radio"
                        accessibilityLabel={`Subtitle text style ${style}`}
                        accessibilityState={{ selected: isActive }}
                      >
                        <Text
                          style={[
                            styles.qualityText,
                            {
                              fontWeight:
                                style === 'bold' ? '700' : style === 'thin' ? '300' : '400',
                              fontStyle: style === 'italic' ? 'italic' : 'normal',
                            },
                          ]}
                        >
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </Text>
                        {isActive && <Ionicons name="checkmark" size={20} color="#E50914" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    zIndex: 9999,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionsContainer: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  speedOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 70,
    alignItems: 'center',
  },
  speedOptionActive: {
    backgroundColor: '#E50914',
    borderColor: '#E50914',
  },
  speedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#aaa',
  },
  speedTextActive: {
    color: '#fff',
  },
  optionsList: {
    gap: 8,
  },
  qualityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  qualityOptionActive: {
    borderColor: '#E50914',
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
  },
  qualityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#aaa',
  },
  qualityTextActive: {
    color: '#fff',
  },
  preferencesList: {
    gap: 12,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: 16,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: 13,
    color: '#888',
  },
  toggle: {
    width: 52,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#444',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#E50914',
  },
  toggleThumb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
});

export default LandscapeSettingsDialog;
