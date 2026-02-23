import { MamoPlayer, type PlaybackEvent } from '@mamoplayer/core';
import {
  type ComponentProps,
  type ComponentType,
  type RefAttributes,
  useRef,
  useState,
} from 'react';
import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import type { VideoRef } from 'react-native-video';

const SAMPLE_MP4_URL = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_HLS_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
type CorePlayerWithRefProps = ComponentProps<typeof MamoPlayer> & RefAttributes<VideoRef>;
const CorePlayerWithRef = MamoPlayer as ComponentType<CorePlayerWithRefProps>;

const CoreDemoScreen = () => {
  const [source, setSource] = useState({ uri: SAMPLE_MP4_URL });
  const [paused, setPaused] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<VideoRef | null>(null);

  const handlePlaybackEvent = (event: PlaybackEvent) => {
    if (event.type === 'time_update' || event.type === 'ready') {
      setPosition(event.position);
      setDuration(event.duration ?? 0);
    }
  };

  const handlePlayMp4 = () => {
    setSource({ uri: SAMPLE_MP4_URL });
    setPaused(false);
    setPosition(0);
    setDuration(0);
  };

  const handlePlayHls = () => {
    setSource({ uri: SAMPLE_HLS_URL });
    setPaused(false);
    setPosition(0);
    setDuration(0);
  };

  const handleSeekForward = () => {
    videoRef.current?.seek(position + 10);
  };

  const handleSeekBackward = () => {
    videoRef.current?.seek(position - 10);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>MamoPlayer Core Demo</Text>

      <View style={styles.quickSwitchContainer}>
        <Text style={styles.quickSwitchLabel}>QuickSwitch</Text>
        <View style={styles.buttonsRow}>
          <View style={styles.buttonContainer}>
            <Button title="Play MP4" onPress={handlePlayMp4} />
          </View>
          <View style={styles.buttonContainer}>
            <Button title="Play HLS" onPress={handlePlayHls} />
          </View>
        </View>
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

      <View style={styles.controlsContainer}>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  quickSwitchContainer: {
    gap: 8,
    marginBottom: 16,
  },
  quickSwitchLabel: {
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
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
  },
  player: {
    height: '100%',
    width: '100%',
  },
  controlsContainer: {
    gap: 8,
    marginTop: 12,
  },
});

export default CoreDemoScreen;