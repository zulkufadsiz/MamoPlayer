import {
    MamoPlayer,
    PlaybackOptions,
    type PlaybackEvent,
} from '@mamoplayer/core';
import {
    useRef,
    useState,
    type ComponentProps,
    type ComponentType,
    type RefAttributes,
} from 'react';
import { Button, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { VideoRef } from 'react-native-video';

const VIDEO_URL = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const HLS_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const SUBTITLE_URL = 'https://bitdash-a.akamaihd.net/content/sintel/subtitles/subtitles_en.vtt';
const SUBTITLE_SUPPORTED_PLATFORMS = new Set(['ios', 'android', 'tvos', 'visionos']);
type CorePlayerWithRefProps = ComponentProps<typeof MamoPlayer> & RefAttributes<VideoRef>;
const CorePlayerWithRef = MamoPlayer as ComponentType<CorePlayerWithRefProps>;

const CoreDemoScreen = ({ onBack }: { onBack?: () => void } = {}) => {
  const [source, setSource] = useState<CorePlayerWithRefProps['source']>({ uri: VIDEO_URL });
  const [paused, setPaused] = useState(false);
  const [position, setPosition] = useState(0);
  const [latestPlaybackEvent, setLatestPlaybackEvent] = useState<PlaybackEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [subtitlesActive, setSubtitlesActive] = useState(false);
  const videoRef = useRef<VideoRef | null>(null);
  const supportsSubtitles = SUBTITLE_SUPPORTED_PLATFORMS.has(Platform.OS);

  const handlePlaybackEvent = (event: PlaybackEvent) => {
    console.log('PlaybackEvent:', event);
    setLatestPlaybackEvent(event);

    if (event.type === 'error') {
      setErrorMessage(event.error?.message ?? 'Unknown playback error');
      return;
    }

    if (event.type === 'time_update' || event.type === 'ready') {
      setPosition(event.position);
      setDuration(event.duration ?? 0);
    }
  };

  const handlePlayMp4 = () => {
    setSource({ uri: VIDEO_URL });
    setPaused(false);
    setPosition(0);
    setDuration(0);
    setSubtitlesActive(false);
  };

  const handlePlayHls = () => {
    setSource({ uri: HLS_URL });
    setPaused(false);
    setPosition(0);
    setDuration(0);
    setSubtitlesActive(false);
  };

  const handlePlayWithSubtitles = () => {
    if (!supportsSubtitles) {
      setSource({ uri: VIDEO_URL });
      setPaused(false);
      setPosition(0);
      setDuration(0);
      setSubtitlesActive(false);
      return;
    }

    setSource({
      uri: VIDEO_URL,
      textTracks: [
        {
          title: 'English',
          uri: SUBTITLE_URL,
          language: 'en',
          type: 'text/vtt',
        },
      ],
      selectedTextTrack: { type: 'title', value: 'English' },
    } as CorePlayerWithRefProps['source']);
    setPaused(false);
    setPosition(0);
    setDuration(0);
    setSubtitlesActive(true);
  };

  const handleSeekForward = () => {
    videoRef.current?.seek(position + 10);
  };

  const handleSeekBackward = () => {
    videoRef.current?.seek(position - 10);
  };

  const handleToggleFullscreen = () => {
    videoRef.current?.presentFullscreenPlayer?.();
  };

  return (
    <SafeAreaView style={styles.container}>
      {onBack ? (
        <Pressable style={styles.backButton} onPress={onBack} testID="back-to-demos">
          <Text style={styles.backText}>← Demos</Text>
        </Pressable>
      ) : null}
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>MamoPlayer Core Demo</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Source Selection</Text>
          <View style={styles.buttonsRow}>
            <View style={styles.buttonContainer}>
              <Button title="Play MP4" onPress={handlePlayMp4} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Play HLS" onPress={handlePlayHls} />
            </View>
          </View>
          <Button title="Play with Subtitles" onPress={handlePlayWithSubtitles} />
          {supportsSubtitles && subtitlesActive ? (
            <Text style={styles.noteText}>Subtitles are active (English).</Text>
          ) : null}
          {!supportsSubtitles ? (
            <Text style={styles.noteText}>Subtitles are not supported on this platform.</Text>
          ) : null}
          <Button
            title="Play Invalid Source"
            onPress={() => {
              setSource({ uri: 'https://invalid.video' });
              setSubtitlesActive(false);
            }}
          />
        </View>

        <View style={styles.playerArea}>
          <CorePlayerWithRef
            ref={videoRef}
            source={source}
            paused={paused}
            autoPlay
            controls={{ autoHide: true, autoHideDelay: 3000 }}
            gestures={{ doubleTapSeek: true }}
            settingsOverlay={{ enabled: true, showPlaybackSpeed: true, showMute: true }}
            debug={{ enabled: true }}
            onPlaybackEvent={handlePlaybackEvent}
            style={styles.player}
          />
        </View>

        <View style={styles.section} testID="ott-ux-hints">
          <Text style={styles.sectionTitle}>OTT UX Features</Text>
          <Text style={styles.hintText}>Tap the video to show or hide controls.</Text>
          <Text style={styles.hintText}>Double-tap the left side to seek back 10s.</Text>
          <Text style={styles.hintText}>Double-tap the right side to seek forward 10s.</Text>
          <Text style={styles.hintText}>Controls auto-hide after 3s of inactivity during playback.</Text>
          <Text style={styles.hintText}>A spinner appears automatically when buffering occurs.</Text>
        </View>

        <View style={styles.section} testID="settings-overlay-hints">
          <Text style={styles.sectionTitle}>Settings Overlay</Text>
          <Text style={styles.hintText}>Tap the gear icon in the player to open the settings overlay.</Text>
          <Text style={styles.hintText}>The core overlay exposes: playback speed (0.5×–2×) and mute toggle.</Text>
          <Text style={styles.hintText}>Extra menu items and sections can be injected via the settingsOverlay prop.</Text>
        </View>

        <View style={styles.section} testID="debug-overlay-hints">
          <Text style={styles.sectionTitle}>Debug Overlay</Text>
          <Text style={styles.hintText}>Two-finger triple-tap the player to toggle the debug overlay.</Text>
          <Text style={styles.hintText}>While playing: watch position and buffered values update in real time.</Text>
          <Text style={styles.hintText}>While buffering: the state field shows "buffering" and rebuffer count increments.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player Controls</Text>
          <Text>Position: {position.toFixed(2)}s</Text>
          <Text>Duration: {duration.toFixed(2)}s</Text>
          <View style={styles.buttonsRow}>
            <View style={styles.buttonContainer}>
              <Button title="Play" onPress={() => setPaused(false)} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Pause" onPress={() => setPaused(true)} />
            </View>
          </View>
          <View style={styles.buttonsRow}>
            <View style={styles.buttonContainer}>
              <Button title="-10s" onPress={handleSeekBackward} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="+10s" onPress={handleSeekForward} />
            </View>
          </View>
          <PlaybackOptions
            isPlaying={!paused}
            onSeekBack={handleSeekBackward}
            onTogglePlayPause={() => setPaused((value) => !value)}
            onSeekForward={handleSeekForward}
            onToggleFullscreen={handleToggleFullscreen}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Playback Event</Text>
          {errorMessage ? <Text style={{ color: 'red' }}>Error: {errorMessage}</Text> : null}
          <Text style={styles.latestEventText}>
            {latestPlaybackEvent ? JSON.stringify(latestPlaybackEvent) : 'No events yet'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonContainer: {
    flex: 1,
  },
  playerArea: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
  },
  player: {
    height: '100%',
    width: '100%',
  },
  latestEventText: {
    fontSize: 12,
  },
  noteText: {
    fontSize: 12,
  },
  hintText: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CoreDemoScreen;
