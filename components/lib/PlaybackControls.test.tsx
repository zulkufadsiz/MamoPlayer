import PlaybackControls from '@/components/lib/PlaybackControls';
import { act, fireEvent, render } from '@testing-library/react-native';

jest.mock('@/components/lib/Timeline', () => {
  const React = require('react');
  const { View } = require('react-native');
  const TimelineMock = ({ duration }: { duration: number }) => (
    <View accessibilityLabel={`timeline-${duration}`} />
  );
  TimelineMock.displayName = 'TimelineMock';
  return TimelineMock;
});

jest.mock(
  'react-native-safe-area-context',
  () => ({
    useSafeAreaInsets: () => ({ top: 10, right: 20, bottom: 30, left: 0 }),
  }),
  { virtual: true },
);

jest.mock(
  'react-native',
  () => {
    const React = require('react');
    const { Text } = require('react-native');

    const IconMock = ({ name }: { name: string }) => <Text>{name}</Text>;

    return {
      Ionicons: IconMock,
      MaterialIcons: IconMock,
    };
  },
  { virtual: true },
);

describe('PlaybackControls', () => {
  const baseProps = {
    isPlaying: false,
    player: { currentTime: 0, duration: 120 },
    duration: 120,
    onPlayPause: jest.fn(),
    onSeek: jest.fn(),
    isFullscreen: false,
    onFullscreenChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onPlayPause when play button is pressed', () => {
    const onPlayPause = jest.fn();
    const { getByLabelText } = render(
      <PlaybackControls {...baseProps} onPlayPause={onPlayPause} />,
    );

    fireEvent.press(getByLabelText('Play video'));
    expect(onPlayPause).toHaveBeenCalledTimes(1);
  });

  it('toggles fullscreen through fullscreen button', () => {
    const onFullscreenChange = jest.fn();
    const { getByLabelText, rerender } = render(
      <PlaybackControls
        {...baseProps}
        isFullscreen={false}
        onFullscreenChange={onFullscreenChange}
      />,
    );

    fireEvent.press(getByLabelText('Enter fullscreen'));
    expect(onFullscreenChange).toHaveBeenCalledWith(true);

    rerender(
      <PlaybackControls
        {...baseProps}
        isFullscreen={true}
        onFullscreenChange={onFullscreenChange}
      />,
    );

    fireEvent.press(getByLabelText('Exit fullscreen'));
    expect(onFullscreenChange).toHaveBeenCalledWith(false);
  });

  it('renders active subtitle based on player current time', () => {
    jest.useFakeTimers();
    const { getByText } = render(
      <PlaybackControls
        {...baseProps}
        subtitles={[
          { start: '00:00:00', end: '00:00:05', text: 'Hello subtitle' },
          { start: '00:00:06', end: '00:00:08', text: 'Other subtitle' },
        ]}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(getByText('Hello subtitle')).toBeTruthy();
    jest.useRealTimers();
  });

  it('auto-hides controls and shows again when tapping overlay', () => {
    jest.useFakeTimers();
    const { queryByLabelText, getByLabelText } = render(
      <PlaybackControls {...baseProps} isPlaying={true} autoHideControls autoHideDelayMs={100} />,
    );

    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(queryByLabelText('Enter fullscreen')).toBeNull();

    fireEvent.press(getByLabelText('Show playback controls'));
    expect(queryByLabelText('Enter fullscreen')).toBeTruthy();

    jest.useRealTimers();
  });

  it('hides secondary controls in compact layout', () => {
    const { queryByLabelText } = render(
      <PlaybackControls
        {...baseProps}
        layoutVariant="compact"
        onSkipBackward={jest.fn()}
        onSkipForward={jest.fn()}
        onSettingsPress={jest.fn()}
        allowsPictureInPicture
        onPictureInPictureToggle={jest.fn()}
      />,
    );

    expect(queryByLabelText('Skip backward 10 seconds')).toBeNull();
    expect(queryByLabelText('Skip forward 10 seconds')).toBeNull();
    expect(queryByLabelText('Open settings')).toBeNull();
    expect(queryByLabelText('Enter picture in picture')).toBeNull();
    expect(queryByLabelText('Enter fullscreen')).toBeTruthy();
  });

  it('shows detailed controls in ott layout', () => {
    const { getByLabelText, getByText } = render(
      <PlaybackControls
        {...baseProps}
        layoutVariant="ott"
        onSkipBackward={jest.fn()}
        onSkipForward={jest.fn()}
        onSettingsPress={jest.fn()}
        onSubtitlesToggle={jest.fn()}
        hasSubtitles
        allowsPictureInPicture
        onPictureInPictureToggle={jest.fn()}
      />,
    );

    expect(getByLabelText('Skip backward 10 seconds')).toBeTruthy();
    expect(getByLabelText('Skip forward 10 seconds')).toBeTruthy();
    expect(getByLabelText('Open settings')).toBeTruthy();
    expect(getByLabelText('Enter picture in picture')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
    expect(getByText('Subtitles')).toBeTruthy();
    expect(getByText('PiP')).toBeTruthy();
    expect(getByText('Fullscreen')).toBeTruthy();
  });
});
