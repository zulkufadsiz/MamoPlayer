import MamoPlayer from '@/components/MamoPlayer';
import { render } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/components/SimplePlayer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const SimplePlayerMock = () => <Text>simple-player</Text>;
  SimplePlayerMock.displayName = 'SimplePlayerMock';
  return SimplePlayerMock;
});

jest.mock('@/components/VerticalPlayer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const VerticalPlayerMock = () => <Text>vertical-player</Text>;
  VerticalPlayerMock.displayName = 'VerticalPlayerMock';
  return VerticalPlayerMock;
});

jest.mock('@/components/LandscapePlayer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const LandscapePlayerMock = () => <Text>landscape-player</Text>;
  LandscapePlayerMock.displayName = 'LandscapePlayerMock';
  return LandscapePlayerMock;
});

describe('MamoPlayer', () => {
  const source = { uri: 'https://example.com/video.m3u8' };

  it('renders simple player by default', () => {
    const { getByText } = render(<MamoPlayer source={source} />);
    expect(getByText('simple-player')).toBeTruthy();
  });

  it('renders vertical player when requested', () => {
    const { getByText } = render(<MamoPlayer source={source} playerType="vertical" />);
    expect(getByText('vertical-player')).toBeTruthy();
  });

  it('renders landscape player when requested', () => {
    const { getByText } = render(<MamoPlayer source={source} playerType="landscape" />);
    expect(getByText('landscape-player')).toBeTruthy();
  });
});
