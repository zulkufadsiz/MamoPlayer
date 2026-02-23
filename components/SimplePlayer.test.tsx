import SimplePlayer from '@/components/SimplePlayer';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Modal } from 'react-native';

const mockLockAsync = jest.fn(() => Promise.resolve());
const mockSavePlaybackPosition = jest.fn();
const mockGetPlaybackPosition = jest.fn();

const mockPlayer = {
  currentTime: 0,
  duration: 120,
  play: jest.fn(),
  pause: jest.fn(),
  loop: false,
  volume: 0,
  playbackRate: 1,
};

jest.mock('react-native', () => ({
  OrientationLock: {
    LANDSCAPE: 'LANDSCAPE',
    PORTRAIT_UP: 'PORTRAIT_UP',
  },
  lockAsync: (...args: unknown[]) => mockLockAsync(...args),
  unlockAsync: jest.fn(),
}));

jest.mock('react-native-video', () => {
  const React = require('react');
  const { View } = require('react-native');

  const VideoView = React.forwardRef((_props: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      startPictureInPicture: jest.fn(),
      stopPictureInPicture: jest.fn(),
    }));
    return <View accessibilityLabel="video-view" />;
  });
  VideoView.displayName = 'VideoViewMock';

  return {
    VideoView,
    isPictureInPictureSupported: jest.fn(() => true),
    useVideoPlayer: jest.fn(() => mockPlayer),
  };
});

jest.mock('@/components/lib/playbackPositionStore', () => ({
  savePlaybackPosition: (...args: unknown[]) => mockSavePlaybackPosition(...args),
  getPlaybackPosition: (...args: unknown[]) => mockGetPlaybackPosition(...args),
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

jest.mock('@/components/lib/SettingsDialog', () => ({
  __esModule: true,
  default: function SettingsDialogMock({ visible }: { visible: boolean }) {
    const React = require('react');
    const { View } = require('react-native');
    return <View accessibilityLabel={visible ? 'settings-open' : 'settings-closed'} />;
  },
}));

jest.mock('@/components/lib/PlaybackControls', () => ({
  __esModule: true,
  default: function PlaybackControlsMock({
    onFullscreenChange,
    isFullscreen,
    onSettingsPress,
  }: any) {
    const React = require('react');
    const { Pressable, Text, View } = require('react-native');
    return (
      <View>
        <Pressable
          accessibilityLabel="toggle-fullscreen"
          onPress={() => onFullscreenChange(!isFullscreen)}
        >
          <Text>toggle</Text>
        </Pressable>
        <Pressable accessibilityLabel="open-settings" onPress={onSettingsPress}>
          <Text>settings</Text>
        </Pressable>
        <Text>{isFullscreen ? 'fullscreen-on' : 'fullscreen-off'}</Text>
      </View>
    );
  },
}));

describe('SimplePlayer', () => {
  const flushAsyncState = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLockAsync.mockResolvedValue(undefined);
    mockGetPlaybackPosition.mockResolvedValue(null);
    mockSavePlaybackPosition.mockResolvedValue(undefined);
  });

  it('opens fullscreen modal when fullscreen toggle is pressed', async () => {
    const { getByLabelText, UNSAFE_getByType } = render(
      <SimplePlayer source={{ uri: 'https://example.com/video.m3u8' }} />,
    );

    await flushAsyncState();

    fireEvent.press(getByLabelText('toggle-fullscreen'));

    const modal = UNSAFE_getByType(Modal);
    expect(modal.props.visible).toBe(true);
  });

  it('locks landscape on modal show and restores portrait on dismiss', async () => {
    const { getByLabelText, UNSAFE_getByType } = render(
      <SimplePlayer source={{ uri: 'https://example.com/video.m3u8' }} />,
    );

    await flushAsyncState();

    fireEvent.press(getByLabelText('toggle-fullscreen'));

    const modal = UNSAFE_getByType(Modal);

    await act(async () => {
      await modal.props.onShow();
    });
    expect(mockLockAsync).toHaveBeenCalledWith('LANDSCAPE');

    await act(async () => {
      await modal.props.onDismiss();
    });
    expect(mockLockAsync).toHaveBeenCalledWith('PORTRAIT_UP');
  });

  it('opens settings dialog when settings press callback is triggered', async () => {
    const { getByLabelText, getByLabelText: getByA11yLabel } = render(
      <SimplePlayer source={{ uri: 'https://example.com/video.m3u8' }} />,
    );

    await flushAsyncState();

    fireEvent.press(getByLabelText('open-settings'));
    expect(getByA11yLabel('settings-open')).toBeTruthy();
  });
});
