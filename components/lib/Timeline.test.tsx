import Timeline from '@/components/lib/Timeline';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 30, bottom: 10, left: 6 }),
}));

jest.mock('@react-native-community/slider', () => {
  const React = require('react');
  const { Pressable, View } = require('react-native');
  const SliderMock = ({
    onSlidingStart,
    onValueChange,
    onSlidingComplete,
    accessibilityLabel,
  }: any) => (
    <View>
      <Pressable
        testID="slider-start"
        accessibilityLabel={accessibilityLabel ?? 'Playback position'}
        onPress={() => onSlidingStart?.()}
      />
      <Pressable testID="slider-change" onPress={() => onValueChange?.(42)} />
      <Pressable testID="slider-complete" onPress={() => onSlidingComplete?.(42)} />
    </View>
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
    const { getByTestId } = render(
      <Timeline
        isPlaying={false}
        player={{ currentTime: 10, duration: 100 }}
        duration={100}
        onSeek={onSeek}
      />,
    );

    fireEvent.press(getByTestId('slider-complete'));
    expect(onSeek).toHaveBeenCalledWith(42);
  });

  it('shows thumbnail overlay while scrubbing when thumbnails are provided', () => {
    const { getByTestId, getByProps, queryByProps } = render(
      <Timeline
        isPlaying={false}
        player={{ currentTime: 10, duration: 100 }}
        duration={100}
        thumbnails={{
          frames: [
            { time: 0, uri: 'thumb://0' },
            { time: 40, uri: 'thumb://40' },
          ],
        }}
        onSeek={jest.fn()}
      />,
    );

    fireEvent.press(getByTestId('slider-start'));
    fireEvent.press(getByTestId('slider-change'));

    expect(getByProps({ source: { uri: 'thumb://40' } })).toBeTruthy();

    fireEvent.press(getByTestId('slider-complete'));

    expect(queryByProps({ source: { uri: 'thumb://40' } })).toBeNull();
  });

  it('does not show thumbnail overlay while scrubbing without thumbnails', () => {
    const { getByTestId, queryByProps } = render(
      <Timeline
        isPlaying={false}
        player={{ currentTime: 10, duration: 100 }}
        duration={100}
        onSeek={jest.fn()}
      />,
    );

    fireEvent.press(getByTestId('slider-start'));
    fireEvent.press(getByTestId('slider-change'));

    expect(queryByProps({ source: { uri: 'thumb://40' } })).toBeNull();
  });
});
