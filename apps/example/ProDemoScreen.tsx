import type { PlaybackEvent } from '@mamoplayer/core';
import { ProMamoPlayer } from '@mamoplayer/pro';
import { useState } from 'react';
import { Button, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { AdsConfig } from '../../packages/pro/src/types/ads';
import type { AnalyticsEvent } from '../../packages/pro/src/types/analytics';
import type { ThemeName } from '../../packages/pro/src/types/theme';
import type { TracksConfig } from '../../packages/pro/src/types/tracks';

const MP4_SOURCE_URI = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const HLS_SOURCE_URI = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const INVALID_MAIN_SOURCE_URI = 'https://invalid-main.m3u8';
const INVALID_AD_SOURCE_URI = 'https://not-found-ad.mp4';

const demoAds: AdsConfig = {
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

const demoAdsWithBrokenSource: AdsConfig = {
  ...demoAds,
  adBreaks: demoAds.adBreaks.map((adBreak, index) =>
    index === 1 ? { ...adBreak, source: { uri: INVALID_AD_SOURCE_URI } } : adBreak,
  ),
};

const getErrorMessageFromUnknown = (payload?: unknown): string | undefined => {
  if (payload instanceof Error) {
    return payload.message;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const payloadRecord = payload as {
    message?: unknown;
    errorMessage?: unknown;
    error?: { message?: unknown } | unknown;
  };

  if (typeof payloadRecord.errorMessage === 'string' && payloadRecord.errorMessage.length > 0) {
    return payloadRecord.errorMessage;
  }

  if (typeof payloadRecord.message === 'string' && payloadRecord.message.length > 0) {
    return payloadRecord.message;
  }

  if (
    payloadRecord.error &&
    typeof payloadRecord.error === 'object' &&
    typeof (payloadRecord.error as { message?: unknown }).message === 'string'
  ) {
    return (payloadRecord.error as { message: string }).message;
  }

  return undefined;
};

const getErrorMessageFromPlaybackEvent = (playbackEvent?: PlaybackEvent): string | undefined => {
  if (!playbackEvent || playbackEvent.type !== 'error') {
    return undefined;
  }

  return getErrorMessageFromUnknown(playbackEvent.error);
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
    { id: 'auto', label: 'Auto', uri: HLS_SOURCE_URI, isDefault: true },
    { id: '720p', label: '720p', uri: HLS_SOURCE_URI },
    { id: '1080p', label: '1080p', uri: HLS_SOURCE_URI },
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
  const [pipEnabled, setPipEnabled] = useState(true);
  const [adsConfig, setAdsConfig] = useState<AdsConfig>(demoAds);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [errorBannerMessage, setErrorBannerMessage] = useState<string | null>(null);

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
                  setErrorBannerMessage(null);
                }}
              />
            </View>
            <View style={styles.buttonContainer}>
              <Button
                title="HLS Source (m3u8)"
                onPress={() => {
                  setSource({ uri: HLS_SOURCE_URI });
                  setErrorBannerMessage(null);
                }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error Scenarios</Text>
          <View style={styles.optionsRow}>
            <View style={styles.optionButtonContainer}>
              <Button
                title="Play Invalid Main Source"
                onPress={() => {
                  setSource({ uri: INVALID_MAIN_SOURCE_URI });
                  setErrorBannerMessage(null);
                }}
              />
            </View>
            <View style={styles.optionButtonContainer}>
              <Button
                title="Play Invalid Ad Source"
                onPress={() => {
                  setAdsConfig(demoAdsWithBrokenSource);
                  setErrorBannerMessage(null);
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

          <View style={styles.toggleRow}>
            <Text style={styles.label}>Picture-in-Picture</Text>
            <Switch value={pipEnabled} onValueChange={setPipEnabled} />
          </View>
        </View>

        <View style={styles.playerArea}>
          <ProMamoPlayer
            source={source}
            pip={{ enabled: pipEnabled }}
            onPipEvent={(e) => console.log('PiP event:', e)}
            onPlaybackEvent={(event) => {
              if (event.type !== 'error') {
                return;
              }

              setErrorBannerMessage(
                getErrorMessageFromUnknown(event.error) ?? 'Unknown playback error',
              );
            }}
            tracks={demoTracks}
            thumbnails={thumbnails}
            ads={adsConfig}
            watermark={watermark}
            themeName={themeName}
            layoutVariant={layoutVariant}
            style={styles.player}
            settingsOverlay={settingsOverlay}
            analytics={{
              onEvent: (event) => {
                console.log('Pro analytics:', event);
                const analyticsErrorMessage =
                  event.errorMessage ?? getErrorMessageFromPlaybackEvent(event.playbackEvent);

                if (event.type === 'ad_error' || analyticsErrorMessage) {
                  setErrorBannerMessage(analyticsErrorMessage ?? 'Unknown analytics error');
                }

                setAnalyticsEvents((prev) => {
                  const next = [event, ...prev];
                  return next.slice(0, 10);
                });
              },
            }}
          />
        </View>
        {errorBannerMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>Error occurred: {errorBannerMessage}</Text>
          </View>
        ) : null}
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

        <Text style={styles.descriptionText}>
          PiP behavior depends on platform support and native integration.
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  errorBanner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ProDemoScreen;
