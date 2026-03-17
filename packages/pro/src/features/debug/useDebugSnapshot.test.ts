import { renderHook } from '@testing-library/react-native';

import { useDebugSnapshot, type UseDebugSnapshotInput } from './useDebugSnapshot';

const BASE_INPUT: UseDebugSnapshotInput = {
  isPlaying: false,
  isBuffering: false,
  position: 0,
  duration: undefined,
  buffered: undefined,
  currentQualityId: 'auto',
  currentSubtitleTrackId: null,
  currentAudioTrackId: null,
  isAdPlaying: false,
  pipState: 'inactive',
  lastErrorMessage: undefined,
  rebufferCount: 0,
};

describe('useDebugSnapshot', () => {
  describe('playback state derivation', () => {
    it('returns "buffering" when isBuffering is true, regardless of isPlaying', () => {
      const { result } = renderHook(() =>
        useDebugSnapshot({ ...BASE_INPUT, isBuffering: true, isPlaying: true }),
      );

      expect(result.current.playbackState).toBe('buffering');
    });

    it('returns "playing" when isPlaying is true and isBuffering is false', () => {
      const { result } = renderHook(() =>
        useDebugSnapshot({ ...BASE_INPUT, isPlaying: true, isBuffering: false }),
      );

      expect(result.current.playbackState).toBe('playing');
    });

    it('returns "paused" when not playing and not buffering', () => {
      const { result } = renderHook(() =>
        useDebugSnapshot({ ...BASE_INPUT, isPlaying: false, isBuffering: false }),
      );

      expect(result.current.playbackState).toBe('paused');
    });
  });

  describe('playback values', () => {
    it('includes current position, duration, and buffered in the snapshot', () => {
      const { result } = renderHook(() =>
        useDebugSnapshot({
          ...BASE_INPUT,
          position: 90,
          duration: 300,
          buffered: 120,
        }),
      );

      expect(result.current.position).toBe(90);
      expect(result.current.duration).toBe(300);
      expect(result.current.buffered).toBe(120);
    });

    it('passes duration as undefined when not yet known', () => {
      const { result } = renderHook(() =>
        useDebugSnapshot({ ...BASE_INPUT, duration: undefined }),
      );

      expect(result.current.duration).toBeUndefined();
    });

    it('passes buffered as undefined when not yet known', () => {
      const { result } = renderHook(() =>
        useDebugSnapshot({ ...BASE_INPUT, buffered: undefined }),
      );

      expect(result.current.buffered).toBeUndefined();
    });
  });

  describe('current track selections', () => {
    it('maps currentQualityId to selectedQuality', () => {
      const { result } = renderHook(() =>
        useDebugSnapshot({ ...BASE_INPUT, currentQualityId: '1080p' }),
      );

      expect(result.current.selectedQuality).toBe('1080p');
    });

    it('maps currentSubtitleTrackId to selectedSubtitle', () => {
      const { result } = renderHook(() =>
        useDebugSnapshot({ ...BASE_INPUT, currentSubtitleTrackId: 'fr' }),
      );

      expect(result.current.selectedSubtitle).toBe('fr');
    });

    it('maps currentAudioTrackId to selectedAudioTrack', () => {
      const { result } = renderHook(() =>
        useDebugSnapshot({ ...BASE_INPUT, currentAudioTrackId: 'en-audio' }),
      );

      expect(result.current.selectedAudioTrack).toBe('en-audio');
    });

    it('maps null subtitle track ID to undefined', () => {
      const { result } = renderHook(() =>
        useDebugSnapshot({ ...BASE_INPUT, currentSubtitleTrackId: null }),
      );

      expect(result.current.selectedSubtitle).toBeUndefined();
    });

    it('maps null audio track ID to undefined', () => {
      const { result } = renderHook(() =>
        useDebugSnapshot({ ...BASE_INPUT, currentAudioTrackId: null }),
      );

      expect(result.current.selectedAudioTrack).toBeUndefined();
    });

    it('preserves "off" subtitle track ID as-is', () => {
      const { result } = renderHook(() =>
        useDebugSnapshot({ ...BASE_INPUT, currentSubtitleTrackId: 'off' }),
      );

      expect(result.current.selectedSubtitle).toBe('off');
    });
  });

  describe('diagnostics fields', () => {
    it('includes rebufferCount in the snapshot', () => {
      const { result } = renderHook(() =>
        useDebugSnapshot({ ...BASE_INPUT, rebufferCount: 3 }),
      );

      expect(result.current.rebufferCount).toBe(3);
    });

    it('includes lastErrorMessage in the snapshot', () => {
      const { result } = renderHook(() =>
        useDebugSnapshot({ ...BASE_INPUT, lastErrorMessage: 'Stream failed' }),
      );

      expect(result.current.lastErrorMessage).toBe('Stream failed');
    });

    it('passes isAdPlaying and pipState through to the snapshot', () => {
      const { result } = renderHook(() =>
        useDebugSnapshot({ ...BASE_INPUT, isAdPlaying: true, pipState: 'active' }),
      );

      expect(result.current.isAdPlaying).toBe(true);
      expect(result.current.pipState).toBe('active');
    });
  });

  describe('full snapshot (all fields together)', () => {
    it('produces a complete snapshot from a fully-populated input', () => {
      const input: UseDebugSnapshotInput = {
        isPlaying: true,
        isBuffering: false,
        position: 90,
        duration: 300,
        buffered: 120,
        currentQualityId: '720p',
        currentSubtitleTrackId: 'fr',
        currentAudioTrackId: 'en-audio',
        isAdPlaying: false,
        pipState: 'inactive',
        lastErrorMessage: undefined,
        rebufferCount: 2,
      };

      const { result } = renderHook(() => useDebugSnapshot(input));

      expect(result.current).toEqual({
        playbackState: 'playing',
        position: 90,
        duration: 300,
        buffered: 120,
        selectedQuality: '720p',
        selectedSubtitle: 'fr',
        selectedAudioTrack: 'en-audio',
        isBuffering: false,
        isAdPlaying: false,
        pipState: 'inactive',
        lastErrorMessage: undefined,
        rebufferCount: 2,
      });
    });
  });
});
