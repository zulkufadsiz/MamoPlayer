import { MamoPlayer } from '@mamoplayer/core';
import { useState } from 'react';
import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const SAMPLE_MP4_URL = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_HLS_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

const CoreDemoScreen = () => {
  const [source, setSource] = useState({ uri: SAMPLE_MP4_URL });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>MamoPlayer Core Demo</Text>

      <View style={styles.quickSwitchContainer}>
        <Text style={styles.quickSwitchLabel}>QuickSwitch</Text>
        <View style={styles.buttonsRow}>
          <View style={styles.buttonContainer}>
            <Button
              title="Play MP4"
              onPress={() => setSource({ uri: SAMPLE_MP4_URL })}
            />
          </View>
          <View style={styles.buttonContainer}>
            <Button
              title="Play HLS"
              onPress={() => setSource({ uri: SAMPLE_HLS_URL })}
            />
          </View>
        </View>
      </View>

      <View style={styles.playerArea}>
        <MamoPlayer
          source={source}
          autoPlay
          controls
          style={styles.player}
        />
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
});

export default CoreDemoScreen;