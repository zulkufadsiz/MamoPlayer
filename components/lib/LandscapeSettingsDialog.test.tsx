import LandscapeSettingsDialog from '@/components/lib/LandscapeSettingsDialog';
import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

describe('LandscapeSettingsDialog', () => {
  it('does not render when hidden', () => {
    const { queryByText } = render(
      <LandscapeSettingsDialog
        visible={false}
        onClose={jest.fn()}
        playbackSpeed={1}
        onPlaybackSpeedChange={jest.fn()}
        quality="Auto"
        onQualityChange={jest.fn()}
        autoPlay
        onAutoPlayChange={jest.fn()}
        showSubtitles
        onShowSubtitlesChange={jest.fn()}
      />,
    );

    expect(queryByText('Settings')).toBeNull();
  });

  it('changes quality and toggles autoplay when visible', () => {
    const onQualityChange = jest.fn();
    const onAutoPlayChange = jest.fn();

    const { getByLabelText } = render(
      <LandscapeSettingsDialog
        visible
        onClose={jest.fn()}
        playbackSpeed={1}
        onPlaybackSpeedChange={jest.fn()}
        quality="Auto"
        onQualityChange={onQualityChange}
        qualityOptions={['Auto', '720p']}
        autoPlay
        onAutoPlayChange={onAutoPlayChange}
        showSubtitles
        onShowSubtitlesChange={jest.fn()}
      />,
    );

    fireEvent.press(getByLabelText('Video quality section'));
    fireEvent.press(getByLabelText('Video quality 720p'));
    fireEvent.press(getByLabelText('Preferences section'));
    fireEvent.press(getByLabelText('Auto Play'));

    expect(onQualityChange).toHaveBeenCalledWith('720p');
    expect(onAutoPlayChange).toHaveBeenCalledWith(false);
  });
});
