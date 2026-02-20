import Timeline from '@/components/lib/Timeline';
import { act, fireEvent, render } from '@testing-library/react-native';

const mockGetThumbnailAsync = jest.fn();

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 30, bottom: 10, left: 6 }),
}));

jest.mock('expo-video-thumbnails', () => ({
  getThumbnailAsync: (...args: unknown[]) => mockGetThumbnailAsync(...args),
}));

jest.mock('@react-native-community/slider', () => {
  const React = require('react');
  const { Pressable } = require('react-native');
  const SliderMock = ({
    onSlidingStart,
    onValueChange,
    onSlidingComplete,
    accessibilityLabel,
  }: any) => (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? 'Playback position'}
      onPress={() => {
        onSlidingStart?.();
        onValueChange?.(42);
        onSlidingComplete?.(42);
      }}
    />
  );
  SliderMock.displayName = 'SliderMock';
  return SliderMock;
});

describe('Timeline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('formats and renders current/duration times', () => {
    const { getByText } = render(
      <Timeline
        isPlaying={false}
        player={{ currentTime: 65, duration: 3605 }}
        duration={3605}
        onSeek={jest.fn()}
      />,
    );

    expect(getByText('00:00:00')).toBeTruthy();
    expect(getByText('01:00:05')).toBeTruthy();
  });

  it('calls onSeek when slider interaction completes', () => {
    const onSeek = jest.fn();
    const { getByLabelText } = render(
      <Timeline
        isPlaying={false}
        player={{ currentTime: 10, duration: 100 }}
        duration={100}
        onSeek={onSeek}
      />,
    );

    fireEvent.press(getByLabelText('Playback position'));
    expect(onSeek).toHaveBeenCalledWith(42);
  });

  it('requests thumbnails when mediaUrl exists and user seeks', async () => {
    jest.useFakeTimers();
    mockGetThumbnailAsync.mockResolvedValue({ uri: 'thumb://1' });

    const { getByLabelText } = render(
      <Timeline
        isPlaying={false}
        player={{ currentTime: 10, duration: 100 }}
        duration={100}
        mediaUrl="https://example.com/video.mp4"
        onSeek={jest.fn()}
      />,
    );

    fireEvent.press(getByLabelText('Playback position'));

    await act(async () => {
      jest.advanceTimersByTime(100);
      await Promise.resolve();
    });

    expect(mockGetThumbnailAsync).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
