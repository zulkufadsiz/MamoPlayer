import { fireEvent, render } from '@testing-library/react-native';
import { Animated } from 'react-native';
import type { SettingsSection } from '../types/settings';
import { SettingsOverlay } from './SettingsOverlay';

jest.mock('@react-native-vector-icons/material-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const MaterialIconsMock = ({ name }: { name?: string }) => <Text>{name ?? 'icon'}</Text>;

  MaterialIconsMock.displayName = 'MaterialIconsMock';

  return MaterialIconsMock;
});

const onPressMock = jest.fn();

const SPEED_SECTION: SettingsSection = {
  id: 'playback-speed',
  title: 'Playback Speed',
  items: [
    { id: '0.5', label: '0.5x', selected: false, onPress: onPressMock },
    { id: '1', label: 'Normal', selected: true, onPress: onPressMock },
    { id: '1.5', label: '1.5x', selected: false, onPress: onPressMock },
    { id: '2', label: '2x', selected: false, onPress: onPressMock },
  ],
};

const MUTE_SECTION: SettingsSection = {
  id: 'mute',
  title: 'Mute',
  items: [
    { id: 'unmuted', label: 'Unmuted', selected: true, onPress: onPressMock },
    { id: 'muted', label: 'Muted', selected: false, onPress: onPressMock },
  ],
};

const BASE_PROPS = {
  sections: [SPEED_SECTION],
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
      stop: jest.fn(),
      reset: jest.fn(),
    }));
  });

  afterEach(() => {
    timingSpy.mockRestore();
  });

  describe('rendering sections', () => {
    it('renders the section title', () => {
      const { getByText } = render(<SettingsOverlay {...BASE_PROPS} />);

      expect(getByText('Playback Speed')).toBeTruthy();
    });

    it('renders all items in a section', () => {
      const { getByLabelText } = render(<SettingsOverlay {...BASE_PROPS} />);

      expect(getByLabelText('0.5x')).toBeTruthy();
      expect(getByLabelText('Normal')).toBeTruthy();
      expect(getByLabelText('1.5x')).toBeTruthy();
      expect(getByLabelText('2x')).toBeTruthy();
    });

    it('renders multiple sections', () => {
      const { getByText } = render(
        <SettingsOverlay {...BASE_PROPS} sections={[SPEED_SECTION, MUTE_SECTION]} />,
      );

      expect(getByText('Playback Speed')).toBeTruthy();
      expect(getByText('Mute')).toBeTruthy();
    });

    it('renders a testID for each item using section.id and item.id', () => {
      const { getByTestId } = render(<SettingsOverlay {...BASE_PROPS} />);

      expect(getByTestId('settings-item-playback-speed-1')).toBeTruthy();
      expect(getByTestId('settings-item-playback-speed-0.5')).toBeTruthy();
    });
  });

  describe('selected item highlighting', () => {
    it('marks the selected item with accessibilityState selected=true', () => {
      const { getByLabelText } = render(<SettingsOverlay {...BASE_PROPS} />);

      expect(getByLabelText('Normal').props.accessibilityState.selected).toBe(true);
    });

    it('marks unselected items with accessibilityState selected=false or undefined', () => {
      const { getByLabelText } = render(<SettingsOverlay {...BASE_PROPS} />);

      expect(getByLabelText('0.5x').props.accessibilityState.selected).toBeFalsy();
    });
  });

  describe('item press', () => {
    it('calls item.onPress when an item is pressed', () => {
      const onPress = jest.fn();
      const section: SettingsSection = {
        id: 'speed',
        title: 'Speed',
        items: [{ id: '1.5', label: '1.5x', selected: false, onPress }],
      };
      const { getByLabelText } = render(
        <SettingsOverlay sections={[section]} onClose={jest.fn()} />,
      );

      fireEvent.press(getByLabelText('1.5x'));

      expect(onPress).toHaveBeenCalledTimes(1);
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
