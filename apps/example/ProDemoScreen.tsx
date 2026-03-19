import type { PlaybackEvent } from '@mamoplayer/core';
import type {
    AdsConfig,
    AnalyticsEvent,
    PlaybackRestrictions,
    PlayerLayoutVariant,
    ProSettingsOverlayConfig,
    ThemeName,
    TracksConfig,
} from '@mamoplayer/pro';
import { ProMamoPlayer } from '@mamoplayer/pro';
import { useState } from 'react';
import { Button, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

/* ── URIs ─────────────────────────────────────────────────────────────────── */

const MP4_SOURCE_URI = 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const HLS_SOURCE_URI = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const SUBTITLE_EN_URI =
  'https://raw.githubusercontent.com/shaka-project/shaka-player/main/test/test/assets/text-clip.vtt';
const SUBTITLE_FR_URI =
  'https://raw.githubusercontent.com/shaka-project/shaka-player/main/test/test/assets/text-clip-alt.vtt';
const INVALID_MAIN_SOURCE_URI = 'https://invalid-main.m3u8';
const INVALID_AD_SOURCE_URI = 'https://not-found-ad.mp4';

/* ── Static config ───────────────────────────────────────────────────────── */

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

const watermark = {
  text: 'demo-user@example.com',
  opacity: 0.25,
  randomizePosition: true,
  intervalMs: 7000,
};

const settingsOverlay: ProSettingsOverlayConfig = {
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
    { id: 'sub-en', language: 'en', label: 'English', uri: SUBTITLE_EN_URI, isDefault: true },
    { id: 'sub-fr', language: 'fr', label: 'Français', uri: SUBTITLE_FR_URI },
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

/* ── Helpers ─────────────────────────────────────────────────────────────── */

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

/* ── Sub-components ──────────────────────────────────────────────────────── */

const SectionLabel = ({ index, title }: { index: number; title: string }) => (
  <View style={labelStyles.row}>
    <View style={labelStyles.badge}>
      <Text style={labelStyles.badgeText}>{index}</Text>
    </View>
    <Text style={labelStyles.title}>{title}</Text>
  </View>
);

const labelStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  title: { fontSize: 15, fontWeight: '700', color: '#11181C' },
});

const HintRow = ({ text }: { text: string }) => (
  <View style={hintRowStyles.row}>
    <Text style={hintRowStyles.bullet}>›</Text>
    <Text style={hintRowStyles.text}>{text}</Text>
  </View>
);

const hintRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  bullet: { fontSize: 14, color: '#7c3aed', lineHeight: 20, fontWeight: '700' },
  text: { flex: 1, fontSize: 13, color: '#444', lineHeight: 20 },
});

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={infoRowStyles.row}>
    <Text style={infoRowStyles.label}>{label}</Text>
    <Text style={infoRowStyles.value}>{value}</Text>
  </View>
);

const infoRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  label: { fontSize: 13, color: '#687076' },
  value: { fontSize: 13, fontWeight: '600', color: '#11181C' },
});

const TrackChip = ({ label, isDefault }: { label: string; isDefault?: boolean }) => (
  <View style={[chipStyles.chip, isDefault && chipStyles.chipActive]}>
    <Text style={[chipStyles.text, isDefault && chipStyles.textActive]}>
      {label}
      {isDefault ? ' ✦' : ''}
    </Text>
  </View>
);

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f9fafb',
  },
  chipActive: { borderColor: '#7c3aed', backgroundColor: '#f5f0ff' },
  text: { fontSize: 12, color: '#374151', fontWeight: '500' },
  textActive: { color: '#7c3aed', fontWeight: '600' },
});

const AdBreakRow = ({ type, time }: { type: string; time?: number }) => {
  const label =
    type === 'preroll' ? 'Pre-roll — plays before content' :
    type === 'midroll' ? `Mid-roll — plays at ${time ?? 0}s` :
    'Post-roll — plays after content ends';
  const dotColor =
    type === 'preroll' ? '#22c55e' : type === 'midroll' ? '#f59e0b' : '#6b7280';
  return (
    <View style={adBreakStyles.row}>
      <View style={[adBreakStyles.dot, { backgroundColor: dotColor }]} />
      <Text style={adBreakStyles.label}>{label}</Text>
    </View>
  );
};

const adBreakStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 13, color: '#11181C' },
});

const ANALYTICS_COLOR: Partial<Record<string, string>> = {
  play: '#22c55e',
  pause: '#f59e0b',
  seek: '#3b82f6',
  ended: '#6b7280',
  session_start: '#22c55e',
  session_end: '#6b7280',
  ad_start: '#a78bfa',
  ad_complete: '#7c3aed',
  ad_error: '#ef4444',
  playback_error: '#ef4444',
  buffer_start: '#f59e0b',
  buffer_end: '#22c55e',
  quality_change: '#3b82f6',
  subtitle_change: '#3b82f6',
  audio_track_change: '#3b82f6',
};

