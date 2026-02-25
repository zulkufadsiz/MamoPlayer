import ProDemoScreen from '@/apps/example/ProDemoScreen';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('@mamoplayer/pro', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    ProMamoPlayer: ({ source }: { source: { uri: string } }) => (
      <Text testID="pro-player-source">{source.uri}</Text>
    ),
  };
});

describe('ProDemoScreen', () => {
  it('renders title, player source controls, and placeholders', () => {
    const { getByText, getAllByText } = render(<ProDemoScreen />);

    expect(getByText('MamoPlayer Pro Demo')).toBeTruthy();
    expect(getByText('MP4 Source')).toBeTruthy();
    expect(getByText('HLS Source (m3u8)')).toBeTruthy();
    expect(getByText('Analytics')).toBeTruthy();
    expect(getByText('Ads')).toBeTruthy();
    expect(getByText('Watermark')).toBeTruthy();
    expect(getAllByText('Coming soon')).toHaveLength(3);
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
});
