import { useTransportControls } from '@/components/lib/useTransportControls.web';
import { render } from '@testing-library/react-native';
import React from 'react';

describe('useTransportControls.web', () => {
  it('runs as a no-op without throwing', () => {
    const Harness = () => {
      useTransportControls({
        enabled: true,
        isPlaying: false,
        mediaUrl: 'https://example.com/video.m3u8',
      });
      return null;
    };

    expect(() => render(React.createElement(Harness))).not.toThrow();
  });
});
