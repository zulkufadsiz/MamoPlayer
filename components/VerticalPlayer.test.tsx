import VerticalPlayer from '@/components/VerticalPlayer';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

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
  const IoniconsMock = ({ name }: { name: string }) => <Text>{name}</Text>;
  IoniconsMock.displayName = 'IoniconsMock';
  return {
    Ionicons: IoniconsMock,
  };
});

jest.mock('expo', () => ({
  useEventListener: jest.fn(),
}));

jest.mock('expo-screen-orientation', () => ({
  lockAsync: jest.fn(() => Promise.resolve()),
  unlockAsync: jest.fn(() => Promise.resolve()),
  OrientationLock: {
    PORTRAIT_UP: 'PORTRAIT_UP',
  },
}));

jest.mock('expo-video', () => {
  const React = require('react');
  const { View } = require('react-native');
  const VideoViewMock = () => <View accessibilityLabel="video-view" />;
  VideoViewMock.displayName = 'VideoViewMock';
  return {
    VideoView: VideoViewMock,
    useVideoPlayer: jest.fn((_source: unknown, setup: (player: typeof mockPlayer) => void) => {
      setup?.(mockPlayer);
      return mockPlayer;
    }),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const SafeAreaViewMock = ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
  SafeAreaViewMock.displayName = 'SafeAreaViewMock';
  return {
    SafeAreaView: SafeAreaViewMock,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

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

jest.mock('@/components/lib/SettingsDialog', () => {
  const React = require('react');
  const { View } = require('react-native');
  const SettingsDialogMock = ({ visible }: { visible: boolean }) => (
    <View accessibilityLabel={visible ? 'settings-open' : 'settings-closed'} />
  );
  SettingsDialogMock.displayName = 'SettingsDialogMock';
  return SettingsDialogMock;
});

jest.mock('@/components/lib/CommentsSheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  const CommentsSheetMock = ({ visible }: { visible: boolean }) => (
    <View accessibilityLabel={visible ? 'comments-open' : 'comments-closed'} />
  );
  CommentsSheetMock.displayName = 'CommentsSheetMock';
  return CommentsSheetMock;
});

describe('VerticalPlayer', () => {
  const source = { uri: 'https://example.com/video.m3u8' };

  const flushAsyncState = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  it('renders and opens settings and comments overlays', async () => {
    const { getByLabelText } = render(
      <VerticalPlayer source={source} title="Demo" description="Desc" />,
    );

    await flushAsyncState();

    fireEvent.press(getByLabelText('Open settings'));
    fireEvent.press(getByLabelText('Open comments'));

    expect(getByLabelText('settings-open')).toBeTruthy();
    expect(getByLabelText('comments-open')).toBeTruthy();
  });
});
