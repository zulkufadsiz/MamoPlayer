import ProDemoScreen from '@/apps/example/ProDemoScreen';
import { act, fireEvent, render } from '@testing-library/react-native';

type MockProMamoPlayerProps = {
  source: { uri: string };
  controls?: { autoHide?: boolean; autoHideDelay?: number };
  gestures?: { doubleTapSeek?: boolean };
  layoutVariant?: string;
  ads?: {
    adBreaks?: Array<{ source?: { uri?: string } }>;
  };
  analytics?: {
    onEvent?: (event: {
      type: string;
      timestamp: number;
      position: number;
      errorMessage?: string;
    }) => void;
  };
  onPlaybackEvent?: (event: {
    type: string;
    error?: unknown;
  }) => void;
  debug?: { enabled?: boolean };
};

let latestProMamoPlayerProps: MockProMamoPlayerProps | undefined;

jest.mock('@mamoplayer/pro', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    ProMamoPlayer: (props: MockProMamoPlayerProps) => {
      latestProMamoPlayerProps = props;
      return <Text testID="pro-player-source">{props.source.uri}</Text>;
    },
  };
});

describe('ProDemoScreen', () => {
  beforeEach(() => {
    latestProMamoPlayerProps = undefined;
  });

  it('renders title, player source controls, and placeholders', () => {
    const { getByText } = render(<ProDemoScreen />);

    expect(getByText('MamoPlayer Pro Demo')).toBeTruthy();
    expect(getByText('MP4 Source')).toBeTruthy();
    expect(getByText('HLS Source (m3u8)')).toBeTruthy();
    expect(getByText('Play Invalid Main Source')).toBeTruthy();
    expect(getByText('Play Invalid Ad Source')).toBeTruthy();
    expect(getByText('Analytics (last 10 events)')).toBeTruthy();
    expect(getByText('Ads')).toBeTruthy();
    expect(getByText('Watermark')).toBeTruthy();
    expect(getByText('No events yet')).toBeTruthy();
  });

  it('switches between MP4 and HLS sources', () => {
    const { getByText, getByTestId } = render(<ProDemoScreen />);

    expect(getByTestId('pro-player-source').props.children).toBe(
      'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    );

    fireEvent.press(getByText('HLS Source (m3u8)'));
    expect(getByTestId('pro-player-source').props.children).toBe(
      'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    );

    fireEvent.press(getByText('MP4 Source'));
    expect(getByTestId('pro-player-source').props.children).toBe(
      'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    );
  });

  it('applies invalid main and ad source scenarios', () => {
    const { getByText, getByTestId } = render(<ProDemoScreen />);

    fireEvent.press(getByText('Play Invalid Main Source'));
    expect(getByTestId('pro-player-source').props.children).toBe('https://invalid-main.m3u8');

    fireEvent.press(getByText('Play Invalid Ad Source'));
    const adUris =
      latestProMamoPlayerProps?.ads?.adBreaks?.map((adBreak) => adBreak.source?.uri) ?? [];
    expect(adUris).toContain('https://not-found-ad.mp4');
  });

  it('shows error banner when analytics emits an error event', () => {
    const { getByText } = render(<ProDemoScreen />);

    act(() => {
      latestProMamoPlayerProps?.analytics?.onEvent?.({
        type: 'ad_error',
        timestamp: Date.now(),
        position: 0,
        errorMessage: 'Ad request failed',
      });
    });

    expect(getByText('Error occurred: Ad request failed')).toBeTruthy();
  });

  it('shows error banner when playback emits an error event', () => {
    const { getByText } = render(<ProDemoScreen />);

    act(() => {
      latestProMamoPlayerProps?.onPlaybackEvent?.({
        type: 'error',
        error: { message: 'Main stream failed' },
      });
    });

    expect(getByText('Error occurred: Main stream failed')).toBeTruthy();
  });

  it('renders the OTT UX features hints section', () => {
    const { getByTestId, getByText } = render(<ProDemoScreen />);

    expect(getByTestId('ott-ux-hints')).toBeTruthy();
    expect(getByText('OTT UX Features')).toBeTruthy();
    expect(getByText('Tap the video to show or hide controls.')).toBeTruthy();
    expect(getByText('Double-tap the left side to seek back 10s.')).toBeTruthy();
    expect(getByText('Double-tap the right side to seek forward 10s.')).toBeTruthy();
    expect(
      getByText('Scrub the timeline to see thumbnail frame previews and the current time.'),
    ).toBeTruthy();
    expect(getByText('Controls auto-hide after 3s of inactivity during playback.')).toBeTruthy();
    expect(getByText('A spinner appears automatically when buffering occurs.')).toBeTruthy();
  });

  it('passes auto-hide controls config to the player', () => {
    render(<ProDemoScreen />);

    expect(latestProMamoPlayerProps?.controls?.autoHide).toBe(true);
    expect(latestProMamoPlayerProps?.controls?.autoHideDelay).toBe(3000);
  });

  it('passes double-tap seek gesture config to the player', () => {
    render(<ProDemoScreen />);

    expect(latestProMamoPlayerProps?.gestures?.doubleTapSeek).toBe(true);
  });

  it('uses ott layoutVariant when ott theme is selected (default)', () => {
    render(<ProDemoScreen />);

    expect(latestProMamoPlayerProps?.layoutVariant).toBe('ott');
  });

  it('switches to standard layoutVariant when a non-ott theme is selected', () => {
    const { getByText } = render(<ProDemoScreen />);

    fireEvent.press(getByText('Light'));
    expect(latestProMamoPlayerProps?.layoutVariant).toBe('standard');

    fireEvent.press(getByText('Dark'));
    expect(latestProMamoPlayerProps?.layoutVariant).toBe('standard');

    fireEvent.press(getByText('OTT'));
    expect(latestProMamoPlayerProps?.layoutVariant).toBe('ott');
  });

  it('passes debug.enabled=true to the player', () => {
    render(<ProDemoScreen />);

    expect(latestProMamoPlayerProps?.debug?.enabled).toBe(true);
  });

  it('renders the debug overlay hints section', () => {
    const { getByTestId, getByText } = render(<ProDemoScreen />);

    expect(getByTestId('debug-overlay-hints')).toBeTruthy();
    expect(getByText('Developer Debug Overlay')).toBeTruthy();
    expect(getByText('Two-finger triple-tap the player to toggle the debug overlay.')).toBeTruthy();
    expect(getByText('While playing: watch position and buffered values update in real time.')).toBeTruthy();
    expect(getByText('While buffering: the state field shows "buffering" and rebuffer count increments.')).toBeTruthy();
    expect(getByText('While switching tracks: quality, audio, and subtitle fields update immediately.')).toBeTruthy();
    expect(getByText('While an ad plays: the ad playing field is highlighted and ad state shows "playing".')).toBeTruthy();
  });
});
