import ProDemoScreen from '@/apps/example/ProDemoScreen';
import { act, fireEvent, render } from '@testing-library/react-native';

type MockProMamoPlayerProps = {
  source: { uri: string };
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
});
