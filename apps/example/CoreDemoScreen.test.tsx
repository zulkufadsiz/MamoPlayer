import CoreDemoScreen from '@/apps/example/CoreDemoScreen';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('@mamoplayer/core', () => {
  const React = require('react');
  const { Button, View } = require('react-native');

  const MamoPlayerMock = ({ onPlaybackEvent }: { onPlaybackEvent?: (event: unknown) => void }) => (
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
    </View>
  );

  MamoPlayerMock.displayName = 'MamoPlayerMock';

  return {
    MamoPlayer: MamoPlayerMock,
  };
});

describe('CoreDemoScreen', () => {
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
});
