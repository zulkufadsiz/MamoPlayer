import { fireEvent, render } from '@testing-library/react-native';
import { PlaybackOptions } from './PlaybackOptions';

jest.mock('@react-native-vector-icons/material-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const MaterialIconsMock = ({ name }: { name?: string }) => <Text>{name ?? 'icon'}</Text>;

  MaterialIconsMock.displayName = 'MaterialIconsMock';

  return MaterialIconsMock;
});

const BASE_PROPS = {
  isPlaying: false,
  onSeekBack: jest.fn(),
  onTogglePlayPause: jest.fn(),
  onSeekForward: jest.fn(),
};

describe('PlaybackOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('transport buttons', () => {
    it('calls onSeekBack when seek-back is pressed', () => {
      const onSeekBack = jest.fn();

      const { getByLabelText } = render(
        <PlaybackOptions {...BASE_PROPS} onSeekBack={onSeekBack} />,
      );

      fireEvent.press(getByLabelText('Seek backward 10 seconds'));

      expect(onSeekBack).toHaveBeenCalledTimes(1);
    });

    it('calls onSeekForward when seek-forward is pressed', () => {
      const onSeekForward = jest.fn();

      const { getByLabelText } = render(
        <PlaybackOptions {...BASE_PROPS} onSeekForward={onSeekForward} />,
      );

      fireEvent.press(getByLabelText('Seek forward 10 seconds'));

      expect(onSeekForward).toHaveBeenCalledTimes(1);
    });

    it('calls onTogglePlayPause when play/pause is pressed', () => {
      const onTogglePlayPause = jest.fn();

      const { getByTestId } = render(
        <PlaybackOptions {...BASE_PROPS} onTogglePlayPause={onTogglePlayPause} />,
      );

      fireEvent.press(getByTestId('core-play-pause-button'));

      expect(onTogglePlayPause).toHaveBeenCalledTimes(1);
    });

    it('hides transport buttons when showTransportButtons is false', () => {
      const { queryByLabelText, queryByTestId } = render(
        <PlaybackOptions {...BASE_PROPS} showTransportButtons={false} />,
      );

      expect(queryByLabelText('Seek backward 10 seconds')).toBeNull();
      expect(queryByLabelText('Seek forward 10 seconds')).toBeNull();
      expect(queryByTestId('core-play-pause-button')).toBeNull();
    });
  });

  describe('settings button', () => {
    it('shows settings button when showSettingsMenuButton is true and handler is provided', () => {
      const { getByTestId } = render(
        <PlaybackOptions
          {...BASE_PROPS}
          showSettingsMenuButton
          onToggleSettingsMenu={jest.fn()}
        />,
      );

      expect(getByTestId('core-settings-menu-button')).toBeTruthy();
    });

    it('calls onToggleSettingsMenu when settings is pressed', () => {
      const onToggleSettingsMenu = jest.fn();

      const { getByTestId } = render(
        <PlaybackOptions
          {...BASE_PROPS}
          showSettingsMenuButton
          onToggleSettingsMenu={onToggleSettingsMenu}
        />,
      );

      fireEvent.press(getByTestId('core-settings-menu-button'));

      expect(onToggleSettingsMenu).toHaveBeenCalledTimes(1);
    });

    it('hides settings button when showSettingsMenuButton is false', () => {
      const { queryByTestId } = render(
        <PlaybackOptions
          {...BASE_PROPS}
          showSettingsMenuButton={false}
          onToggleSettingsMenu={jest.fn()}
        />,
      );

      expect(queryByTestId('core-settings-menu-button')).toBeNull();
    });

    it('hides settings button when no handler is provided even if showSettingsMenuButton is true', () => {
      const { queryByTestId } = render(
        <PlaybackOptions {...BASE_PROPS} showSettingsMenuButton onToggleSettingsMenu={undefined} />,
      );

      expect(queryByTestId('core-settings-menu-button')).toBeNull();
    });
  });

  describe('fullscreen button', () => {
    it('shows fullscreen button when showFullscreenButton is true and handler is provided', () => {
      const { getByTestId } = render(
        <PlaybackOptions
          {...BASE_PROPS}
          showFullscreenButton
          onToggleFullscreen={jest.fn()}
        />,
      );

      expect(getByTestId('core-toggle-fullscreen-button')).toBeTruthy();
    });

    it('calls onToggleFullscreen when fullscreen button is pressed', () => {
      const onToggleFullscreen = jest.fn();

      const { getByTestId } = render(
        <PlaybackOptions
          {...BASE_PROPS}
          showFullscreenButton
          onToggleFullscreen={onToggleFullscreen}
        />,
      );

      fireEvent.press(getByTestId('core-toggle-fullscreen-button'));

      expect(onToggleFullscreen).toHaveBeenCalledTimes(1);
    });

    it('hides fullscreen button when showFullscreenButton is false', () => {
      const { queryByTestId } = render(
        <PlaybackOptions
          {...BASE_PROPS}
          showFullscreenButton={false}
          onToggleFullscreen={jest.fn()}
        />,
      );

      expect(queryByTestId('core-toggle-fullscreen-button')).toBeNull();
    });

    it('hides fullscreen button when no handler is provided even if showFullscreenButton is true', () => {
      const { queryByTestId } = render(
        <PlaybackOptions
          {...BASE_PROPS}
          showFullscreenButton
          onToggleFullscreen={undefined}
        />,
      );

      expect(queryByTestId('core-toggle-fullscreen-button')).toBeNull();
    });

    it('shows "Enter fullscreen" label when not in fullscreen', () => {
      const { getByLabelText } = render(
        <PlaybackOptions
          {...BASE_PROPS}
          isFullscreen={false}
          showFullscreenButton
          onToggleFullscreen={jest.fn()}
        />,
      );

      expect(getByLabelText('Enter fullscreen')).toBeTruthy();
    });

    it('shows "Exit fullscreen" label when in fullscreen', () => {
      const { getByLabelText } = render(
        <PlaybackOptions
          {...BASE_PROPS}
          isFullscreen={true}
          showFullscreenButton
          onToggleFullscreen={jest.fn()}
        />,
      );

      expect(getByLabelText('Exit fullscreen')).toBeTruthy();
    });
  });

  describe('settings open triggers overlay', () => {
    it('each press of settings fires the handler exactly once', () => {
      const onToggleSettingsMenu = jest.fn();

      const { getByTestId } = render(
        <PlaybackOptions
          {...BASE_PROPS}
          showSettingsMenuButton
          onToggleSettingsMenu={onToggleSettingsMenu}
        />,
      );

      fireEvent.press(getByTestId('core-settings-menu-button'));
      fireEvent.press(getByTestId('core-settings-menu-button'));

      expect(onToggleSettingsMenu).toHaveBeenCalledTimes(2);
    });
  });
});
