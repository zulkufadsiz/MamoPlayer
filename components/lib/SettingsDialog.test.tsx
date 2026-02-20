import SettingsDialog from '@/components/lib/SettingsDialog';
import { act, fireEvent, render } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

describe('SettingsDialog', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('changes playback speed from menu', () => {
    const onPlaybackSpeedChange = jest.fn();
    const { getByLabelText } = render(
      <SettingsDialog
        visible
        onClose={jest.fn()}
        playbackSpeed={1}
        onPlaybackSpeedChange={onPlaybackSpeedChange}
        quality="Auto"
        onQualityChange={jest.fn()}
        autoPlay
        onAutoPlayChange={jest.fn()}
        showSubtitles
        onShowSubtitlesChange={jest.fn()}
      />,
    );

    fireEvent.press(getByLabelText('Playback speed'));
    fireEvent.press(getByLabelText('Playback speed 1.5x'));
    act(() => {
      jest.runAllTimers();
    });

    expect(onPlaybackSpeedChange).toHaveBeenCalledWith(1.5);
  });

  it('toggles autoplay in preferences', () => {
    const onAutoPlayChange = jest.fn();
    const { getByLabelText } = render(
      <SettingsDialog
        visible
        onClose={jest.fn()}
        playbackSpeed={1}
        onPlaybackSpeedChange={jest.fn()}
        quality="Auto"
        onQualityChange={jest.fn()}
        autoPlay
        onAutoPlayChange={onAutoPlayChange}
        showSubtitles
        onShowSubtitlesChange={jest.fn()}
      />,
    );

    fireEvent.press(getByLabelText('Preferences'));
    fireEvent(getByLabelText('AutoPlay'), 'valueChange', false);

    expect(onAutoPlayChange).toHaveBeenCalledWith(false);
  });
});
