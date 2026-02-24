import { MamoPlayer, type PlaybackEvent } from '@mamoplayer/core';
import {
  type ComponentProps,
  type ComponentType,
  type RefAttributes,
  useRef,
  useState,
} from 'react';
import { Button, Platform, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { VideoRef } from 'react-native-video';

const VIDEO_URL = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const HLS_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const SUBTITLE_URL = 'https://bitdash-a.akamaihd.net/content/sintel/subtitles/subtitles_en.vtt';
const SUBTITLE_SUPPORTED_PLATFORMS = new Set(['ios', 'android', 'tvos', 'visionos']);
type CorePlayerWithRefProps = ComponentProps<typeof MamoPlayer> & RefAttributes<VideoRef>;
const CorePlayerWithRef = MamoPlayer as ComponentType<CorePlayerWithRefProps>;

const CoreDemoScreen = () => {
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

  return (
    <SafeAreaView style={styles.container}>
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
            controls
            onPlaybackEvent={handlePlaybackEvent}
            style={styles.player}
          />
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
});

export default CoreDemoScreen;
