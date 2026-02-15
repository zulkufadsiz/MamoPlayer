import MamoPlayerDemo from '@/components/MamoPlayerDemo';
import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';

const mockGetOfflineLibraryItems = jest.fn(() => Promise.resolve([]));

jest.mock('@/components/MamoPlayer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MamoPlayerMock = ({ title }: { title?: string }) => (
    <Text>{`player-title:${title || 'none'}`}</Text>
  );
  MamoPlayerMock.displayName = 'MamoPlayerMock';
  return MamoPlayerMock;
});

jest.mock('@/components/lib/subtitleParser', () => ({
  parseSrtOrVtt: jest.fn(() => []),
}));

jest.mock('@/components/lib/offlineLibraryStore', () => ({
  getOfflineLibraryItems: (...args: unknown[]) => mockGetOfflineLibraryItems(...args),
  downloadVideoToLibrary: jest.fn(() => Promise.resolve()),
  removeOfflineVideo: jest.fn(() => Promise.resolve()),
}));

describe('MamoPlayerDemo', () => {
  const flushAsyncState = async () => {
    await act(async () => {
      await Promise.resolve();
    });
  };

  it('renders demo sections and updates selected video', async () => {
    const { getByText } = render(<MamoPlayerDemo />);

    await flushAsyncState();

    expect(getByText('Catalog')).toBeTruthy();
    expect(getByText('player-title:Big Buck Bunny')).toBeTruthy();

    fireEvent.press(getByText('Sintel'));

    expect(getByText('player-title:Sintel')).toBeTruthy();
    expect(mockGetOfflineLibraryItems).toHaveBeenCalled();
  });
});