const AnalyticsEventRow = ({ event }: { event: AnalyticsEvent }) => {
  const color = ANALYTICS_COLOR[event.type] ?? '#6b7280';
  return (
    <View style={analyticsRowStyles.row}>
      <View style={[analyticsRowStyles.dot, { backgroundColor: color }]} />
      <Text style={analyticsRowStyles.type}>{event.type}</Text>
      {event.position !== undefined ? (
        <Text style={analyticsRowStyles.detail}>{event.position.toFixed(1)}s</Text>
      ) : null}
      {event.errorMessage ? (
        <Text style={[analyticsRowStyles.detail, analyticsRowStyles.errorText]}>
          {event.errorMessage}
        </Text>
      ) : null}
    </View>
  );
};

const analyticsRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  type: { fontSize: 12, fontWeight: '600', color: '#11181C', minWidth: 150 },
  detail: { fontSize: 12, color: '#687076', flex: 1 },
  errorText: { color: '#ef4444' },
});

/* ── Main Screen ─────────────────────────────────────────────────────────── */

const ProDemoScreen = ({ onBack }: { onBack?: () => void } = {}) => {
  const [source, setSource] = useState<{ uri: string }>({ uri: MP4_SOURCE_URI });
  const [themeName, setThemeName] = useState<ThemeName>('ott');
  const layoutVariant: PlayerLayoutVariant = themeName === 'ott' ? 'ott' : 'standard';
  const [pipEnabled, setPipEnabled] = useState(true);
  const [adsConfig, setAdsConfig] = useState<AdsConfig>(demoAds);
  const [restrictions, setRestrictions] = useState<PlaybackRestrictions>({});
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [errorBannerMessage, setErrorBannerMessage] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      {onBack ? (
        <Pressable style={styles.backButton} onPress={onBack} testID="back-to-demos">
          <Text style={styles.backText}>← Demos</Text>
        </Pressable>
      ) : null}
      <ScrollView contentContainerStyle={styles.contentContainer}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>MamoPlayer Pro Demo</Text>
          <Text style={styles.subtitle}>Licensed Pro SDK · Full feature showcase</Text>
          <View style={styles.featureBadgesRow}>
            {['Ads', 'Watermark', 'Thumbnails', 'Tracks', 'Settings', 'PiP', 'Debug'].map((f) => (
              <View key={f} style={styles.featureBadge}>
                <Text style={styles.featureBadgeText}>✓ {f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── § 1: Source ──────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionLabel index={1} title="Source Selection" />
          <Text style={styles.cardDesc}>
            Switch between a plain MP4 and a multi-bitrate HLS stream to exercise adaptive playback.
          </Text>
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

        {/* ── § 2: Player ──────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionLabel index={2} title="Pro Player" />
          <Text style={styles.cardDesc}>
            Ads, watermark, multi-track, thumbnails, settings overlay, PiP, and debug overlay are all active.
          </Text>
          <View style={styles.playerArea}>
            <ProMamoPlayer
              source={source}
              controls={{ autoHide: true, autoHideDelay: 3000 }}
              gestures={{ doubleTapSeek: true }}
              layoutVariant={layoutVariant}
              pip={{ enabled: pipEnabled }}
              onPipEvent={(e) => console.log('PiP event:', e)}
              restrictions={restrictions}
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
              style={styles.player}
              settingsOverlay={settingsOverlay}
              debug={{ enabled: true }}
              analytics={{
                onEvent: (event) => {
                  console.log('Pro analytics:', event);
                  const analyticsErrorMessage =
                    event.errorMessage ?? getErrorMessageFromPlaybackEvent(event.playbackEvent);

                  if (event.type === 'ad_error' || analyticsErrorMessage) {
                    setErrorBannerMessage(analyticsErrorMessage ?? 'Unknown analytics error');
                  }

                  setAnalyticsEvents((prev) => [event, ...prev].slice(0, 10));
                },
              }}
            />
          </View>
          {errorBannerMessage ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>Error occurred: {errorBannerMessage}</Text>
            </View>
          ) : null}
        </View>

        {/* ── § 3: Appearance ──────────────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionLabel index={3} title="Appearance" />
          <Text style={styles.cardDesc}>
            Choose a built-in theme and toggle Picture-in-Picture support.
          </Text>

          <View>
            <Text style={styles.subHeading}>Theme</Text>
            <View style={styles.segmentRow}>
              {(['light', 'dark', 'ott'] as ThemeName[]).map((t) => (
                <Pressable
                  key={t}
                  style={[styles.segmentItem, themeName === t && styles.segmentItemActive]}
                  onPress={() => setThemeName(t)}
                >
                  <Text style={[styles.segmentText, themeName === t && styles.segmentTextActive]}>
                    {t === 'light' ? 'Light' : t === 'dark' ? 'Dark' : 'OTT'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Picture-in-Picture</Text>
            <Switch value={pipEnabled} onValueChange={setPipEnabled} />
          </View>
        </View>

        {/* ── § 4: Ads ─────────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionLabel index={4} title="Ads" />
          <Text style={styles.cardDesc}>
            Three scheduled ad breaks using the custom (non-IMA) ad engine. A skip button appears after 5 s.
          </Text>
          {demoAds.adBreaks.map((ab) => (
            <AdBreakRow key={ab.type} type={ab.type} time={ab.time} />
          ))}
          <View style={styles.tagRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Skip after 5s</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Custom ad engine</Text>
            </View>
          </View>
        </View>

        {/* ── § 5: Watermark ───────────────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionLabel index={5} title="Watermark" />
          <Text style={styles.cardDesc}>
            A floating text overlay deters screen recording by shifting position at a regular interval.
          </Text>
          <InfoRow label="Text" value={watermark.text} />
          <InfoRow label="Opacity" value={`${(watermark.opacity * 100).toFixed(0)}%`} />
          <InfoRow label="Repositions every" value={`${(watermark.intervalMs / 1000).toFixed(0)}s`} />
          <InfoRow label="Position strategy" value="Randomized" />
        </View>

        {/* ── § 6: Multi-Track ─────────────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionLabel index={6} title="Multi-Track" />
          <Text style={styles.cardDesc}>
            Quality, audio, and subtitle tracks are exposed via the settings overlay. Default tracks are marked ✦.
          </Text>

          <Text style={styles.trackGroupLabel}>Quality</Text>
          <View style={styles.chipRow}>
            {demoTracks.qualities?.map((q) => (
              <TrackChip key={q.id} label={q.label} isDefault={q.id === demoTracks.defaultQualityId} />
            ))}
          </View>

          <Text style={styles.trackGroupLabel}>Audio</Text>
          <View style={styles.chipRow}>
            {demoTracks.audioTracks?.map((a) => (
              <TrackChip key={a.id} label={a.label} isDefault={a.id === demoTracks.defaultAudioTrackId} />
            ))}
          </View>

          <Text style={styles.trackGroupLabel}>Subtitles</Text>
          <View style={styles.chipRow}>
            {demoTracks.subtitleTracks?.map((s) => (
              <TrackChip key={s.id} label={s.label} isDefault={s.id === demoTracks.defaultSubtitleTrackId} />
            ))}
          </View>
        </View>

        {/* ── § 7: Thumbnails & Settings ───────────────────────────────────── */}
        <View style={styles.card}>
          <SectionLabel index={7} title="Thumbnails & Settings Overlay" />
          <Text style={styles.cardDesc}>
            Scrub the timeline to see frame preview thumbnails. Open the settings gear to manage quality,
            subtitles, and audio tracks.
          </Text>
          <View style={styles.twoColRow}>
            <View style={styles.twoColItem}>
              <Text style={styles.subHeading}>Thumbnails</Text>
              <Text style={styles.noteText}>{thumbnails.frames.length} preview frames</Text>
              <Text style={styles.noteText}>0 s · 10 s · 30 s · 60 s</Text>
            </View>
            <View style={styles.twoColDivider} />
            <View style={styles.twoColItem}>
              <Text style={styles.subHeading}>Settings</Text>
              <Text style={styles.noteText}>✓ Quality picker</Text>
              <Text style={styles.noteText}>✓ Subtitles</Text>
              <Text style={styles.noteText}>✓ Audio tracks</Text>
            </View>
          </View>
        </View>

        {/* ── § 8: Playback Restrictions ───────────────────────────────────── */}
        <View style={styles.card} testID="playback-restrictions">
          <SectionLabel index={8} title="Playback Restrictions" />
          <Text style={styles.cardDesc}>
            Lock seek directions to enforce content-protection or linear-viewing requirements.
          </Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Disable seeking forward</Text>
            <Switch
              value={restrictions.disableSeekingForward ?? false}
              onValueChange={(val) => setRestrictions((r) => ({ ...r, disableSeekingForward: val }))}
            />
          </View>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Disable seeking backward</Text>
            <Switch
              value={restrictions.disableSeekingBackward ?? false}
              onValueChange={(val) => setRestrictions((r) => ({ ...r, disableSeekingBackward: val }))}
            />
          </View>
        </View>

        {/* ── § 9: OTT UX Features ─────────────────────────────────────────── */}
        <View style={styles.card} testID="ott-ux-hints">
          <SectionLabel index={9} title="OTT UX Features" />
          <Text style={styles.cardDesc}>
            Touch interactions designed for long-form, TV-style viewing.
          </Text>
          <View style={styles.hintList}>
            <HintRow text="Tap the video to show or hide controls." />
            <HintRow text="Double-tap the left side to seek back 10s." />
            <HintRow text="Double-tap the right side to seek forward 10s." />
            <HintRow text="Scrub the timeline to see thumbnail frame previews and the current time." />
            <HintRow text="Controls auto-hide after 3s of inactivity during playback." />
            <HintRow text="A spinner appears automatically when buffering occurs." />
            <HintRow text="Tap the settings icon to open the OTT overlay menu (quality, subtitles, audio)." />
            <HintRow text="Watermark moves every few seconds to deter screen recording." />
            <HintRow text="PiP behavior depends on platform support and native integration." />
          </View>
        </View>

        {/* ── § 10: Developer Debug Overlay ────────────────────────────────── */}
        <View style={styles.card} testID="debug-overlay-hints">
          <SectionLabel index={10} title="Developer Debug Overlay" />
          <Text style={styles.cardDesc}>
            Inspect real-time playback internals without extra tooling.
          </Text>
          <View style={styles.hintList}>
            <HintRow text="Two-finger triple-tap the player to toggle the debug overlay." />
            <HintRow text="While playing: watch position and buffered values update in real time." />
            <HintRow text={'While buffering: the state field shows "buffering" and rebuffer count increments.'} />
            <HintRow text="While switching tracks: quality, audio, and subtitle fields update immediately." />
            <HintRow text={'While an ad plays: the ad playing field is highlighted and ad state shows "playing".'} />
          </View>
        </View>

        {/* ── Error Scenarios ───────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.errorSectionTitle}>Error Scenarios</Text>
          <Text style={styles.cardDesc}>
            Simulate broken sources to verify graceful error handling and recovery.
          </Text>
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
            <View style={styles.optionButtonContainer}>
              <Button
                title="Reset Ads"
                onPress={() => {
                  setAdsConfig(demoAds);
                  setErrorBannerMessage(null);
                }}
              />
            </View>
          </View>
        </View>

        {/* ── Analytics ────────────────────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Analytics (last 10 events)</Text>
          <Text style={styles.cardDesc}>
            Every lifecycle transition — playback, ads, buffering, and track changes — is dispatched here.
          </Text>
          {analyticsEvents.length === 0 ? (
            <Text style={styles.emptyLog}>No events yet</Text>
          ) : (
            <View style={styles.eventList}>
              {analyticsEvents.map((event, index) => (
                <AnalyticsEventRow key={`${event.timestamp}-${event.type}-${index}`} event={event} />
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

/* ── Styles ──────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  /* Layout */
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  contentContainer: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },

  /* Header */
  header: {
    gap: 6,
    paddingVertical: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#11181C',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#687076',
  },
  featureBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  featureBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f5f0ff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#c4b5fd',
  },
  featureBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7c3aed',
  },

  /* Card */
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: '#444',
    lineHeight: 19,
  },

  /* Section titles (for cards that don't use SectionLabel) */
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#11181C',
  },
  errorSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dc2626',
  },

  /* Source buttons */
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonContainer: {
    flex: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionButtonContainer: {
    minWidth: 100,
  },

  /* Player */
  playerArea: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  player: {
    height: '100%',
    width: '100%',
  },

  /* Error banner */
  errorBanner: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
  },
  errorBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#dc2626',
  },

  /* Theme segmented control */
  subHeading: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9BA1A6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: '#f5f6f8',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#687076',
  },
  segmentTextActive: {
    color: '#7c3aed',
    fontWeight: '700',
  },

  /* Toggle rows */
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#11181C',
  },

  /* Ad break tags */
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },

  /* Track chips */
  trackGroupLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9BA1A6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  /* Thumbnails & Settings two-column */
  twoColRow: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    overflow: 'hidden',
  },
  twoColItem: {
    flex: 1,
    padding: 12,
    gap: 3,
  },
  twoColDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  noteText: {
    fontSize: 12,
    color: '#444',
    lineHeight: 18,
  },

  /* Hint list */
  hintList: {
    gap: 6,
  },

  /* Analytics */
  emptyLog: {
    fontSize: 13,
    color: '#9BA1A6',
    fontStyle: 'italic',
  },
  eventList: {
    gap: 2,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
  },
});

export default ProDemoScreen;
