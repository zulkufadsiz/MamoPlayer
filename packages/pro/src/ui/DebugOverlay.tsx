import React from 'react';
import { GestureResponderEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { DebugSnapshot } from '../types/debug';

const TRIPLE_TAP_WINDOW_MS = 700;

export interface DebugOverlayProps {
  visible: boolean;
  snapshot: DebugSnapshot;
  onClose?: () => void;
  /**
   * Called when a two-finger triple-tap gesture fires. Use this to toggle
   * overlay visibility from the parent component.
   */
  onToggle?: () => void;
}

function fmt(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return '—';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return value.toFixed(2);
  return value;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')} (${seconds.toFixed(2)}s)`;
}

interface RowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function Row({ label, value, highlight = false }: RowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, highlight && styles.valueHighlight]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function DebugOverlay({ visible, snapshot, onClose, onToggle }: DebugOverlayProps) {
  const tapTimesRef = React.useRef<number[]>([]);
  const onToggleRef = React.useRef(onToggle);
  onToggleRef.current = onToggle;

  const recordTwoFingerTap = React.useCallback(() => {
    const now = Date.now();
    const recent = tapTimesRef.current.filter((t) => now - t < TRIPLE_TAP_WINDOW_MS);
    recent.push(now);
    tapTimesRef.current = recent;
    if (recent.length >= 3) {
      tapTimesRef.current = [];
      onToggleRef.current?.();
    }
  }, []);

  const onStartShouldSetResponder = React.useCallback(
    (evt: GestureResponderEvent) => evt.nativeEvent.touches.length >= 2,
    [],
  );

  const onResponderGrant = React.useCallback(
    (evt: GestureResponderEvent) => {
      if (evt.nativeEvent.touches.length >= 2) {
        recordTwoFingerTap();
      }
    },
    [recordTwoFingerTap],
  );

  if (!visible) {
    return (
      <View
        style={StyleSheet.absoluteFillObject}
        onStartShouldSetResponder={onStartShouldSetResponder}
        onResponderGrant={onResponderGrant}
        pointerEvents="box-none"
      />
    );
  }

  return (
    <View
      style={styles.container}
      onStartShouldSetResponder={onStartShouldSetResponder}
      onResponderGrant={onResponderGrant}
      pointerEvents="box-none"
    >
      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>DEBUG</Text>
          {onClose ? (
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Fields */}
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Row label="state" value={fmt(snapshot.playbackState)} />
          <Row
            label="position"
            value={formatTime(snapshot.position)}
          />
          <Row
            label="duration"
            value={snapshot.duration !== undefined ? formatTime(snapshot.duration) : '—'}
          />
          <Row
            label="buffered"
            value={snapshot.buffered !== undefined ? formatTime(snapshot.buffered) : '—'}
          />
          <Row label="quality" value={fmt(snapshot.selectedQuality)} />
          <Row label="subtitle" value={fmt(snapshot.selectedSubtitle)} />
          <Row label="audio" value={fmt(snapshot.selectedAudioTrack)} />
          <Row label="buffering" value={fmt(snapshot.isBuffering)} highlight={snapshot.isBuffering} />
          <Row label="ad playing" value={fmt(snapshot.isAdPlaying)} highlight={snapshot.isAdPlaying} />
          <Row label="pip" value={fmt(snapshot.pipState)} />
          <Row label="rebuffers" value={fmt(snapshot.rebufferCount)} highlight={(snapshot.rebufferCount ?? 0) > 0} />
          {snapshot.lastErrorMessage ? (
            <Row label="last error" value={snapshot.lastErrorMessage} highlight />
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

const PANEL_BG = 'rgba(0, 0, 0, 0.78)';
const BORDER_COLOR = 'rgba(255, 255, 255, 0.12)';
const TEXT_PRIMARY = '#e8e8e8';
const TEXT_LABEL = '#8a8a9a';
const TEXT_HIGHLIGHT = '#ff6b6b';
const TITLE_COLOR = '#ffffff';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    zIndex: 999,
  },
  panel: {
    margin: 8,
    width: 240,
    maxHeight: 340,
    backgroundColor: PANEL_BG,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  title: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: TITLE_COLOR,
    fontFamily: 'monospace',
  },
  closeButton: {
    paddingHorizontal: 4,
  },
  closeText: {
    fontSize: 11,
    color: TEXT_LABEL,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  label: {
    width: 72,
    fontSize: 10,
    color: TEXT_LABEL,
    fontFamily: 'monospace',
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: TEXT_PRIMARY,
    fontFamily: 'monospace',
  },
  valueHighlight: {
    color: TEXT_HIGHLIGHT,
  },
});
