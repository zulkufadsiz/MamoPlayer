import { fireEvent, render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { SettingsOverlay } from './SettingsOverlay';

jest.mock('@react-native-vector-icons/material-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const MaterialIconsMock = ({ name }: { name?: string }) => <Text>{name ?? 'icon'}</Text>;

  MaterialIconsMock.displayName = 'MaterialIconsMock';

  return MaterialIconsMock;
});

const BASE_PROPS = {
  showPlaybackSpeed: true,
  showMute: true,
  playbackRate: 1,
  muted: false,
  onSelectPlaybackRate: jest.fn(),
  onToggleMuted: jest.fn(),
  onClose: jest.fn(),
};

describe('SettingsOverlay', () => {
  let timingSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Make Animated.timing resolve synchronously so close callbacks fire in tests.
    timingSpy = jest.spyOn(Animated, 'timing').mockImplementation(() => ({
      start: (cb?: (result: { finished: boolean }) => void) => {
        cb?.({ finished: true });
      },
    }));
  });

  afterEach(() => {
    timingSpy.mockRestore();
  });

  describe('playback speed', () => {
    it('renders the playback speed menu item when showPlaybackSpeed is true', () => {
      const { getByTestId } = render(<SettingsOverlay {...BASE_PROPS} />);

      expect(getByTestId('settings-menu-playback-speed')).toBeTruthy();
    });

    it('does not render the playback speed menu item when showPlaybackSpeed is false', () => {
      const { queryByTestId } = render(
        <SettingsOverlay {...BASE_PROPS} showPlaybackSpeed={false} />,
      );

      expect(queryByTestId('settings-menu-playback-speed')).toBeNull();
    });

    it('shows all speed options after pressing the playback speed menu item', () => {
      const { getByTestId, getByLabelText } = render(<SettingsOverlay {...BASE_PROPS} />);

      fireEvent.press(getByTestId('settings-menu-playback-speed'));

      expect(getByLabelText('0.5x')).toBeTruthy();
      expect(getByLabelText('1x')).toBeTruthy();
      expect(getByLabelText('1.25x')).toBeTruthy();
      expect(getByLabelText('1.5x')).toBeTruthy();
      expect(getByLabelText('2x')).toBeTruthy();
    });

    it('calls onSelectPlaybackRate with the selected rate', () => {
      const onSelectPlaybackRate = jest.fn();
      const { getByTestId, getByLabelText } = render(
        <SettingsOverlay {...BASE_PROPS} onSelectPlaybackRate={onSelectPlaybackRate} />,
      );

      fireEvent.press(getByTestId('settings-menu-playback-speed'));
      fireEvent.press(getByLabelText('1.5x'));

      expect(onSelectPlaybackRate).toHaveBeenCalledWith(1.5);
    });

    it('calls onSelectPlaybackRate(0.5) when 0.5x is selected', () => {
      const onSelectPlaybackRate = jest.fn();
      const { getByTestId, getByLabelText } = render(
        <SettingsOverlay {...BASE_PROPS} onSelectPlaybackRate={onSelectPlaybackRate} />,
      );

      fireEvent.press(getByTestId('settings-menu-playback-speed'));
      fireEvent.press(getByLabelText('0.5x'));

      expect(onSelectPlaybackRate).toHaveBeenCalledWith(0.5);
    });

    it('calls onSelectPlaybackRate(2) when 2x is selected', () => {
      const onSelectPlaybackRate = jest.fn();
      const { getByTestId, getByLabelText } = render(
        <SettingsOverlay {...BASE_PROPS} onSelectPlaybackRate={onSelectPlaybackRate} />,
      );

      fireEvent.press(getByTestId('settings-menu-playback-speed'));
      fireEvent.press(getByLabelText('2x'));

      expect(onSelectPlaybackRate).toHaveBeenCalledWith(2);
    });
  });

  describe('mute', () => {
    it('renders the mute menu item when showMute is true', () => {
      const { getByTestId } = render(<SettingsOverlay {...BASE_PROPS} />);

      expect(getByTestId('settings-menu-mute')).toBeTruthy();
    });

    it('does not render the mute menu item when showMute is false', () => {
      const { queryByTestId } = render(
        <SettingsOverlay {...BASE_PROPS} showMute={false} />,
      );

      expect(queryByTestId('settings-menu-mute')).toBeNull();
    });

    it('shows Muted and Unmuted options after pressing the mute menu item', () => {
      const { getByTestId, getByLabelText } = render(<SettingsOverlay {...BASE_PROPS} />);

      fireEvent.press(getByTestId('settings-menu-mute'));

      expect(getByLabelText('Unmuted')).toBeTruthy();
      expect(getByLabelText('Muted')).toBeTruthy();
    });

    it('calls onToggleMuted when Muted option is selected while currently unmuted', () => {
      const onToggleMuted = jest.fn();
      const { getByTestId, getByLabelText } = render(
        <SettingsOverlay {...BASE_PROPS} muted={false} onToggleMuted={onToggleMuted} />,
      );

      fireEvent.press(getByTestId('settings-menu-mute'));
      fireEvent.press(getByLabelText('Muted'));

      expect(onToggleMuted).toHaveBeenCalledTimes(1);
    });

    it('calls onToggleMuted when Unmuted option is selected while currently muted', () => {
      const onToggleMuted = jest.fn();
      const { getByTestId, getByLabelText } = render(
        <SettingsOverlay {...BASE_PROPS} muted={true} onToggleMuted={onToggleMuted} />,
      );

      fireEvent.press(getByTestId('settings-menu-mute'));
      fireEvent.press(getByLabelText('Unmuted'));

      expect(onToggleMuted).toHaveBeenCalledTimes(1);
    });
  });

  describe('close behavior', () => {
    it('calls onClose when the close button is pressed', () => {
      const onClose = jest.fn();
      const { getByLabelText } = render(
        <SettingsOverlay {...BASE_PROPS} onClose={onClose} />,
      );

      fireEvent.press(getByLabelText('Close'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when the backdrop is pressed', () => {
      const onClose = jest.fn();
      const { getByTestId } = render(
        <SettingsOverlay {...BASE_PROPS} onClose={onClose} />,
      );

      fireEvent.press(getByTestId('settings-overlay-backdrop'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose a second time when close is triggered while already closing', () => {
      const onClose = jest.fn();
      const { getByLabelText, getByTestId } = render(
        <SettingsOverlay {...BASE_PROPS} onClose={onClose} />,
      );

      fireEvent.press(getByLabelText('Close'));
      fireEvent.press(getByTestId('settings-overlay-backdrop'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
