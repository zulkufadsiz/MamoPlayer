import CoreDemoScreen from '@/apps/example/CoreDemoScreen';
import { fireEvent, render } from '@testing-library/react-native';
import { Platform } from 'react-native';

type MockMamoPlayerProps = {
  onPlaybackEvent?: (event: unknown) => void;
  controls?: { autoHide?: boolean; autoHideDelay?: number };
  gestures?: { doubleTapSeek?: boolean };
  settingsOverlay?: { enabled?: boolean; showPlaybackSpeed?: boolean; showMute?: boolean };
  debug?: { enabled?: boolean };
};

let latestMamoPlayerProps: MockMamoPlayerProps | undefined;

jest.mock('@mamoplayer/core', () => {
  const React = require('react');
  const { Button, View } = require('react-native');

  const MamoPlayerMock = ({ onPlaybackEvent, controls, gestures, debug, settingsOverlay }: MockMamoPlayerProps) => {
    latestMamoPlayerProps = { onPlaybackEvent, controls, gestures, debug, settingsOverlay };
    return (
      <View>
        <Button
          title="emit-ready"
          onPress={() =>
            onPlaybackEvent?.({
              type: 'ready',
              position: 0,
              duration: 120,
              timestamp: Date.now(),
            })
          }
        />
        <Button
          title="emit-time-update"
          onPress={() =>
            onPlaybackEvent?.({
              type: 'time_update',
              position: 42.345,
              duration: 120,
              timestamp: Date.now(),
            })
          }
        />
        <Button
          title="emit-error"
          onPress={() =>
            onPlaybackEvent?.({
              type: 'error',
              error: { message: 'Invalid source URL' },
              timestamp: Date.now(),
            })
          }
        />
      </View>
    );
  };

  MamoPlayerMock.displayName = 'MamoPlayerMock';

  const PlaybackOptionsMock = () => <View />;
  PlaybackOptionsMock.displayName = 'PlaybackOptionsMock';

  return {
    MamoPlayer: MamoPlayerMock,
    PlaybackOptions: PlaybackOptionsMock,
  };
});

describe('CoreDemoScreen', () => {
  beforeEach(() => {
    latestMamoPlayerProps = undefined;
  });

  it('displays and updates playback position and duration from playback events', () => {
    const { getByText } = render(<CoreDemoScreen />);

    expect(getByText('Position: 0.00s')).toBeTruthy();
    expect(getByText('Duration: 0.00s')).toBeTruthy();

    fireEvent.press(getByText('emit-ready'));
    expect(getByText('Position: 0.00s')).toBeTruthy();
    expect(getByText('Duration: 120.00s')).toBeTruthy();

    fireEvent.press(getByText('emit-time-update'));
    expect(getByText('Position: 42.34s')).toBeTruthy();
    expect(getByText('Duration: 120.00s')).toBeTruthy();
  });

  it('shows error message when playback emits an error event', () => {
    const { getByText } = render(<CoreDemoScreen />);

    fireEvent.press(getByText('emit-error'));
    expect(getByText('Error: Invalid source URL')).toBeTruthy();
  });

  it('shows subtitles active note when subtitles are supported and enabled', () => {
    const { getByText, queryByText } = render(<CoreDemoScreen />);

    fireEvent.press(getByText('Play with Subtitles'));

    if (['ios', 'android', 'tvos', 'visionos'].includes(Platform.OS)) {
      expect(getByText('Subtitles are active (English).')).toBeTruthy();
      return;
    }

    expect(queryByText('Subtitles are active (English).')).toBeNull();
    expect(getByText('Subtitles are not supported on this platform.')).toBeTruthy();
  });

  it('renders the OTT UX features hints section', () => {
    const { getByTestId, getByText } = render(<CoreDemoScreen />);

    expect(getByTestId('ott-ux-hints')).toBeTruthy();
    expect(getByText('OTT UX Features')).toBeTruthy();
    expect(getByText('Tap the video to show or hide controls.')).toBeTruthy();
    expect(getByText('Double-tap the left side to seek back 10s.')).toBeTruthy();
    expect(getByText('Double-tap the right side to seek forward 10s.')).toBeTruthy();
    expect(getByText('Controls auto-hide after 3s of inactivity during playback.')).toBeTruthy();
    expect(getByText('A spinner appears automatically when buffering occurs.')).toBeTruthy();
  });

  it('passes auto-hide controls config to the player', () => {
    render(<CoreDemoScreen />);

    expect(latestMamoPlayerProps?.controls?.autoHide).toBe(true);
    expect(latestMamoPlayerProps?.controls?.autoHideDelay).toBe(3000);
  });

  it('passes double-tap seek gesture config to the player', () => {
    render(<CoreDemoScreen />);

    expect(latestMamoPlayerProps?.gestures?.doubleTapSeek).toBe(true);
  });

  it('passes debug.enabled=true to the player', () => {
    render(<CoreDemoScreen />);

    expect(latestMamoPlayerProps?.debug?.enabled).toBe(true);
  });

  it('passes settingsOverlay with speed and mute enabled to the player', () => {
    render(<CoreDemoScreen />);

    expect(latestMamoPlayerProps?.settingsOverlay?.enabled).toBe(true);
    expect(latestMamoPlayerProps?.settingsOverlay?.showPlaybackSpeed).toBe(true);
    expect(latestMamoPlayerProps?.settingsOverlay?.showMute).toBe(true);
  });

  it('renders the settings overlay hints section', () => {
    const { getByTestId, getByText } = render(<CoreDemoScreen />);

    expect(getByTestId('settings-overlay-hints')).toBeTruthy();
    expect(getByText('Settings Overlay')).toBeTruthy();
    expect(getByText('Tap the gear icon in the player to open the settings overlay.')).toBeTruthy();
  });

  it('renders the debug overlay hints section', () => {
    const { getByTestId, getByText } = render(<CoreDemoScreen />);

    expect(getByTestId('debug-overlay-hints')).toBeTruthy();
    expect(getByText('Debug Overlay')).toBeTruthy();
    expect(getByText('Two-finger triple-tap the player to toggle the debug overlay.')).toBeTruthy();
  });
});
