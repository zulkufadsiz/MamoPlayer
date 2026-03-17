
import { render } from '@testing-library/react-native';

import type { DebugSnapshot } from '../types/debug';
import { DebugOverlay } from './DebugOverlay';

const BASE_SNAPSHOT: DebugSnapshot = {
  playbackState: 'playing',
  position: 30,
  duration: 120,
  buffered: 60,
  selectedQuality: '1080p',
  selectedSubtitle: 'en',
  selectedAudioTrack: 'en-audio',
  isBuffering: false,
  isAdPlaying: false,
  pipState: 'inactive',
  rebufferCount: 0,
  lastErrorMessage: undefined,
};

describe('DebugOverlay', () => {
  describe('visibility', () => {
    it('renders the debug panel header when visible is true', () => {
      const { getByText } = render(<DebugOverlay visible snapshot={BASE_SNAPSHOT} />);

      expect(getByText('DEBUG')).toBeTruthy();
    });

    it('renders nothing when visible is false', () => {
      const { queryByText } = render(<DebugOverlay visible={false} snapshot={BASE_SNAPSHOT} />);

      expect(queryByText('DEBUG')).toBeNull();
    });

    it('renders field labels when visible is true', () => {
      const { getByText } = render(<DebugOverlay visible snapshot={BASE_SNAPSHOT} />);

      expect(getByText('state')).toBeTruthy();
      expect(getByText('position')).toBeTruthy();
      expect(getByText('quality')).toBeTruthy();
      expect(getByText('rebuffers')).toBeTruthy();
    });
  });

  describe('snapshot field rendering', () => {
    it('displays the playback state value', () => {
      const { getByText } = render(<DebugOverlay visible snapshot={BASE_SNAPSHOT} />);

      expect(getByText('playing')).toBeTruthy();
    });

    it('displays the selected quality', () => {
      const snapshot = { ...BASE_SNAPSHOT, selectedQuality: '720p' };
      const { getByText } = render(<DebugOverlay visible snapshot={snapshot} />);

      expect(getByText('720p')).toBeTruthy();
    });

    it('displays the rebuffer count', () => {
      const snapshot = { ...BASE_SNAPSHOT, rebufferCount: 4 };
      const { getByText } = render(<DebugOverlay visible snapshot={snapshot} />);

      expect(getByText('4.00')).toBeTruthy();
    });

    it('shows last error row when lastErrorMessage is set', () => {
      const snapshot = { ...BASE_SNAPSHOT, lastErrorMessage: 'Network timeout' };
      const { getByText } = render(<DebugOverlay visible snapshot={snapshot} />);

      expect(getByText('last error')).toBeTruthy();
      expect(getByText('Network timeout')).toBeTruthy();
    });

    it('omits last error row when lastErrorMessage is undefined', () => {
      const { queryByText } = render(<DebugOverlay visible snapshot={BASE_SNAPSHOT} />);

      expect(queryByText('last error')).toBeNull();
    });
  });

  describe('close button', () => {
    it('renders close button when onClose prop is provided', () => {
      const onClose = jest.fn();
      const { getByText } = render(
        <DebugOverlay visible snapshot={BASE_SNAPSHOT} onClose={onClose} />,
      );

      expect(getByText('✕')).toBeTruthy();
    });

    it('omits close button when onClose prop is absent', () => {
      const { queryByText } = render(<DebugOverlay visible snapshot={BASE_SNAPSHOT} />);

      expect(queryByText('✕')).toBeNull();
    });
  });
});
