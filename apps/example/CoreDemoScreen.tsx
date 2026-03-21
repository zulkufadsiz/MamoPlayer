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
const EVENT_LOG_MAX = 6;

type CorePlayerWithRefProps = ComponentProps<typeof MamoPlayer> & RefAttributes<VideoRef>;
const CorePlayerWithRef = MamoPlayer as ComponentType<CorePlayerWithRefProps>;

/* ─── Small reusable sub-components ────────────────────────────────────────── */

const SectionLabel = ({ index, title }: { index: number; title: string }) => (
  <View style={labelStyles.row}>
    <View style={labelStyles.badge}>
      <Text style={labelStyles.badgeText}>{index}</Text>
    </View>
    <Text style={labelStyles.title}>{title}</Text>
  </View>
);

const labelStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0a7ea4',
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
  bullet: { fontSize: 14, color: '#0a7ea4', lineHeight: 20, fontWeight: '700' },
  text: { flex: 1, fontSize: 13, color: '#444', lineHeight: 20 },
});

const EVENT_COLORS: Partial<Record<PlaybackEvent['type'], string>> = {
  ready: '#22c55e',
  play: '#22c55e',
  pause: '#f59e0b',
  seek: '#3b82f6',
  time_update: '#8b5cf6',
  ended: '#6b7280',
  error: '#ef4444',
  buffer_start: '#f59e0b',
  buffer_end: '#22c55e',
};

const EventRow = ({ event }: { event: PlaybackEvent }) => {
  const color = EVENT_COLORS[event.type] ?? '#6b7280';
  const detail =
    event.type === 'time_update' || event.type === 'ready'
      ? `${(event.position ?? 0).toFixed(1)} s`
      : event.type === 'error'
        ? (event.error?.message ?? 'unknown')
        : null;

  return (
    <View style={eventRowStyles.row}>
      <View style={[eventRowStyles.dot, { backgroundColor: color }]} />
      <Text style={eventRowStyles.type}>{event.type}</Text>
      {detail ? <Text style={eventRowStyles.detail}>{detail}</Text> : null}
    </View>
  );
};

const eventRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  type: { fontSize: 12, fontWeight: '600', color: '#11181C', minWidth: 110 },
  detail: { fontSize: 12, color: '#687076', flex: 1 },
});

/* ─── Main screen ────────────────────────────────────────────────────────────── */

