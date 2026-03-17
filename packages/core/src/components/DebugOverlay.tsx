import React from 'react';
import { GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';

export interface DebugInfo {
  playbackState: string;
  position: number;
  duration: number;
  buffered: number | undefined;
  rebufferCount: number;
  lastError: string | undefined;
  quality?: string;
  audioTrack?: string;
  subtitleTrack?: string;
  adState?: string;
}

interface DebugOverlayProps {
  info: DebugInfo;
  /** When provided, overrides the internal two-finger-tap toggle to show/hide the panel. */
  visible?: boolean;
  /** Called when the user taps the close button. Only rendered when this callback is provided. */
  onClose?: () => void;
  /**
   * Called when the two-finger triple-tap gesture fires and `visible` is
   * controlled externally. Ignored in uncontrolled mode (no `visible` prop).
   * Use this to delegate toggle logic to the parent when the overlay
   * visibility is managed outside the component.
   */
  onToggle?: () => void;
}

const TRIPLE_TAP_WINDOW_MS = 700;

const formatTime = (seconds: number): string => {
  const s = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

interface RowProps {
  label: string;
  value: string;
  error?: boolean;
}

const Row: React.FC<RowProps> = ({ label, value, error }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, error === true && styles.rowValueError]} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

/**
 * Developer debug overlay. Toggle visibility with a two-finger triple tap
 * anywhere on the player surface.
 */
export const DebugOverlay: React.FC<DebugOverlayProps> = ({ info, visible: controlledVisible, onClose, onToggle }) => {
  const [internalVisible, setInternalVisible] = React.useState(false);
  const tapTimesRef = React.useRef<number[]>([]);
  const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible;

  const onToggleRef = React.useRef(onToggle);
  onToggleRef.current = onToggle;

  const recordTwoFingerTap = React.useCallback(() => {
    const now = Date.now();
    const recent = tapTimesRef.current.filter((t) => now - t < TRIPLE_TAP_WINDOW_MS);
    recent.push(now);
    tapTimesRef.current = recent;

    if (recent.length >= 3) {
      tapTimesRef.current = [];
      if (controlledVisible === undefined) {
        setInternalVisible((prev) => !prev);
      } else {
        onToggleRef.current?.();
      }
    }
  }, [controlledVisible]);

  /**
   * Only claim the responder when 2+ fingers are on screen so single-finger
   * gestures (play/pause, seek double-tap) are not affected.
   */
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

  return (
    <View
      style={StyleSheet.absoluteFillObject}
      onStartShouldSetResponder={onStartShouldSetResponder}
      onResponderGrant={onResponderGrant}
    >
      {isVisible ? (
        <View style={styles.panel} pointerEvents={onClose ? 'box-none' : 'none'}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Debug</Text>
            {onClose ? (
              <Pressable
                onPress={onClose}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close debug overlay"
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            ) : null}
          </View>
          <Row label="State" value={info.playbackState} />
          <Row
            label="Position"
            value={`${formatTime(info.position)} / ${formatTime(info.duration)}`}
          />
          <Row
            label="Buffered"
            value={info.buffered != null ? formatTime(info.buffered) : '—'}
          />
          <Row label="Quality" value={info.quality ?? '—'} />
          <Row label="Audio" value={info.audioTrack ?? '—'} />
          <Row label="Subtitles" value={info.subtitleTrack ?? '—'} />
          <Row label="Rebuffers" value={String(info.rebufferCount)} />
          <Row label="Ad state" value={info.adState ?? '—'} />
          {info.lastError != null ? (
            <Row label="Last error" value={info.lastError} error />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.80)',
    borderRadius: 8,
    padding: 10,
    minWidth: 220,
    maxWidth: 300,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    color: '#FACC15',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  closeButton: {
    padding: 2,
  },
  closeButtonText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  rowLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    flex: 1,
  },
  rowValue: {
    color: '#F9FAFB',
    fontSize: 10,
    flex: 2,
    textAlign: 'right',
  },
  rowValueError: {
    color: '#F87171',
  },
});
