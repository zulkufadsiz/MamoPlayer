import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import MamoPlayer from './MamoPlayer';
import {
  downloadVideoToLibrary,
  getOfflineLibraryItems,
  removeOfflineVideo,
  type OfflineLibraryItem,
} from './lib/offlineLibraryStore';
import { parseSrtOrVtt } from './lib/subtitleParser';

type DemoVideo = {
  id: string;
  title: string;
  description: string;
  author: string;
  uri: string;
};

const demoVideos: DemoVideo[] = [
  {
    id: 'big-buck-bunny',
    title: 'Big Buck Bunny',
    description: 'A fun animated short film about a giant rabbit and his adventures',
    author: 'blender_foundation',
    uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8',
  },
  {
    id: 'elephants-dream',
    title: 'Elephant Dream',
    description: 'A surreal open movie made by the Blender Foundation',
    author: 'blender_foundation',
    uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8',
  },
  {
    id: 'sintel',
    title: 'Sintel',
    description: 'A fantasy short film with cinematic animation and action',
    author: 'blender_foundation',
    uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8',
  },
];

export const MamoPlayerDemo: React.FC = () => {
  const [selectedVideoId, setSelectedVideoId] = useState(demoVideos[0].id);
  const [offlineItems, setOfflineItems] = useState<OfflineLibraryItem[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [preferOfflinePlayback, setPreferOfflinePlayback] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [resizeMode, setResizeMode] = useState<'contain' | 'cover' | 'stretch'>('contain');
  const [subtitleUrlInput, setSubtitleUrlInput] = useState('');
  const [subtitleTextInput, setSubtitleTextInput] = useState('');
  const [isImportingSubtitles, setIsImportingSubtitles] = useState(false);
  const [externalSubtitleTrack, setExternalSubtitleTrack] = useState<{
    id: string;
    label: string;
    language?: string;
    subtitles: { start: number; end: number; text: string }[];
  } | null>(null);

  // Sample subtitle tracks (adjust timing for your video)
  const subtitleTracks = [
    {
      id: 'en',
      label: 'English',
      language: 'en',
      subtitles: [
        { start: '00:00:00', end: '00:00:05', text: 'Opening scene' },
        { start: '00:00:05', end: '00:00:10', text: 'A quiet forest' },
        { start: '00:00:10', end: '00:00:15', text: 'A giant rabbit appears' },
        { start: '00:00:15', end: '00:00:20', text: 'The rodents arrive' },
        { start: '00:00:20', end: '00:00:25', text: 'They start mischief' },
        { start: '00:00:25', end: '00:00:30', text: 'Bunny looks surprised' },
        { start: '00:00:30', end: '00:00:35', text: 'A chase begins' },
        { start: '00:00:35', end: '00:00:40', text: 'Quick camera pan' },
        { start: '00:00:40', end: '00:00:45', text: 'The plot thickens' },
        { start: '00:00:45', end: '00:00:50', text: 'A playful moment' },
        { start: '00:00:50', end: '00:00:55', text: 'Almost the end' },
        { start: '00:00:55', end: '00:01:00', text: 'Thanks for watching' },
      ],
    },
    {
      id: 'tr',
      label: 'Türkçe',
      language: 'tr',
      subtitles: [
        { start: '00:00:00', end: '00:00:05', text: 'Açılış sahnesi' },
        { start: '00:00:05', end: '00:00:10', text: 'Sessiz bir orman' },
        { start: '00:00:10', end: '00:00:15', text: 'Kocaman bir tavşan belirir' },
        { start: '00:00:15', end: '00:00:20', text: 'Kemirgenler gelir' },
        { start: '00:00:20', end: '00:00:25', text: 'Yaramazlık başlar' },
        { start: '00:00:25', end: '00:00:30', text: 'Tavşan şaşırır' },
        { start: '00:00:30', end: '00:00:35', text: 'Bir kovalamaca başlar' },
        { start: '00:00:35', end: '00:00:40', text: 'Hızlı kamera hareketi' },
        { start: '00:00:40', end: '00:00:45', text: 'Olaylar karışır' },
        { start: '00:00:45', end: '00:00:50', text: 'Neşeli bir an' },
        { start: '00:00:50', end: '00:00:55', text: 'Neredeyse bitti' },
        { start: '00:00:55', end: '00:01:00', text: 'İzlediğiniz için teşekkürler' },
      ],
    },
    {
      id: 'es',
      label: 'Español',
      language: 'es',
      subtitles: [
        { start: '00:00:00', end: '00:00:05', text: 'Escena de apertura' },
        { start: '00:00:05', end: '00:00:10', text: 'Un bosque tranquilo' },
        { start: '00:00:10', end: '00:00:15', text: 'Aparece un conejo gigante' },
        { start: '00:00:15', end: '00:00:20', text: 'Llegan los roedores' },
        { start: '00:00:20', end: '00:00:25', text: 'Empieza la travesura' },
        { start: '00:00:25', end: '00:00:30', text: 'El conejo se sorprende' },
        { start: '00:00:30', end: '00:00:35', text: 'Comienza la persecución' },
        { start: '00:00:35', end: '00:00:40', text: 'Paneo de cámara rápido' },
        { start: '00:00:40', end: '00:00:45', text: 'La trama se complica' },
        { start: '00:00:45', end: '00:00:50', text: 'Un momento divertido' },
        { start: '00:00:50', end: '00:00:55', text: 'Casi al final' },
        { start: '00:00:55', end: '00:01:00', text: 'Gracias por mirar' },
      ],
    },
  ];

  const effectiveSubtitleTracks = useMemo(() => {
    if (!externalSubtitleTrack) return subtitleTracks;

    const withoutExternal = subtitleTracks.filter((track) => track.id !== externalSubtitleTrack.id);
    return [...withoutExternal, externalSubtitleTrack];
  }, [externalSubtitleTrack, subtitleTracks]);

  const selectedVideo = useMemo(() => {
    return demoVideos.find((video) => video.id === selectedVideoId) ?? demoVideos[0];
  }, [selectedVideoId]);

  const offlineItemsById = useMemo(() => {
    return offlineItems.reduce<Record<string, OfflineLibraryItem>>((accumulator, item) => {
      accumulator[item.id] = item;
      return accumulator;
    }, {});
  }, [offlineItems]);

  const selectedOfflineItem = offlineItemsById[selectedVideo.id] ?? null;
  const isSelectedVideoDownloaded = Boolean(selectedOfflineItem);
  const isPlayingOffline = preferOfflinePlayback && isSelectedVideoDownloaded;

  const playerSource = {
    uri: isPlayingOffline ? selectedOfflineItem.localUri : selectedVideo.uri,
  };

  const videoSourcesByLanguage = {
    en: playerSource,
    tr: playerSource,
    es: playerSource,
  };

  const streamQualitySources = {
    Auto: { uri: selectedVideo.uri },
    '1080p': {
      uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/gear4/prog_index.m3u8',
    },
    '720p': {
      uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/gear3/prog_index.m3u8',
    },
    '480p': {
      uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/gear2/prog_index.m3u8',
    },
    '360p': {
      uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/gear1/prog_index.m3u8',
    },
  };

  const streamQualitySourcesWithout1080 = {
    Auto: { uri: selectedVideo.uri },
    '720p': {
      uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/gear3/prog_index.m3u8',
    },
    '480p': {
      uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/gear2/prog_index.m3u8',
    },
    '360p': {
      uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/gear1/prog_index.m3u8',
    },
  };

  const streamQualitySourcesWithout480 = {
    Auto: { uri: selectedVideo.uri },
    '1080p': {
      uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/gear4/prog_index.m3u8',
    },
    '720p': {
      uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/gear3/prog_index.m3u8',
    },
    '360p': {
      uri: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/gear1/prog_index.m3u8',
    },
  };

  const offlineQualitySources = {
    Auto: playerSource,
    '1080p': playerSource,
    '720p': playerSource,
    '480p': playerSource,
    '360p': playerSource,
  };

  const qualitySourcesByLanguage = {
    en: isPlayingOffline ? offlineQualitySources : streamQualitySources,
    tr: isPlayingOffline ? offlineQualitySources : streamQualitySourcesWithout480,
    es: isPlayingOffline ? offlineQualitySources : streamQualitySourcesWithout1080,
  };

  const loadOfflineLibrary = useCallback(async () => {
    setIsLibraryLoading(true);
    try {
      const items = await getOfflineLibraryItems();
      setOfflineItems(items);
    } finally {
      setIsLibraryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOfflineLibrary();
  }, [loadOfflineLibrary]);

  const formatFileSize = (sizeBytes?: number) => {
    if (!sizeBytes || sizeBytes <= 0) return 'Unknown size';
    const mb = sizeBytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const handleSettingsPress = () => {
    console.log('Settings button pressed');
  };

  const handleLike = () => {
    console.log('Liked!');
  };

  const handleComment = () => {
    console.log('Comment button pressed');
  };

  const handleShare = () => {
    console.log('Share button pressed');
  };

  const applyImportedSubtitleContent = (content: string, sourceLabel: string) => {
    const parsedSubtitles = parseSrtOrVtt(content);

    if (parsedSubtitles.length === 0) {
      Alert.alert(
        'Import failed',
        'No valid cues were found. Please provide a valid SRT or VTT file.',
      );
      return;
    }

    setExternalSubtitleTrack({
      id: 'external',
      label: `External (${sourceLabel})`,
      language: 'external',
      subtitles: parsedSubtitles,
    });

    Alert.alert('Subtitles imported', `Loaded ${parsedSubtitles.length} subtitle cues.`);
  };

  const handleImportFromUrl = async () => {
    const url = subtitleUrlInput.trim();
    if (!url) {
      Alert.alert('URL required', 'Enter a subtitle URL (.srt or .vtt).');
      return;
    }

    setIsImportingSubtitles(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const content = await response.text();
      applyImportedSubtitleContent(content, 'URL');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to fetch subtitle URL.';
      Alert.alert('Import failed', message);
    } finally {
      setIsImportingSubtitles(false);
    }
  };

  const handleImportFromText = () => {
    const content = subtitleTextInput.trim();
    if (!content) {
      Alert.alert('Subtitle text required', 'Paste SRT or VTT content to import.');
      return;
    }

    applyImportedSubtitleContent(content, 'Text');
  };

  const handleClearImportedSubtitles = () => {
    setExternalSubtitleTrack(null);
  };

  const handleDownload = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not supported on web', 'Offline download is available on iOS and Android.');
      return;
    }

    if (downloadingId) return;

    try {
      setDownloadingId(selectedVideo.id);
      await downloadVideoToLibrary({
        id: selectedVideo.id,
        title: selectedVideo.title,
        remoteUrl: selectedVideo.uri,
      });
      setPreferOfflinePlayback(true);
      await loadOfflineLibrary();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Download failed.';
      Alert.alert('Download failed', message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRemoveDownload = async (videoId: string) => {
    try {
      await removeOfflineVideo(videoId);
      await loadOfflineLibrary();
    } catch {
      Alert.alert('Unable to remove', 'The downloaded file could not be removed.');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.screenContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Catalog</Text>
        <View style={styles.rowWrap}>
          {demoVideos.map((video) => {
            const isSelected = video.id === selectedVideo.id;
            return (
              <Pressable
                key={video.id}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setSelectedVideoId(video.id)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {video.title}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            onPress={handleDownload}
            disabled={Boolean(downloadingId) || isSelectedVideoDownloaded}
            style={[
              styles.actionButton,
              (Boolean(downloadingId) || isSelectedVideoDownloaded) && styles.actionButtonDisabled,
            ]}
          >
            {downloadingId === selectedVideo.id ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.actionButtonText}>
                {isSelectedVideoDownloaded ? 'Downloaded' : 'Download Offline'}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => setPreferOfflinePlayback((value) => !value)}
            style={styles.actionButtonSecondary}
          >
            <Text style={styles.actionButtonSecondaryText}>
              {preferOfflinePlayback ? 'Use Streaming Source' : 'Prefer Offline Source'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.statusText}>
          Source: {isPlayingOffline ? 'Local file' : 'Streaming URL'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Local Library</Text>
        {isLibraryLoading ? (
          <ActivityIndicator color="#111" />
        ) : offlineItems.length === 0 ? (
          <Text style={styles.emptyText}>No downloaded videos yet.</Text>
        ) : (
          <View style={styles.libraryList}>
            {offlineItems.map((item) => {
              const isSelected = selectedVideo.id === item.id;
              return (
                <View key={item.id} style={styles.libraryItem}>
                  <Pressable
                    onPress={() => {
                      setSelectedVideoId(item.id);
                      setPreferOfflinePlayback(true);
                    }}
                    style={[
                      styles.librarySelectButton,
                      isSelected && styles.librarySelectButtonSelected,
                    ]}
                  >
                    <Text style={styles.libraryTitle}>{item.title}</Text>
                    <Text style={styles.libraryMeta}>{formatFileSize(item.sizeBytes)}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void handleRemoveDownload(item.id)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>External Subtitles (SRT/VTT)</Text>

        <TextInput
          value={subtitleUrlInput}
          onChangeText={setSubtitleUrlInput}
          placeholder="https://example.com/subtitles.vtt"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.textInput}
        />

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => void handleImportFromUrl()}
            disabled={isImportingSubtitles}
            style={[styles.actionButton, isImportingSubtitles && styles.actionButtonDisabled]}
          >
            {isImportingSubtitles ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.actionButtonText}>Import from URL</Text>
            )}
          </Pressable>

          <Pressable onPress={handleClearImportedSubtitles} style={styles.actionButtonSecondary}>
            <Text style={styles.actionButtonSecondaryText}>Clear External</Text>
          </Pressable>
        </View>

        <TextInput
          value={subtitleTextInput}
          onChangeText={setSubtitleTextInput}
          placeholder="Paste SRT or VTT content here"
          multiline
          style={styles.textArea}
          textAlignVertical="top"
        />

        <Pressable onPress={handleImportFromText} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Import from Text</Text>
        </Pressable>

        <Text style={styles.statusText}>
          External track:{' '}
          {externalSubtitleTrack
            ? `${externalSubtitleTrack.label} (${externalSubtitleTrack.subtitles.length} cues)`
            : 'Not loaded'}
        </Text>
      </View>

      <View style={styles.playerContainer}>
        <MamoPlayer
          source={playerSource}
          videoSourcesByLanguage={videoSourcesByLanguage}
          qualitySourcesByLanguage={qualitySourcesByLanguage}
          autoPlay={autoPlay}
          resizeMode={resizeMode}
          startAt={0}
          style={styles.player}
          subtitleTracks={effectiveSubtitleTracks}
          defaultSubtitleTrackId={externalSubtitleTrack ? 'external' : 'en'}
          onSettingsPress={handleSettingsPress}
          playerType="simple"
          contentFit="contain"
          title={selectedVideo.title}
          description={selectedVideo.description}
          author={selectedVideo.author}
          likes={125300}
          comments={3450}
          shares={8920}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
        />
        {!isPlayingOffline && (
          <Text style={styles.statusText}>
            Demo note: Spanish (`es`) intentionally has no `1080p`, and Turkish (`tr`) has no `480p`
            quality option.
          </Text>
        )}
      </View>

      <View style={styles.playerOptionsContainer}>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Auto Play</Text>
          <Switch value={autoPlay} onValueChange={setAutoPlay} />
        </View>

        <Text style={styles.optionLabel}>Resize Mode</Text>
        <View style={styles.rowWrap}>
          {(['contain', 'cover', 'stretch'] as const).map((mode) => {
            const isSelected = resizeMode === mode;
            return (
              <Pressable
                key={mode}
                style={[styles.chip, isSelected && styles.chipSelected]}
                onPress={() => setResizeMode(mode)}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {mode === 'contain' ? 'Contain' : mode === 'cover' ? 'Cover' : 'Stretch'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F6F7F9',
  },
  screenContent: {
    paddingTop: 60,
    paddingBottom: 24,
    gap: 14,
  },
  section: {
    marginHorizontal: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
  },
  chipSelected: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  chipText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextSelected: {
    color: '#FFF',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  actionButtonSecondary: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  actionButtonSecondaryText: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 13,
  },
  statusText: {
    color: '#4B5563',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
  libraryList: {
    gap: 8,
  },
  libraryItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  librarySelectButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  librarySelectButtonSelected: {
    borderColor: '#111827',
  },
  libraryTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
  libraryMeta: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  removeButton: {
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    minHeight: 40,
    minWidth: 78,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  removeButtonText: {
    color: '#991B1B',
    fontWeight: '700',
    fontSize: 12,
  },
  playerContainer: {
    marginHorizontal: 14,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    height: 320,
  },
  player: {
    flex: 1,
  },
  playerOptionsContainer: {
    marginHorizontal: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#FFF',
    minHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#111827',
  },
});

export default MamoPlayerDemo;