const CoreDemoScreen = ({ onBack }: { onBack?: () => void } = {}) => {
  const [source, setSource] = useState<CorePlayerWithRefProps['source']>({ uri: VIDEO_URL });
  const [paused, setPaused] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [subtitlesActive, setSubtitlesActive] = useState(false);
  const [eventLog, setEventLog] = useState<PlaybackEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const videoRef = useRef<VideoRef | null>(null);
  const supportsSubtitles = SUBTITLE_SUPPORTED_PLATFORMS.has(Platform.OS);

  const handlePlaybackEvent = (event: PlaybackEvent) => {
    if (event.type === 'error') {
      setErrorMessage(event.error?.message ?? 'Unknown playback error');
    }

    if (event.type === 'time_update' || event.type === 'ready') {
      setPosition(event.position);
      setDuration(event.duration ?? 0);
    }

    setEventLog((prev) => [event, ...prev].slice(0, EVENT_LOG_MAX));
  };

  const resetPlaybackState = () => {
    setPaused(false);
    setPosition(0);
    setDuration(0);
    setSubtitlesActive(false);
    setEventLog([]);
    setErrorMessage(null);
  };

  const handlePlayMp4 = () => {
    resetPlaybackState();
    setSource({ uri: VIDEO_URL });
  };

  const handlePlayHls = () => {
    resetPlaybackState();
    setSource({ uri: HLS_URL });
  };

  const handlePlayWithSubtitles = () => {
    if (!supportsSubtitles) {
      resetPlaybackState();
      setSource({ uri: VIDEO_URL });
      return;
    }

    resetPlaybackState();
    setSubtitlesActive(true);
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
  };

  const handleSeekForward = () => {
    videoRef.current?.seek(position + 10);
  };

  const handleSeekBackward = () => {
    videoRef.current?.seek(Math.max(0, position - 10));
  };

  const handleToggleFullscreen = () => {
    videoRef.current?.presentFullscreenPlayer?.();
  };

  const progressPct = duration > 0 ? Math.min(1, position / duration) : 0;

  return (
    <SafeAreaView style={styles.container}>
      {onBack ? (
        <Pressable style={styles.backButton} onPress={onBack} testID="back-to-demos">
          <Text style={styles.backText}>← Demos</Text>
        </Pressable>
      ) : null}
      <ScrollView contentContainerStyle={styles.contentContainer}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>MamoPlayer Core</Text>
          <Text style={styles.subtitle}>Open-source player · Core feature showcase</Text>
        </View>

        {/* ── 1. Basic Playback ──────────────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionLabel index={1} title="Basic Playback" />
          <Text style={styles.cardDesc}>
            Load an MP4, an HLS stream, or a captioned source. The player resolves the format automatically.
          </Text>
          <View style={styles.buttonsRow}>
            <View style={styles.buttonContainer}>
              <Button title="Play MP4" onPress={handlePlayMp4} />
            </View>
            <View style={styles.buttonContainer}>
              <Button title="Play HLS" onPress={handlePlayHls} />
            </View>
          </View>
          <Button title="Play with Subtitles" onPress={handlePlayWithSubtitles} />
          {subtitlesActive && supportsSubtitles ? (
            <Text style={styles.noteText}>Subtitles are active (English).</Text>
          ) : null}
          {!supportsSubtitles ? (
            <Text style={styles.noteText}>Subtitles are not supported on this platform.</Text>
          ) : null}
          <Button
            title="Play Invalid Source"
            onPress={() => {
              resetPlaybackState();
              setSource({ uri: 'https://invalid.video' });
            }}
          />
        </View>

        {/* ── 2. Custom Timeline ─────────────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionLabel index={2} title="Custom Timeline" />
          <Text style={styles.cardDesc}>
            Built-in scrubber with chapter markers and thumbnail frame preview while dragging
            (when a thumbnail URI is configured via the <Text style={styles.inlineCode}>thumbnailUri</Text> prop).
          </Text>
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
          {/* Mini progress bar — mirrors the in-player scrubber position */}
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { flex: progressPct }]} />
              <View style={{ flex: Math.max(0, 1 - progressPct) }} />
            </View>
            <Text style={styles.progressLabel}>
              {Math.round(progressPct * 100)}%
            </Text>
          </View>
          {errorMessage ? (
            <Text style={styles.errorText}>Error: {errorMessage}</Text>
          ) : null}
        </View>

        {/* ── 3. Playback Options ────────────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionLabel index={3} title="Playback Options" />
          <Text style={styles.cardDesc}>
            The <Text style={styles.inlineCode}>{'<PlaybackOptions />'}</Text> component renders a standalone
            control bar — seek ±10 s, play/pause, and fullscreen.
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>POSITION</Text>
              <Text style={styles.statValue}>Position: {position.toFixed(2)}s</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>DURATION</Text>
              <Text style={styles.statValue}>Duration: {duration.toFixed(2)}s</Text>
            </View>
          </View>
          <PlaybackOptions
            isPlaying={!paused}
            onSeekBack={handleSeekBackward}
            onTogglePlayPause={() => setPaused((v) => !v)}
            onSeekForward={handleSeekForward}
            onToggleFullscreen={handleToggleFullscreen}
          />
        </View>

        {/* ── 4. Settings Overlay ────────────────────────────────────────────── */}
        <View style={styles.card} testID="settings-overlay-hints">
          <SectionLabel index={4} title="Settings Overlay" />
          <Text style={styles.cardDesc}>
            Tap the gear icon inside the player to open the slide-up settings sheet.
          </Text>
          <View style={styles.hintList}>
            <HintRow text="Tap the gear icon in the player to open the settings overlay." />
            <HintRow text="The core overlay exposes: playback speed (0.5×–2×) and mute toggle." />
            <HintRow text="Extra menu items and sections can be injected via the settingsOverlay prop." />
          </View>
        </View>

        {/* ── 5. OTT UX Features ─────────────────────────────────────────────── */}
        <View style={styles.card} testID="ott-ux-hints">
          <SectionLabel index={5} title="OTT UX Features" />
          <Text style={styles.cardDesc}>
            Tap and gesture interactions designed for TV-like viewing experiences.
          </Text>
          <View style={styles.hintList}>
            <HintRow text="Tap the video to show or hide controls." />
            <HintRow text="Double-tap the left side to seek back 10s." />
            <HintRow text="Double-tap the right side to seek forward 10s." />
            <HintRow text="Controls auto-hide after 3s of inactivity during playback." />
            <HintRow text="A spinner appears automatically when buffering occurs." />
          </View>
        </View>

        {/* ── 6. Debug Overlay ───────────────────────────────────────────────── */}
        <View style={styles.card} testID="debug-overlay-hints">
          <SectionLabel index={6} title="Debug Overlay" />
          <Text style={styles.cardDesc}>
            Inspect real-time playback internals during development — no extra tooling needed.
          </Text>
          <View style={styles.hintList}>
            <HintRow text="Two-finger triple-tap the player to toggle the debug overlay." />
            <HintRow text="While playing: watch position and buffered values update in real time." />
            <HintRow text={'While buffering: the state field shows "buffering" and rebuffer count increments.'} />
          </View>
        </View>

        {/* ── 7. Playback Events ─────────────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionLabel index={7} title="Playback Events" />
          <Text style={styles.cardDesc}>
            Every lifecycle transition emits a typed <Text style={styles.inlineCode}>PlaybackEvent</Text>.
            The last {EVENT_LOG_MAX} events are shown below.
          </Text>
          {eventLog.length === 0 ? (
            <Text style={styles.emptyLog}>No events yet — press Play to start.</Text>
          ) : (
            <View style={styles.eventList}>
              {eventLog.map((ev, i) => (
                <EventRow key={i} event={ev} />
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  contentContainer: {
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  /* Header */
  header: {
    gap: 4,
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
  inlineCode: {
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#f0f0f0',
    color: '#0a7ea4',
  },
  /* Source buttons */
  buttonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonContainer: {
    flex: 1,
  },
  noteText: {
    fontSize: 12,
    color: '#444',
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
  /* Progress bar */
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0a7ea4',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    color: '#687076',
    minWidth: 30,
    textAlign: 'right',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500',
  },
  /* Stats row */
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#f5f6f8',
    borderRadius: 10,
    overflow: 'hidden',
  },
  statBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9BA1A6',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
  },
  /* Hint list */
  hintList: {
    gap: 6,
  },
  /* Event log */
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
  /* Back button */
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
  },
});

export default CoreDemoScreen;
