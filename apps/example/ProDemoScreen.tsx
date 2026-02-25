import { ProMamoPlayer } from '@mamoplayer/pro';
import { useState } from 'react';
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const MP4_SOURCE_URI = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const HLS_SOURCE_URI = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

const ProDemoScreen = () => {
  const [source, setSource] = useState<{ uri: string }>({
    uri: MP4_SOURCE_URI,
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>MamoPlayer Pro Demo</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Source Selection</Text>
          <View style={styles.buttonsRow}>
            <View style={styles.buttonContainer}>
              <Button
                title="MP4 Source"
                onPress={() => {
                  setSource({ uri: MP4_SOURCE_URI });
                }}
              />
            </View>
            <View style={styles.buttonContainer}>
              <Button
                title="HLS Source (m3u8)"
                onPress={() => {
                  setSource({ uri: HLS_SOURCE_URI });
                }}
              />
            </View>
          </View>
        </View>

        <View style={styles.playerArea}>
          <ProMamoPlayer source={source} style={styles.player} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics</Text>
          <Text style={styles.placeholderText}>Coming soon</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ads</Text>
          <Text style={styles.placeholderText}>Coming soon</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Watermark</Text>
          <Text style={styles.placeholderText}>Coming soon</Text>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  placeholderText: {
    fontSize: 14,
  },
});

export default ProDemoScreen;
