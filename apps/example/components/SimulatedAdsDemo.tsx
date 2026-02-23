import { ProMamoPlayer } from '@mamoplayer/pro';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SimulatedAdsDemo() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Simulated Ads Demo</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player</Text>
          <View style={styles.playerArea}>
            <ProMamoPlayer
              source={{ uri: 'https://main-content-video.mp4' }}
              ads={{
                adBreaks: [
                  { type: 'preroll', source: { uri: 'https://ad1.mp4' } },
                  { type: 'midroll', time: 30, source: { uri: 'https://ad2.mp4' } },
                  { type: 'postroll', source: { uri: 'https://ad3.mp4' } },
                ],
                skipButtonEnabled: true,
                skipAfterSeconds: 5,
              }}
              analytics={{ onEvent: (event: unknown) => console.log('analytics', event) }}
              style={styles.player}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
});
