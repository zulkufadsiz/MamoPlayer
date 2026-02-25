import { ProMamoPlayer } from '@mamoplayer/pro';
import { useState } from 'react';
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AnalyticsEvent } from '../../packages/pro/src/types/analytics';

const MP4_SOURCE_URI = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const HLS_SOURCE_URI = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

const ProDemoScreen = () => {
  const [source, setSource] = useState<{ uri: string }>({
    uri: MP4_SOURCE_URI,
  });
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);

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
          <ProMamoPlayer
            source={source}
            style={styles.player}
            analytics={{
              onEvent: (event) => {
                console.log('Pro analytics:', event);
                setAnalyticsEvents((prev) => {
                  const next = [event, ...prev];
                  return next.slice(0, 10);
                });
              },
            }}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analytics (last 10 events)</Text>
          {analyticsEvents.length === 0 ? (
            <Text style={styles.placeholderText}>No events yet</Text>
          ) : (
            <View style={styles.analyticsList}>
              {analyticsEvents.map((event, index) => (
                <View key={`${event.timestamp}-${event.type}-${index}`} style={styles.analyticsItem}>
                  <Text style={styles.analyticsText}>type: {event.type}</Text>
                  <Text style={styles.analyticsText}>position: {event.position ?? '-'}</Text>
                  <Text style={styles.analyticsText}>duration: {event.duration ?? '-'}</Text>
                  {event.quartile ? (
                    <Text style={styles.analyticsText}>quartile: {event.quartile}</Text>
                  ) : null}
                  {event.adPosition ? (
                    <Text style={styles.analyticsText}>adPosition: {event.adPosition}</Text>
                  ) : null}
                  {event.errorMessage ? (
                    <Text style={styles.analyticsText}>errorMessage: {event.errorMessage}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
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
  analyticsList: {
    gap: 8,
  },
  analyticsItem: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
    gap: 2,
  },
  analyticsText: {
    fontSize: 12,
  },
});

export default ProDemoScreen;
