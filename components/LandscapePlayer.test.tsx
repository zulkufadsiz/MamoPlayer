import LandscapePlayer from '@/components/LandscapePlayer';
import { act, fireEvent, render } from '@testing-library/react-native';

const mockPlayer = {
  currentTime: 0,
  duration: 120,
  play: jest.fn(),
  pause: jest.fn(),
  loop: false,
  volume: 1,
  playbackRate: 1,
};

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
    MaterialIcons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

jest.mock('@react-native-community/slider', () => {
  const React = require('react');
  const { View } = require('react-native');
  const SliderMock = ({ accessibilityLabel }: { accessibilityLabel?: string }) => (
    <View accessibilityLabel={accessibilityLabel || 'slider'} />
  );
  SliderMock.displayName = 'SliderMock';
  return SliderMock;
});

jest.mock('expo', () => ({
  useEventListener: jest.fn(),
}));

jest.mock('expo-screen-orientation', () => ({
  lockAsync: jest.fn(() => Promise.resolve()),
  unlockAsync: jest.fn(() => Promise.resolve()),
  OrientationLock: {
    LANDSCAPE: 'LANDSCAPE',
    PORTRAIT_UP: 'PORTRAIT_UP',
  },
}));

jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    VideoView: () => <View accessibilityLabel="video-view" />,
    isPictureInPictureSupported: jest.fn(() => false),
    useVideoPlayer: jest.fn((_source: unknown, setup: (player: typeof mockPlayer) => void) => {
      setup?.(mockPlayer);
      return mockPlayer;
    }),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@/components/lib/playbackAnalytics', () => ({
  trackPlaybackEvent: jest.fn(),
}));

jest.mock('@/components/lib/playbackPositionStore', () => ({
  getPlaybackPosition: jest.fn(() => Promise.resolve(null)),
  savePlaybackPosition: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/components/lib/useTransportControls', () => ({
  useTransportControls: jest.fn(),
}));

jest.mock('@/components/lib/LoadingIndicator', () => {
  const React = require('react');
  const { View } = require('react-native');
  const LoadingIndicatorMock = () => <View accessibilityLabel="loading-indicator" />;
  LoadingIndicatorMock.displayName = 'LoadingIndicatorMock';
  return LoadingIndicatorMock;
});

jest.mock('@/components/lib/LandscapeSettingsDialog', () => {
  const React = require('react');
  const { View } = require('react-native');
  const LandscapeSettingsDialogMock = ({ visible }: { visible: boolean }) => (
    <View accessibilityLabel={visible ? 'landscape-settings-open' : 'landscape-settings-closed'} />
  );
  LandscapeSettingsDialogMock.displayName = 'LandscapeSettingsDialogMock';
  return LandscapeSettingsDialogMock;
});

describe('LandscapePlayer', () => {
  const source = { uri: 'https://example.com/video.m3u8' };

  const flushAsyncState = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  it('renders and opens landscape settings', async () => {
    const { getByLabelText } = render(<LandscapePlayer source={source} title="Episode 1" />);

    await flushAsyncState();

    fireEvent.press(getByLabelText('Open settings'), {
      stopPropagation: jest.fn(),
    });

    expect(getByLabelText('landscape-settings-open')).toBeTruthy();
  });
});
