import { ProMamoPlayer } from '@mamoplayer/pro';
import { useState } from 'react';
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { AnalyticsEvent } from '../../packages/pro/src/types/analytics';
import type { ThemeName } from '../../packages/pro/src/types/theme';
import type { TracksConfig } from '../../packages/pro/src/types/tracks';

const MP4_SOURCE_URI = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const HLS_SOURCE_URI = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

const demoAds = {
  adBreaks: [
    {
      type: 'preroll' as const,
      source: { uri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
    },
    {
      type: 'midroll' as const,
      time: 30,
      source: { uri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
    },
    {
      type: 'postroll' as const,
      source: { uri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
    },
  ],
  skipButtonEnabled: true,
  skipAfterSeconds: 5,
};

const watermark = {
  text: 'demo-user@example.com',
  opacity: 0.25,
  randomizePosition: true,
  intervalMs: 7000,
};

const settingsOverlay = {
  enabled: true,
  showQuality: true,
  showSubtitles: true,
  showAudioTracks: true,
};

const demoTracks: TracksConfig = {
  qualities: [
    { id: 'auto', label: 'Auto', uri: 'https://master.m3u8', isDefault: true },
    { id: '720p', label: '720p', uri: 'https://720p.m3u8' },
    { id: '1080p', label: '1080p', uri: 'https://1080p.m3u8' },
  ],
  audioTracks: [
    { id: 'audio-en', language: 'en', label: 'English' },
    { id: 'audio-tr', language: 'tr', label: 'Türkçe' },
  ],
  subtitleTracks: [
    {
      id: 'sub-en',
      language: 'en',
      label: 'English',
      uri: 'https://subs-en.vtt',
      isDefault: true,
    },
    { id: 'sub-tr', language: 'tr', label: 'Türkçe', uri: 'https://subs-tr.vtt' },
  ],
  defaultQualityId: 'auto',
  defaultAudioTrackId: 'audio-en',
  defaultSubtitleTrackId: 'sub-en',
};

const thumbnails = {
  frames: [
    { time: 0, uri: 'https://thumbs/frame-0.jpg' },
    { time: 10, uri: 'https://thumbs/frame-10.jpg' },
    { time: 30, uri: 'https://thumbs/frame-30.jpg' },
    { time: 60, uri: 'https://thumbs/frame-60.jpg' },
  ],
};

const ProDemoScreen = () => {
  const [source, setSource] = useState<{ uri: string }>({
    uri: MP4_SOURCE_URI,
  });
  const [themeName, setThemeName] = useState<ThemeName>('ott');
  const [layoutVariant, setLayoutVariant] = useState<'compact' | 'standard' | 'ott'>('ott');
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player Appearance</Text>

          <Text style={styles.label}>Theme</Text>
          <View style={styles.optionsRow}>
            <View style={styles.optionButtonContainer}>
              <Button
                title={`${themeName === 'light' ? '✓ ' : ''}Light`}
                onPress={() => setThemeName('light')}
              />
            </View>
            <View style={styles.optionButtonContainer}>
              <Button
                title={`${themeName === 'dark' ? '✓ ' : ''}Dark`}
                onPress={() => setThemeName('dark')}
              />
            </View>
            <View style={styles.optionButtonContainer}>
              <Button
                title={`${themeName === 'ott' ? '✓ ' : ''}OTT`}
                onPress={() => setThemeName('ott')}
              />
            </View>
          </View>

          <Text style={styles.label}>Layout</Text>
          <View style={styles.optionsRow}>
            <View style={styles.optionButtonContainer}>
              <Button
                title={`${layoutVariant === 'compact' ? '✓ ' : ''}Compact`}
                onPress={() => setLayoutVariant('compact')}
              />
            </View>
            <View style={styles.optionButtonContainer}>
              <Button
                title={`${layoutVariant === 'standard' ? '✓ ' : ''}Standard`}
                onPress={() => setLayoutVariant('standard')}
              />
            </View>
            <View style={styles.optionButtonContainer}>
              <Button
                title={`${layoutVariant === 'ott' ? '✓ ' : ''}OTT`}
                onPress={() => setLayoutVariant('ott')}
              />
            </View>
          </View>

          <Text style={styles.legendText}>
            Use the controls above to preview built-in themes and layout variants.
          </Text>
        </View>

        <View style={styles.playerArea}>
          <ProMamoPlayer
            source={source}
            tracks={demoTracks}
            thumbnails={thumbnails}
            ads={demoAds}
            watermark={watermark}
            themeName={themeName}
            layoutVariant={layoutVariant}
            style={styles.player}
            settingsOverlay={settingsOverlay}
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
        <Text style={styles.watermarkDescription}>
          Watermark is shown on top of the video, moving every few seconds to help deter screen
          recording.
        </Text>

        <Text style={styles.descriptionText}>
          This demo uses simulated pre-roll, mid-roll (at 30s), and post-roll ads with skip after 5s.
        </Text>

        <Text style={styles.descriptionText}>
          Tap the settings (gear) icon on the player to open the OTT-style overlay menu.
        </Text>

        <Text style={styles.descriptionText}>
          Scrub the timeline to see thumbnail previews based on configured frames.
        </Text>

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
          <Text style={styles.placeholderText}>Simulated ads enabled: pre-roll, mid-roll (30s), post-roll, skip after 5s</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Watermark</Text>
          <Text style={styles.placeholderText}>Enabled in the player above</Text>
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
  watermarkDescription: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionButtonContainer: {
    minWidth: 100,
  },
  placeholderText: {
    fontSize: 14,
  },
  legendText: {
    fontSize: 12,
    opacity: 0.8,
  },
  descriptionText: {
    fontSize: 12,
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
