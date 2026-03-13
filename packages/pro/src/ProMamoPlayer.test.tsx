import type { PlaybackEvent } from '@mamoplayer/core';
import { act, fireEvent, render, within } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ProMamoPlayer } from './ProMamoPlayer';
import type { PlayerThemeConfig } from './types/theme';

jest.mock('@react-native-vector-icons/material-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const MaterialIconsMock = ({ name }: { name?: string }) => <Text>{name ?? 'icon'}</Text>;

  MaterialIconsMock.displayName = 'MaterialIconsMock';

  return MaterialIconsMock;
});

let latestOnPlaybackEvent: ((event: PlaybackEvent) => void) | undefined;
let latestVideoProps:
  | {
      rate?: number;
  paused?: boolean;
      source?: unknown;
      autoPlay?: boolean;
      settingsOverlay?: {
        enabled?: boolean;
        showPlaybackSpeed?: boolean;
        showMute?: boolean;
        showQuality?: boolean;
        showSubtitles?: boolean;
        showAudioTracks?: boolean;
        extraItems?: unknown;
        extraMenuItems?: Array<{
          key: string;
          title: string;
          value?: string;
          options: Array<{ id: string; label: string }>;
          selectedOptionId?: string;
          onSelectOption: (optionId: string) => void;
        }>;
      };
      onPictureInPictureStatusChanged?: (event: Readonly<{ isActive: boolean }>) => void;
      currentQualityId?: string;
      onQualityChange?: (qualityId: string) => void;
      audioTracks?: { id: string; label: string; language?: string }[];
      subtitleTracks?: {
        id: string;
        label: string;
        language: string;
        uri: string;
        isDefault?: boolean;
      }[];
      textTracks?: { title: string; language?: string; type: 'text/vtt'; uri: string }[];
      selectedTextTrack?:
        | { type: 'disabled' }
        | { type: 'index'; value: number }
        | { type: 'title'; value: string };
      onTextTrackDataChanged?: (payload: unknown) => void;
      onFullscreenChange?: (isFullscreen: boolean) => void;
      defaultAudioTrackId?: string | null;
      currentAudioTrackId?: string;
      onAudioTrackChange?: (audioTrackId: string) => void;
      selectedAudioTrack?: { type: 'language'; value: string } | { type: 'disabled' } | undefined;
      currentSubtitleTrackId?: string | 'off';
      onSubtitleTrackChange?: (subtitleTrackId: string | 'off') => void;
    }
  | undefined;
let latestNativeAdsHandler:
  | ((
      eventName: 'mamo_ads_loaded' | 'mamo_ads_started' | 'mamo_ads_completed' | 'mamo_ads_error',
      payload?: unknown,
    ) => void)
  | undefined;
let latestNativePipHandler:
  | ((eventName: 'mamo_pip_active' | 'mamo_pip_exiting', payload?: unknown) => void)
  | undefined;
let latestTimelineProps:
  | {
      duration?: number;
      position?: number;
      buffered?: number;
      onSeek?: (time: number) => void;
      onScrubStart?: () => void;
      onScrubEnd?: (time: number) => void;
    }
  | undefined;
const mockSeek = jest.fn();
const mockEnterPictureInPicture = jest.fn();
const mockRequestPictureInPicture = jest.fn();
const mockLoadAds = jest.fn(async (_adTagUrl: string) => {});
const mockReleaseAds = jest.fn(async () => {});
const mockUnsubscribeAdsEvents = jest.fn();
const mockUnsubscribePipEvents = jest.fn();
const mockSubscribeToAdsEvents = jest.fn(
  (
    handler: (
      eventName: 'mamo_ads_loaded' | 'mamo_ads_started' | 'mamo_ads_completed' | 'mamo_ads_error',
      payload?: unknown,
    ) => void,
  ) => {
    latestNativeAdsHandler = handler;
    return mockUnsubscribeAdsEvents;
  },
);
const mockSubscribeToPipEvents = jest.fn(
  (handler: (eventName: 'mamo_pip_active' | 'mamo_pip_exiting', payload?: unknown) => void) => {
    latestNativePipHandler = handler;
    return mockUnsubscribePipEvents;
  },
);
let mockShouldExposeEnterPictureInPicture = true;

jest.mock('@mamoplayer/core', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  const MamoPlayerMock = React.forwardRef(
    (
      {
        onPlaybackEvent,
        rate,
        paused,
        source,
        autoPlay,
        settingsOverlay,
        onPictureInPictureStatusChanged,
        currentQualityId,
        onQualityChange,
        audioTracks,
        subtitleTracks,
        textTracks,
        selectedTextTrack,
        onTextTrackDataChanged,
        onFullscreenChange,
        defaultAudioTrackId,
        currentAudioTrackId,
        onAudioTrackChange,
        selectedAudioTrack,
        currentSubtitleTrackId,
        onSubtitleTrackChange,
        topRightActions,
      }: {
        onPlaybackEvent?: (event: PlaybackEvent) => void;
        rate?: number;
        paused?: boolean;
        source?: unknown;
        autoPlay?: boolean;
        settingsOverlay?: {
          enabled?: boolean;
          showPlaybackSpeed?: boolean;
          showMute?: boolean;
          showQuality?: boolean;
          showSubtitles?: boolean;
          showAudioTracks?: boolean;
          extraItems?: unknown;
          extraMenuItems?: Array<{
            key: string;
            title: string;
            value?: string;
            options: Array<{ id: string; label: string }>;
            selectedOptionId?: string;
            onSelectOption: (optionId: string) => void;
          }>;
        };
        onPictureInPictureStatusChanged?: (event: Readonly<{ isActive: boolean }>) => void;
        currentQualityId?: string;
        onQualityChange?: (qualityId: string) => void;
        audioTracks?: { id: string; label: string; language?: string }[];
        subtitleTracks?: {
          id: string;
          label: string;
          language: string;
          uri: string;
          isDefault?: boolean;
        }[];
        textTracks?: { title: string; language?: string; type: 'text/vtt'; uri: string }[];
        selectedTextTrack?:
          | { type: 'disabled' }
          | { type: 'index'; value: number }
          | { type: 'title'; value: string };
        onTextTrackDataChanged?: (payload: unknown) => void;
        onFullscreenChange?: (isFullscreen: boolean) => void;
        defaultAudioTrackId?: string | null;
        currentAudioTrackId?: string;
        onAudioTrackChange?: (audioTrackId: string) => void;
        selectedAudioTrack?: { type: 'language'; value: string } | { type: 'disabled' } | undefined;
        currentSubtitleTrackId?: string | 'off';
        onSubtitleTrackChange?: (subtitleTrackId: string | 'off') => void;
        topRightActions?: React.ReactNode;
      },
      ref: React.Ref<{
        seek: (position: number) => void;
        enterPictureInPicture?: () => void;
      }>,
    ) => {
      React.useImperativeHandle(ref, () => {
        const instance: {
          seek: (position: number) => void;
          enterPictureInPicture?: () => void;
        } = {
          seek: (position: number) => mockSeek(position),
        };

        if (mockShouldExposeEnterPictureInPicture) {
          instance.enterPictureInPicture = () => mockEnterPictureInPicture();
        }

        return instance;
      });

      latestOnPlaybackEvent = onPlaybackEvent;
      latestVideoProps = {
        rate,
        paused,
        source,
        autoPlay,
        settingsOverlay,
        onPictureInPictureStatusChanged,
        currentQualityId,
        onQualityChange,
        audioTracks,
        subtitleTracks,
        textTracks,
        selectedTextTrack,
        onTextTrackDataChanged,
        onFullscreenChange,
        defaultAudioTrackId,
        currentAudioTrackId,
        onAudioTrackChange,
        selectedAudioTrack,
        currentSubtitleTrackId,
        onSubtitleTrackChange,
      };
      return <View testID="mamoplayer-mock">{topRightActions ?? null}</View>;
    },
  );

  MamoPlayerMock.displayName = 'MamoPlayerMock';

  const TimelineMock = ({ duration, position, buffered, onSeek, onScrubStart, onScrubEnd }: {
    duration?: number;
    position?: number;
    buffered?: number;
    onSeek?: (time: number) => void;
    onScrubStart?: () => void;
    onScrubEnd?: (time: number) => void;
  }) => {
    latestTimelineProps = {
      duration,
      position,
      buffered,
      onSeek,
      onScrubStart,
      onScrubEnd,
    };

    return <View testID="mamoplayer-core-timeline" />;
  };

  TimelineMock.displayName = 'TimelineMock';

  const PlaybackOptionsMock = ({
    options,
    onPressOption,
  }: {
    options: Array<{ id: string; label?: string }>;
    onPressOption: (id: string) => void;
  }) => {
    const optionTestIds: Record<string, string> = {
      'seek-back': 'pro-transport-seek-back-10',
      'seek-forward': 'pro-transport-seek-forward-10',
      settings: 'pro-transport-settings',
      fullscreen: 'pro-transport-fullscreen',
      pip: 'pro-transport-pip',
    };

    return (
      <View testID="mamoplayer-core-playback-options">
        {options.map(option => (
          <Pressable
            key={option.id}
            testID={optionTestIds[option.id]}
            accessibilityRole="button"
            accessibilityLabel={option.label ?? option.id}
            onPress={() => onPressOption(option.id)}
          >
            <Text>{option.label ?? option.id}</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  PlaybackOptionsMock.displayName = 'PlaybackOptionsMock';

  return {
    __esModule: true,
    MamoPlayerCore: MamoPlayerMock,
    MamoPlayer: MamoPlayerMock,
    PlaybackOptions: PlaybackOptionsMock,
    Timeline: TimelineMock,
  };
});

jest.mock('./ima/nativeBridge', () => ({
  loadAds: (adTagUrl: string) => mockLoadAds(adTagUrl),
  releaseAds: () => mockReleaseAds(),
  subscribeToAdsEvents: (
    handler: (
      eventName: 'mamo_ads_loaded' | 'mamo_ads_started' | 'mamo_ads_completed' | 'mamo_ads_error',
      payload?: unknown,
    ) => void,
  ) => mockSubscribeToAdsEvents(handler),
}));

jest.mock('./pip/nativeBridge', () => ({
  requestPictureInPicture: () => mockRequestPictureInPicture(),
  subscribeToPipEvents: (
    handler: (eventName: 'mamo_pip_active' | 'mamo_pip_exiting', payload?: unknown) => void,
  ) => mockSubscribeToPipEvents(handler),
}));

describe('ProMamoPlayer', () => {
  beforeEach(() => {
    latestOnPlaybackEvent = undefined;
    latestVideoProps = undefined;
    latestNativeAdsHandler = undefined;
    latestNativePipHandler = undefined;
    latestTimelineProps = undefined;
    jest.clearAllMocks();
    jest.useRealTimers();
    mockLoadAds.mockResolvedValue(undefined);
    mockReleaseAds.mockResolvedValue(undefined);
    mockSeek.mockReset();
    mockEnterPictureInPicture.mockReset();
    mockRequestPictureInPicture.mockReset();
    mockShouldExposeEnterPictureInPicture = true;
  });

  const emitPlayback = (event: Partial<PlaybackEvent> & Pick<PlaybackEvent, 'type'>) => {
    if (!latestOnPlaybackEvent) {
      throw new Error('onPlaybackEvent not captured');
    }

    latestOnPlaybackEvent({
      timestamp: Date.now(),
      position: event.position ?? 0,
      duration: event.duration,
      ...event,
    });
  };

  it('maps playback events to analytics events and forwards playback callback', () => {
    const onEvent = jest.fn();
    const onPlaybackEvent = jest.fn();

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video.mp4' }}
        analytics={{ onEvent }}
        onPlaybackEvent={onPlaybackEvent}
      />,
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
      emitPlayback({ type: 'play', duration: 100, position: 0 });
      emitPlayback({ type: 'pause', duration: 100, position: 10 });
      emitPlayback({ type: 'buffer_start', duration: 100, position: 20 });
      emitPlayback({ type: 'buffer_end', duration: 100, position: 22 });
      emitPlayback({ type: 'seek', duration: 100, position: 40 });
      emitPlayback({ type: 'ended', duration: 100, position: 100 });
    });

    const analyticsTypes = onEvent.mock.calls.map(([event]) => event.type);

    expect(onPlaybackEvent).toHaveBeenCalledTimes(7);
    expect(analyticsTypes).toEqual(
      expect.arrayContaining([
        'session_start',
        'play',
        'pause',
        'buffer_start',
        'buffer_end',
        'seek',
        'ended',
        'session_end',
      ]),
    );
  });

  it('emits quartile events only once per session and resets after ready', () => {
    const onEvent = jest.fn();

    render(
      <ProMamoPlayer source={{ uri: 'https://example.com/video.mp4' }} analytics={{ onEvent }} />,
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
      emitPlayback({ type: 'time_update', duration: 100, position: 25 });
      emitPlayback({ type: 'time_update', duration: 100, position: 30 });
      emitPlayback({ type: 'time_update', duration: 100, position: 50 });
      emitPlayback({ type: 'time_update', duration: 100, position: 75 });
      emitPlayback({ type: 'time_update', duration: 100, position: 100 });
      emitPlayback({ type: 'time_update', duration: 100, position: 100 });
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
      emitPlayback({ type: 'time_update', duration: 100, position: 25 });
    });

    const quartileEvents = onEvent.mock.calls
      .map(([event]) => event)
      .filter((event) => event.type === 'quartile');

    expect(quartileEvents.map((event) => event.quartile)).toEqual([25, 50, 75, 100, 25]);
  });

  it('renders watermark with default position', () => {
    const { getByText } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video.mp4' }}
        watermark={{ text: 'demo-watermark', opacity: 0.3 }}
      />,
    );

    const watermark = getByText('demo-watermark');
    const watermarkStyle = StyleSheet.flatten(watermark.props.style);

    expect(watermarkStyle).toEqual(
      expect.objectContaining({
        position: 'absolute',
        top: 10,
        left: 10,
        fontSize: 12,
        opacity: 0.3,
      }),
    );
    expect(watermark.props.pointerEvents).toBe('none');
  });

  it('forwards settingsOverlay extraItems to core player', () => {
    const extraItems = <></>;

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video.mp4' }}
        settingsOverlay={{
          showPlaybackSpeed: false,
          showMute: false,
          extraItems,
        }}
      />,
    );

    expect(latestVideoProps?.settingsOverlay?.extraItems).toBe(extraItems);
  });

  it('adds subtitle menu item to core settings overlay and applies subtitle selection', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video-with-subtitles.mp4' }}
        tracks={{
          audioTracks: [
            { id: 'en-audio', label: 'English', language: 'en' },
            { id: 'tr-audio', label: 'Turkish', language: 'tr' },
          ],
          subtitleTracks: [
            {
              id: 'en-sub',
              language: 'en',
              label: 'English',
              uri: 'https://example.com/subtitles-en.vtt',
            },
            {
              id: 'tr-sub',
              language: 'tr',
              label: 'Turkish',
              uri: 'https://example.com/subtitles-tr.vtt',
            },
          ],
          defaultSubtitleTrackId: 'en-sub',
        }}
      />,
    );

    const subtitleMenuItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
      (extraMenuItem) => extraMenuItem.key === 'subtitle',
    );

    expect(subtitleMenuItem).toEqual(
      expect.objectContaining({
        title: 'Subtitle',
        value: 'English',
        selectedOptionId: 'en-sub',
      }),
    );
    expect(subtitleMenuItem?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'en-sub', label: 'English' }),
        expect.objectContaining({ id: 'tr-sub', label: 'Turkish' }),
        expect.objectContaining({ id: 'off', label: 'Off' }),
      ]),
    );

    act(() => {
      subtitleMenuItem?.onSelectOption('tr-sub');
    });

    expect(latestVideoProps?.currentSubtitleTrackId).toBe('tr-sub');
  });

  it('does not render incoming subtitle cue text when default subtitle track is off', () => {
    const { queryByText } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video-with-subtitles-off.mp4' }}
        tracks={{
          subtitleTracks: [
            {
              id: 'en-sub',
              language: 'en',
              label: 'English',
              uri: 'https://example.com/subtitles-en-off.vtt',
            },
          ],
          defaultSubtitleTrackId: 'off',
        }}
      />,
    );

    act(() => {
      latestVideoProps?.onTextTrackDataChanged?.({ text: 'Subtitle should stay hidden' });
    });

    expect(latestVideoProps?.currentSubtitleTrackId).toBe('off');
    expect(queryByText('Subtitle should stay hidden')).toBeNull();
  });

  it('adds quality menu item to core settings overlay and applies quality selection', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video-with-qualities.mp4' }}
        tracks={{
          qualities: [
            { id: 'auto', label: 'Auto', uri: 'https://example.com/video-auto.m3u8' },
            { id: '720p', label: '720p', uri: 'https://example.com/video-720p.m3u8' },
          ],
          defaultQualityId: 'auto',
        }}
      />,
    );

    const qualityMenuItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
      (extraMenuItem) => extraMenuItem.key === 'quality',
    );

    expect(qualityMenuItem).toEqual(
      expect.objectContaining({
        title: 'Quality',
        value: 'Auto',
        selectedOptionId: 'auto',
      }),
    );
    expect(qualityMenuItem?.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'auto', label: 'Auto' }),
        expect.objectContaining({ id: '720p', label: '720p' }),
      ]),
    );

    act(() => {
      qualityMenuItem?.onSelectOption('720p');
    });

    expect(latestVideoProps?.currentQualityId).toBe('720p');
  });

  it('omits quality section from settings overlay when tracks.qualities is absent', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video-no-qualities.mp4' }}
        tracks={{ subtitleTracks: [{ id: 'en', language: 'en', label: 'English', uri: 'https://example.com/en.vtt' }] }}
      />,
    );

    const qualityMenuItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
      (item) => item.key === 'quality',
    );

    expect(qualityMenuItem).toBeUndefined();
  });

  it('omits subtitle section from settings overlay when tracks.subtitleTracks is absent', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video-no-subtitles.mp4' }}
        tracks={{
          qualities: [{ id: 'auto', label: 'Auto', uri: 'https://example.com/auto.m3u8' }],
        }}
      />,
    );

    const subtitleMenuItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
      (item) => item.key === 'subtitle',
    );

    expect(subtitleMenuItem).toBeUndefined();
  });

  it('omits audio section from settings overlay when tracks.audioTracks is absent', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video-no-audio-tracks.mp4' }}
        tracks={{
          qualities: [{ id: 'auto', label: 'Auto', uri: 'https://example.com/auto.m3u8' }],
        }}
      />,
    );

    const audioMenuItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
      (item) => item.key === 'audio',
    );

    expect(audioMenuItem).toBeUndefined();
  });

  it('shows audio section when tracks.audioTracks has a single entry', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video-single-audio.mp4' }}
        tracks={{
          audioTracks: [{ id: 'en', label: 'English', language: 'en' }],
        }}
      />,
    );

    const audioMenuItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
      (item) => item.key === 'audio',
    );

    expect(audioMenuItem).toBeDefined();
    expect(audioMenuItem?.options).toEqual([
      expect.objectContaining({ id: 'en', label: 'English' }),
    ]);
    expect(audioMenuItem?.selectedOptionId).toBe('en');
  });

  it('shows audio section when all audio tracks share the same language', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video-same-lang-audio.mp4' }}
        tracks={{
          audioTracks: [
            { id: 'en-stereo', label: 'English Stereo', language: 'en' },
            { id: 'en-51', label: 'English 5.1', language: 'en' },
          ],
          defaultAudioTrackId: 'en-stereo',
        }}
      />,
    );

    const audioMenuItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
      (item) => item.key === 'audio',
    );

    expect(audioMenuItem).toBeDefined();
    expect(audioMenuItem?.options).toHaveLength(2);
    expect(audioMenuItem?.selectedOptionId).toBe('en-stereo');
  });

  it('updates selectedOptionId for quality section after quality change', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video-quality-highlight.mp4' }}
        tracks={{
          qualities: [
            { id: 'auto', label: 'Auto', uri: 'https://example.com/auto.m3u8' },
            { id: '720p', label: '720p', uri: 'https://example.com/720p.m3u8' },
          ],
          defaultQualityId: 'auto',
        }}
      />,
    );

    const qualityMenuItemBefore = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
      (item) => item.key === 'quality',
    );

    expect(qualityMenuItemBefore?.selectedOptionId).toBe('auto');

    act(() => {
      qualityMenuItemBefore?.onSelectOption('720p');
    });

    const qualityMenuItemAfter = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
      (item) => item.key === 'quality',
    );

    expect(qualityMenuItemAfter?.selectedOptionId).toBe('720p');
  });

  it('updates selectedOptionId for subtitle section after subtitle change', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video-subtitle-highlight.mp4' }}
        tracks={{
          subtitleTracks: [
            { id: 'en', language: 'en', label: 'English', uri: 'https://example.com/en.vtt' },
            { id: 'tr', language: 'tr', label: 'Turkish', uri: 'https://example.com/tr.vtt' },
          ],
          defaultSubtitleTrackId: 'en',
        }}
      />,
    );

    const subtitleMenuItemBefore = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
      (item) => item.key === 'subtitle',
    );

    expect(subtitleMenuItemBefore?.selectedOptionId).toBe('en');

    act(() => {
      subtitleMenuItemBefore?.onSelectOption('tr');
    });

    const subtitleMenuItemAfter = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
      (item) => item.key === 'subtitle',
    );

    expect(subtitleMenuItemAfter?.selectedOptionId).toBe('tr');
  });

  it('emits PiP events and forwards picture-in-picture status callback', () => {
    const onPipEvent = jest.fn();
    const onPictureInPictureStatusChanged = jest.fn();

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video.mp4' }}
        pip={{ enabled: true }}
        onPipEvent={onPipEvent}
        onPictureInPictureStatusChanged={onPictureInPictureStatusChanged}
      />,
    );

    act(() => {
      latestVideoProps?.onPictureInPictureStatusChanged?.({ isActive: true });
      latestVideoProps?.onPictureInPictureStatusChanged?.({ isActive: false });
    });

    expect(onPipEvent).toHaveBeenCalledTimes(2);
    expect(onPipEvent).toHaveBeenNthCalledWith(1, { state: 'active' });
    expect(onPipEvent).toHaveBeenNthCalledWith(2, { state: 'inactive' });
    expect(onPictureInPictureStatusChanged).toHaveBeenCalledTimes(2);
    expect(onPictureInPictureStatusChanged).toHaveBeenNthCalledWith(1, { isActive: true });
    expect(onPictureInPictureStatusChanged).toHaveBeenNthCalledWith(2, { isActive: false });
  });

  it('shows PiP button only when pip.enabled is true', () => {
    const { queryByTestId, rerender } = render(
      <ProMamoPlayer source={{ uri: 'https://example.com/video.mp4' }} />,
    );

    expect(queryByTestId('pro-topright-pip-button')).toBeNull();

    rerender(
      <ProMamoPlayer source={{ uri: 'https://example.com/video.mp4' }} pip={{ enabled: true }} />,
    );

    expect(queryByTestId('pro-topright-pip-button')).not.toBeNull();
  });

  it('requests PiP by emitting entering state and invoking native PiP entry', () => {
    const onPipEvent = jest.fn();
    const { getByTestId } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video.mp4' }}
        pip={{ enabled: true }}
        onPipEvent={onPipEvent}
      />,
    );

    fireEvent.press(getByTestId('pro-topright-pip-button'));

    expect(onPipEvent).toHaveBeenCalledWith({ state: 'entering' });
    expect(mockEnterPictureInPicture).toHaveBeenCalledTimes(1);
    expect(mockRequestPictureInPicture).not.toHaveBeenCalled();
  });

  it('falls back to PiP native bridge request when player ref PiP entry is unavailable', () => {
    mockShouldExposeEnterPictureInPicture = false;

    const onPipEvent = jest.fn();
    const { getByTestId } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video.mp4' }}
        pip={{ enabled: true }}
        onPipEvent={onPipEvent}
      />,
    );

    fireEvent.press(getByTestId('pro-topright-pip-button'));

    expect(onPipEvent).toHaveBeenCalledWith({ state: 'entering' });
    expect(mockEnterPictureInPicture).not.toHaveBeenCalled();
    expect(mockRequestPictureInPicture).toHaveBeenCalledTimes(1);
  });

  it('maps native PiP events to active and exiting states', () => {
    const onPipEvent = jest.fn();

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video.mp4' }}
        pip={{ enabled: true }}
        onPipEvent={onPipEvent}
      />,
    );

    act(() => {
      latestNativePipHandler?.('mamo_pip_active');
      latestNativePipHandler?.('mamo_pip_exiting');
    });

    expect(onPipEvent).toHaveBeenCalledWith({ state: 'active' });
    expect(onPipEvent).toHaveBeenCalledWith({ state: 'exiting' });
  });

  it('subscribes to native PiP events only when pip is enabled and unsubscribes on unmount', () => {
    const { rerender, unmount } = render(
      <ProMamoPlayer source={{ uri: 'https://example.com/video.mp4' }} />,
    );

    expect(mockSubscribeToPipEvents).not.toHaveBeenCalled();

    rerender(
      <ProMamoPlayer source={{ uri: 'https://example.com/video.mp4' }} pip={{ enabled: true }} />,
    );

    expect(mockSubscribeToPipEvents).toHaveBeenCalledTimes(1);

    unmount();

    expect(mockUnsubscribePipEvents).toHaveBeenCalledTimes(1);
  });

  it('randomizes watermark position at configured interval', () => {
    jest.useFakeTimers();
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValueOnce(0.5).mockReturnValueOnce(0.25);

    const { getByText } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video.mp4' }}
        watermark={{ text: 'moving-watermark', randomizePosition: true, intervalMs: 1000 }}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const watermark = getByText('moving-watermark');
    const watermarkStyle = StyleSheet.flatten(watermark.props.style);

    expect(watermarkStyle).toEqual(
      expect.objectContaining({
        top: 25,
        left: 17,
      }),
    );

    randomSpy.mockRestore();
  });

  it('applies themeName styles to ad overlay and watermark text', async () => {
    const { getByText } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/theme-name.mp4' }}
        themeName="light"
        watermark={{ text: 'theme-watermark' }}
        ads={{ adBreaks: [], skipButtonEnabled: true }}
        ima={{ enabled: true, adTagUrl: 'https://example.com/theme-name-adtag' }}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    if (!latestNativeAdsHandler) {
      throw new Error('Native ads handler not captured');
    }

    act(() => {
      latestNativeAdsHandler?.('mamo_ads_started', { adPosition: 'preroll' });
    });

    const adTextStyle = StyleSheet.flatten(getByText('Ad playing...').props.style);
    const skipTextStyle = StyleSheet.flatten(getByText('Skip ad').props.style);
    const watermarkStyle = StyleSheet.flatten(getByText('theme-watermark').props.style);

    expect(adTextStyle.color).toBe('#111827');
    expect(skipTextStyle.color).toBe('#111827');
    expect(watermarkStyle.color).toBe('#111827');
  });

  it('prefers custom theme over themeName for overlay text styling', async () => {
    const customTheme: PlayerThemeConfig = {
      name: 'dark',
      tokens: {
        colors: {
          background: '#0A0A0A',
          backgroundOverlay: '#101010AA',
          primary: '#22C55E',
          primaryText: '#22C55E',
          secondaryText: '#86EFAC',
          accent: '#22C55E',
          danger: '#DC2626',
          border: '#1F2937',
          sliderTrack: '#4B5563',
          sliderThumb: '#22C55E',
        },
        typography: {
          fontFamily: 'System',
          fontSizeSmall: 12,
          fontSizeMedium: 14,
          fontSizeLarge: 20,
        },
        shape: {
          borderRadiusSmall: 8,
          borderRadiusMedium: 12,
          borderRadiusLarge: 16,
        },
      },
    };

    const { getByText } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/custom-theme.mp4' }}
        themeName="light"
        theme={customTheme}
        ads={{ adBreaks: [], skipButtonEnabled: true }}
        ima={{ enabled: true, adTagUrl: 'https://example.com/custom-theme-adtag' }}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    if (!latestNativeAdsHandler) {
      throw new Error('Native ads handler not captured');
    }

    act(() => {
      latestNativeAdsHandler?.('mamo_ads_started', { adPosition: 'preroll' });
    });

    const adTextStyle = StyleSheet.flatten(getByText('Ad playing...').props.style);
    const skipTextStyle = StyleSheet.flatten(getByText('Skip ad').props.style);

    expect(adTextStyle.color).toBe('#22C55E');
    expect(skipTextStyle.color).toBe('#22C55E');
  });

  it('blocks restricted seek directions from pro playback callback', () => {
    const onPlaybackEvent = jest.fn();

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video.mp4' }}
        restrictions={{ disableSeekingForward: true, disableSeekingBackward: true }}
        onPlaybackEvent={onPlaybackEvent}
      />,
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 10 });
      emitPlayback({ type: 'seek', duration: 100, position: 20 });
      emitPlayback({ type: 'seek', duration: 100, position: 5 });
      emitPlayback({ type: 'seek', duration: 100, position: 10 });
    });

    expect(onPlaybackEvent).toHaveBeenCalledTimes(2);
    expect(onPlaybackEvent.mock.calls[0][0].type).toBe('ready');
    expect(onPlaybackEvent.mock.calls[1][0]).toEqual(
      expect.objectContaining({ type: 'seek', position: 10 }),
    );
  });

  it('clamps playback rate to maxPlaybackRate', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/video.mp4' }}
        restrictions={{ maxPlaybackRate: 1.0 }}
        rate={2}
      />,
    );

    expect(latestVideoProps?.rate).toBe(1.0);
  });

  it('uses defaultQualityId variant URI as initial source when qualities are provided', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-default-quality.mp4' }}
        tracks={{
          defaultQualityId: '720p',
          qualities: [
            { id: 'auto', label: 'Auto', uri: 'https://example.com/main-auto.m3u8' },
            { id: '720p', label: '720p', uri: 'https://example.com/main-720p.m3u8' },
          ],
        }}
      />,
    );

    expect(latestVideoProps?.currentQualityId).toBe('720p');
    expect(latestVideoProps?.source).toEqual(
      expect.objectContaining({ uri: 'https://example.com/main-720p.m3u8' }),
    );
  });

  it('falls back to auto quality when no explicit default is configured', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-auto-fallback.mp4' }}
        tracks={{
          qualities: [
            { id: '720p', label: '720p', uri: 'https://example.com/main-720p-fallback.m3u8' },
            { id: 'auto', label: 'Auto', uri: 'https://example.com/main-auto-fallback.m3u8' },
          ],
        }}
      />,
    );

    expect(latestVideoProps?.currentQualityId).toBe('auto');
    expect(latestVideoProps?.source).toEqual(
      expect.objectContaining({ uri: 'https://example.com/main-auto-fallback.m3u8' }),
    );
  });

  it('changes quality source and restores previous position after reload ready event', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-quality-switch.mp4' }}
        tracks={{
          qualities: [
            { id: 'auto', label: 'Auto', uri: 'https://example.com/main-quality-auto.m3u8' },
            { id: '480p', label: '480p', uri: 'https://example.com/main-quality-480p.m3u8' },
          ],
        }}
      />,
    );

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 42 });
    });

    act(() => {
      latestVideoProps?.onQualityChange?.('480p');
    });

    expect(latestVideoProps?.currentQualityId).toBe('480p');
    expect(latestVideoProps?.source).toEqual(
      expect.objectContaining({ uri: 'https://example.com/main-quality-480p.m3u8' }),
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
    });

    expect(mockSeek).toHaveBeenCalledWith(42);
  });

  it('uses tracks.defaultAudioTrackId as initial audio selection when available', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-audio-default.mp4' }}
        tracks={{
          audioTracks: [
            { id: 'en', label: 'English', language: 'en' },
            { id: 'tr', label: 'Türkçe', language: 'tr' },
          ],
          defaultAudioTrackId: 'tr',
        }}
      />,
    );

    expect(latestVideoProps?.defaultAudioTrackId).toBe('tr');
    expect(latestVideoProps?.currentAudioTrackId).toBe('tr');
    expect(latestVideoProps?.audioTracks).toHaveLength(2);
  });

  it('falls back to the first audio track when no valid defaultAudioTrackId is configured', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-audio-fallback.mp4' }}
        tracks={{
          audioTracks: [
            { id: 'en', label: 'English', language: 'en' },
            { id: 'tr', label: 'Türkçe', language: 'tr' },
          ],
          defaultAudioTrackId: 'de',
        }}
      />,
    );

    expect(latestVideoProps?.defaultAudioTrackId).toBe('en');
    expect(latestVideoProps?.currentAudioTrackId).toBe('en');
  });

  it('updates currentAudioTrackId when onAudioTrackChange is triggered', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-audio-change.mp4' }}
        tracks={{
          audioTracks: [
            { id: 'en', label: 'English', language: 'en' },
            { id: 'tr', label: 'Türkçe', language: 'tr' },
          ],
          defaultAudioTrackId: 'en',
        }}
      />,
    );

    act(() => {
      latestVideoProps?.onAudioTrackChange?.('tr');
    });

    expect(latestVideoProps?.currentAudioTrackId).toBe('tr');
  });

  it('passes selectedAudioTrack with language type when the active track has a language', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/audio-native.mp4' }}
        tracks={{
          audioTracks: [
            { id: 'en', label: 'English', language: 'en' },
            { id: 'tr', label: 'Türkçe', language: 'tr' },
          ],
          defaultAudioTrackId: 'en',
        }}
      />,
    );

    expect(latestVideoProps?.selectedAudioTrack).toEqual({ type: 'language', value: 'en' });

    act(() => {
      latestVideoProps?.onAudioTrackChange?.('tr');
    });

    expect(latestVideoProps?.selectedAudioTrack).toEqual({ type: 'language', value: 'tr' });
  });

  it('passes undefined selectedAudioTrack when the active track has no language', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/audio-no-lang.mp4' }}
        tracks={{
          audioTracks: [
            { id: 'en', label: 'English', language: '' },
            { id: 'tr', label: 'Türkçe', language: '' },
          ],
          defaultAudioTrackId: 'en',
        }}
      />,
    );

    expect(latestVideoProps?.selectedAudioTrack).toBeUndefined();
  });

  it('emits audio_track_change analytics when native switching is unavailable (no language)', () => {
    const onEvent = jest.fn();

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/audio-analytics.mp4' }}
        analytics={{ onEvent }}
        tracks={{
          audioTracks: [
            { id: 'en', label: 'English', language: '' },
            { id: 'tr', label: 'Türkçe', language: '' },
          ],
          defaultAudioTrackId: 'en',
        }}
      />,
    );

    act(() => {
      latestVideoProps?.onAudioTrackChange?.('tr');
    });

    const audioTrackEvents = onEvent.mock.calls
      .map(([event]) => event)
      .filter((event) => event.type === 'audio_track_change');

    expect(audioTrackEvents).toHaveLength(1);
    expect(audioTrackEvents[0]).toMatchObject({
      type: 'audio_track_change',
      audioTrackId: 'tr',
    });
  });

  it('does not emit audio_track_change analytics when native switching is available (language present)', () => {
    const onEvent = jest.fn();

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/audio-no-analytics.mp4' }}
        analytics={{ onEvent }}
        tracks={{
          audioTracks: [
            { id: 'en', label: 'English', language: 'en' },
            { id: 'tr', label: 'Türkçe', language: 'tr' },
          ],
          defaultAudioTrackId: 'en',
        }}
      />,
    );

    act(() => {
      latestVideoProps?.onAudioTrackChange?.('tr');
    });

    const audioTrackEvents = onEvent.mock.calls
      .map(([event]) => event)
      .filter((event) => event.type === 'audio_track_change');

    expect(audioTrackEvents).toHaveLength(0);
  });

  it('highlights the active audio track via selectedOptionId in the settings overlay', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/audio-highlight.mp4' }}
        tracks={{
          audioTracks: [
            { id: 'en', label: 'English', language: 'en' },
            { id: 'tr', label: 'Türkçe', language: 'tr' },
          ],
          defaultAudioTrackId: 'en',
        }}
      />,
    );

    const audioItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
      (item) => item.key === 'audio',
    );

    expect(audioItem?.selectedOptionId).toBe('en');

    act(() => {
      latestVideoProps?.onAudioTrackChange?.('tr');
    });

    const audioItemAfterChange = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
      (item) => item.key === 'audio',
    );

    expect(audioItemAfterChange?.selectedOptionId).toBe('tr');
  });

  it('switches to ad source and restores main source after ad ends', () => {
    const mainSource = { uri: 'https://example.com/main.mp4' };
    const adSource = { uri: 'https://example.com/ad.mp4', type: 'video/mp4' as const };

    render(
      <ProMamoPlayer
        source={mainSource}
        ads={{
          adBreaks: [
            {
              type: 'preroll',
              source: adSource,
            },
          ],
        }}
      />,
    );

    expect(latestVideoProps?.source).toEqual(mainSource);
    expect(latestVideoProps?.autoPlay).toBe(false);

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
    });

    expect(latestVideoProps?.source).toEqual(adSource);
    expect(latestVideoProps?.autoPlay).toBe(true);

    act(() => {
      emitPlayback({ type: 'ended', duration: 5, position: 5 });
    });

    expect(latestVideoProps?.source).toEqual(mainSource);
    expect(latestVideoProps?.autoPlay).toBe(true);
  });

  it('restores selected quality source when skipping preroll ad', () => {
    const adSource = { uri: 'https://example.com/ad-skip.mp4', type: 'video/mp4' as const };

    const { getByText } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-with-quality-and-ad.mp4' }}
        tracks={{
          qualities: [
            { id: 'auto', label: 'Auto', uri: 'https://example.com/main-auto-ad.m3u8' },
            { id: '720p', label: '720p', uri: 'https://example.com/main-720-ad.m3u8' },
          ],
        }}
        ads={{
          adBreaks: [
            {
              type: 'preroll',
              source: adSource,
            },
          ],
          skipButtonEnabled: true,
          skipAfterSeconds: 0,
        }}
      />,
    );

    act(() => {
      latestVideoProps?.onQualityChange?.('720p');
    });

    expect(latestVideoProps?.source).toEqual(
      expect.objectContaining({ uri: 'https://example.com/main-720-ad.m3u8' }),
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 120, position: 0 });
    });

    expect(latestVideoProps?.source).toEqual(adSource);

    fireEvent.press(getByText('Skip ad'));

    expect(latestVideoProps?.source).toEqual(
      expect.objectContaining({ uri: 'https://example.com/main-720-ad.m3u8' }),
    );
  });

  it('resumes main content from preserved position after skipping midroll ad', () => {
    const adSource = { uri: 'https://example.com/ad-midroll-skip.mp4', type: 'video/mp4' as const };

    const { getByText } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-midroll-skip.mp4' }}
        ads={{
          adBreaks: [
            {
              type: 'midroll',
              time: 30,
              source: adSource,
            },
          ],
          skipButtonEnabled: true,
          skipAfterSeconds: 0,
        }}
      />,
    );

    act(() => {
      emitPlayback({ type: 'time_update', duration: 120, position: 30 });
    });

    expect(latestVideoProps?.source).toEqual(adSource);

    fireEvent.press(getByText('Skip ad'));

    expect(latestVideoProps?.source).toEqual(
      expect.objectContaining({ uri: 'https://example.com/main-midroll-skip.mp4' }),
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 120, position: 0 });
    });

    expect(mockSeek).toHaveBeenCalledWith(30);
    expect(latestVideoProps?.autoPlay).toBe(true);
  });

  it('emits ad_start analytics when preroll begins on ready', () => {
    const onEvent = jest.fn();
    const sessionId = 'session-preroll-start';

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main.mp4' }}
        analytics={{ onEvent, sessionId }}
        ads={{
          adBreaks: [
            {
              type: 'preroll',
              source: { uri: 'https://example.com/preroll.mp4', type: 'video/mp4' },
            },
          ],
        }}
      />,
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ad_start',
        adPosition: 'preroll',
        mainContentPositionAtAdStart: 0,
        sessionId,
      }),
    );
  });

  it('emits ad_start analytics when midroll switches into ad mode', () => {
    const onEvent = jest.fn();

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-midroll-analytics.mp4' }}
        analytics={{ onEvent }}
        ads={{
          adBreaks: [
            {
              type: 'midroll',
              time: 30,
              source: { uri: 'https://example.com/midroll-analytics.mp4', type: 'video/mp4' },
            },
          ],
        }}
      />,
    );

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 30 });
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ad_start',
      }),
    );
  });

  it('emits ad_complete analytics when ad playback ends successfully', () => {
    const onEvent = jest.fn();
    const sessionId = 'session-ad-complete';

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-for-ad-complete.mp4' }}
        analytics={{ onEvent, sessionId }}
        ads={{
          adBreaks: [
            {
              type: 'preroll',
              source: { uri: 'https://example.com/preroll-for-ad-complete.mp4', type: 'video/mp4' },
            },
          ],
        }}
      />,
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
      emitPlayback({ type: 'ended', duration: 5, position: 5 });
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ad_complete',
        adPosition: 'preroll',
        mainContentPositionAtAdStart: 0,
        sessionId,
      }),
    );
  });

  it('emits ad_error analytics when ad video fails to load', () => {
    const onEvent = jest.fn();
    const sessionId = 'session-ad-error';

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-for-ad-error.mp4' }}
        analytics={{ onEvent, sessionId }}
        ads={{
          adBreaks: [
            {
              type: 'preroll',
              source: { uri: 'https://example.com/preroll-for-ad-error.mp4', type: 'video/mp4' },
            },
          ],
        }}
      />,
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
      emitPlayback({
        type: 'error',
        duration: 5,
        position: 0,
        error: { message: 'Ad load failed' },
      });
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ad_error',
        adPosition: 'preroll',
        errorMessage: 'Ad load failed',
        mainContentPositionAtAdStart: 0,
        sessionId,
      }),
    );
  });

  it('does not switch source when ads config is missing', () => {
    const mainSource = { uri: 'https://example.com/main-only.mp4' };

    render(<ProMamoPlayer source={mainSource} />);

    expect(latestVideoProps?.source).toEqual(mainSource);

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 0 });
      emitPlayback({ type: 'ended', duration: 100, position: 100 });
    });

    expect(latestVideoProps?.source).toEqual(mainSource);
  });

  it('switches to midroll ad only when configured time is reached', () => {
    const mainSource = { uri: 'https://example.com/main-midroll.mp4' };
    const adSource = { uri: 'https://example.com/midroll-ad.mp4', type: 'video/mp4' as const };

    render(
      <ProMamoPlayer
        source={mainSource}
        ads={{
          adBreaks: [
            {
              type: 'midroll',
              time: 30,
              source: adSource,
            },
          ],
        }}
      />,
    );

    expect(latestVideoProps?.source).toEqual(mainSource);

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 29 });
    });

    expect(latestVideoProps?.source).toEqual(mainSource);

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 30 });
    });

    expect(latestVideoProps?.source).toEqual(adSource);

    act(() => {
      emitPlayback({ type: 'ended', duration: 5, position: 5 });
    });

    expect(latestVideoProps?.source).toEqual(mainSource);
  });

  it('plays each midroll only once', () => {
    const mainSource = { uri: 'https://example.com/main-midroll-once.mp4' };
    const adSource = { uri: 'https://example.com/midroll-once-ad.mp4', type: 'video/mp4' as const };

    render(
      <ProMamoPlayer
        source={mainSource}
        ads={{
          adBreaks: [
            {
              type: 'midroll',
              time: 30,
              source: adSource,
            },
          ],
        }}
      />,
    );

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 30 });
    });

    expect(latestVideoProps?.source).toEqual(adSource);

    act(() => {
      emitPlayback({ type: 'ended', duration: 5, position: 5 });
    });

    expect(latestVideoProps?.source).toEqual(mainSource);

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 30 });
      emitPlayback({ type: 'time_update', duration: 100, position: 45 });
    });

    expect(latestVideoProps?.source).toEqual(mainSource);
  });

  it('switches to postroll ad only on ended event and then restores main source', () => {
    const mainSource = { uri: 'https://example.com/main-postroll.mp4' };
    const adSource = { uri: 'https://example.com/postroll-ad.mp4', type: 'video/mp4' as const };

    render(
      <ProMamoPlayer
        source={mainSource}
        ads={{
          adBreaks: [
            {
              type: 'postroll',
              source: adSource,
            },
          ],
        }}
      />,
    );

    expect(latestVideoProps?.source).toEqual(mainSource);

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 99 });
    });

    expect(latestVideoProps?.source).toEqual(mainSource);

    act(() => {
      emitPlayback({ type: 'ended', duration: 100, position: 100 });
    });

    expect(latestVideoProps?.source).toEqual(adSource);

    act(() => {
      emitPlayback({ type: 'ended', duration: 5, position: 5 });
    });

    expect(latestVideoProps?.source).toEqual(mainSource);
  });

  it('delays session_end analytics until postroll ad ends', () => {
    const onEvent = jest.fn();

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-with-postroll.mp4' }}
        analytics={{ onEvent }}
        ads={{
          adBreaks: [
            {
              type: 'postroll',
              source: {
                uri: 'https://example.com/postroll-for-session-end.mp4',
                type: 'video/mp4',
              },
            },
          ],
        }}
      />,
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
      emitPlayback({ type: 'ended', duration: 100, position: 100 });
    });

    const analyticsTypesBeforeAdEnd = onEvent.mock.calls.map(([event]) => event.type);

    expect(analyticsTypesBeforeAdEnd).toContain('ended');
    expect(analyticsTypesBeforeAdEnd).not.toContain('session_end');

    act(() => {
      emitPlayback({ type: 'ended', duration: 5, position: 5 });
    });

    const analyticsTypesAfterAdEnd = onEvent.mock.calls.map(([event]) => event.type);

    expect(analyticsTypesAfterAdEnd.filter((type) => type === 'session_end')).toHaveLength(1);
  });

  it('loads and subscribes to native IMA on mount and releases on unmount', async () => {
    const view = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-native-ima.mp4' }}
        ima={{ enabled: true, adTagUrl: 'https://example.com/native-adtag' }}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockLoadAds).toHaveBeenCalledWith('https://example.com/native-adtag');
    expect(mockSubscribeToAdsEvents).toHaveBeenCalledTimes(1);

    view.unmount();

    expect(mockUnsubscribeAdsEvents).toHaveBeenCalledTimes(1);
    expect(mockReleaseAds).toHaveBeenCalledTimes(1);
  });

  it('handles native IMA events and falls back to simulated ads after native error', async () => {
    const onEvent = jest.fn();
    const sessionId = 'session-native-ads';
    const nativeAdTagUrl = 'https://example.com/native-adtag-events';
    const adSource = {
      uri: 'https://example.com/simulated-fallback-preroll.mp4',
      type: 'video/mp4' as const,
    };

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-native-events.mp4' }}
        analytics={{ onEvent, sessionId }}
        ima={{ enabled: true, adTagUrl: nativeAdTagUrl }}
        ads={{
          adBreaks: [
            {
              type: 'preroll',
              source: adSource,
            },
          ],
        }}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    if (!latestNativeAdsHandler) {
      throw new Error('Native ads handler not captured');
    }

    act(() => {
      emitPlayback({ type: 'time_update', duration: 100, position: 12 });
      latestNativeAdsHandler?.('mamo_ads_started', { adPosition: 'preroll' });
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ad_start',
        adTagUrl: nativeAdTagUrl,
        adPosition: 'preroll',
        mainContentPositionAtAdStart: 12,
        sessionId,
      }),
    );
    expect(latestVideoProps?.autoPlay).toBe(false);

    act(() => {
      latestNativeAdsHandler?.('mamo_ads_completed', { adPosition: 'preroll' });
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ad_complete',
        adTagUrl: nativeAdTagUrl,
        adPosition: 'preroll',
        mainContentPositionAtAdStart: 12,
        sessionId,
      }),
    );
    expect(latestVideoProps?.autoPlay).toBe(true);

    act(() => {
      latestNativeAdsHandler?.('mamo_ads_error', {
        adPosition: 'preroll',
        message: 'native failure',
      });
    });

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'ad_error',
        adTagUrl: nativeAdTagUrl,
        adPosition: 'preroll',
        errorMessage: 'native failure',
        mainContentPositionAtAdStart: 12,
        sessionId,
      }),
    );

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
    });

    expect(latestVideoProps?.source).toEqual(adSource);
  });

  it('falls back to simulated ads when native loadAds fails', async () => {
    mockLoadAds.mockRejectedValueOnce(new Error('native module missing'));

    const adSource = {
      uri: 'https://example.com/fallback-after-load-failure.mp4',
      type: 'video/mp4' as const,
    };

    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/main-load-failure.mp4' }}
        ima={{ enabled: true, adTagUrl: 'https://example.com/failing-adtag' }}
        ads={{
          adBreaks: [
            {
              type: 'preroll',
              source: adSource,
            },
          ],
        }}
      />,
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      emitPlayback({ type: 'ready', duration: 100, position: 0 });
    });

    expect(latestVideoProps?.source).toEqual(adSource);
  });

  it('resolves initial subtitle track from explicit default id', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/subtitles-default-id.mp4' }}
        tracks={{
          subtitleTracks: [
            {
              id: 'en',
              language: 'en',
              label: 'English',
              uri: 'https://example.com/subtitles-en.vtt',
            },
            {
              id: 'tr',
              language: 'tr',
              label: 'Turkish',
              uri: 'https://example.com/subtitles-tr.vtt',
            },
          ],
          defaultSubtitleTrackId: 'tr',
        }}
      />,
    );

    expect(latestVideoProps?.currentSubtitleTrackId).toBe('tr');
    expect(latestVideoProps?.selectedTextTrack).toEqual({ type: 'title', value: 'Turkish' });
    expect(latestVideoProps?.source).toEqual(
      expect.objectContaining({
        textTracks: [
          {
            title: 'English',
            language: 'en',
            type: 'text/vtt',
            uri: 'https://example.com/subtitles-en.vtt',
          },
          {
            title: 'Turkish',
            language: 'tr',
            type: 'text/vtt',
            uri: 'https://example.com/subtitles-tr.vtt',
          },
        ],
        selectedTextTrack: { type: 'title', value: 'Turkish' },
      }),
    );
    expect(latestVideoProps?.subtitleTracks).toHaveLength(2);
    expect(latestVideoProps?.textTracks).toEqual([
      {
        title: 'English',
        language: 'en',
        type: 'text/vtt',
        uri: 'https://example.com/subtitles-en.vtt',
      },
      {
        title: 'Turkish',
        language: 'tr',
        type: 'text/vtt',
        uri: 'https://example.com/subtitles-tr.vtt',
      },
    ]);
  });

  it('applies subtitles when source is a string uri', () => {
    render(
      <ProMamoPlayer
        source={'https://example.com/subtitles-string-source.mp4'}
        tracks={{
          subtitleTracks: [
            {
              id: 'en',
              language: 'en',
              label: 'English',
              uri: 'https://example.com/subtitles-en.vtt',
              isDefault: true,
            },
          ],
        }}
      />,
    );

    expect(latestVideoProps?.selectedTextTrack).toEqual({ type: 'title', value: 'English' });
    expect(latestVideoProps?.source).toEqual(
      expect.objectContaining({
        uri: 'https://example.com/subtitles-string-source.mp4',
        textTracks: [
          {
            title: 'English',
            language: 'en',
            type: 'text/vtt',
            uri: 'https://example.com/subtitles-en.vtt',
          },
        ],
        selectedTextTrack: { type: 'title', value: 'English' },
      }),
    );
  });

  it('resolves initial subtitle track from isDefault when no explicit default id', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/subtitles-flag-default.mp4' }}
        tracks={{
          subtitleTracks: [
            {
              id: 'en',
              language: 'en',
              label: 'English',
              uri: 'https://example.com/subtitles-en.vtt',
            },
            {
              id: 'es',
              language: 'es',
              label: 'Spanish',
              uri: 'https://example.com/subtitles-es.vtt',
              isDefault: true,
            },
          ],
        }}
      />,
    );

    expect(latestVideoProps?.currentSubtitleTrackId).toBe('es');
    expect(latestVideoProps?.selectedTextTrack).toEqual({ type: 'title', value: 'Spanish' });
  });

  it('defaults subtitles to off when subtitle tracks exist without default', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/subtitles-off-default.mp4' }}
        tracks={{
          subtitleTracks: [
            {
              id: 'en',
              language: 'en',
              label: 'English',
              uri: 'https://example.com/subtitles-en.vtt',
            },
          ],
        }}
      />,
    );

    expect(latestVideoProps?.currentSubtitleTrackId).toBe('off');
    expect(latestVideoProps?.selectedTextTrack).toEqual({ type: 'disabled' });
  });

  it('changes subtitle track and allows switching off', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/subtitles-change.mp4' }}
        tracks={{
          subtitleTracks: [
            {
              id: 'en',
              language: 'en',
              label: 'English',
              uri: 'https://example.com/subtitles-en.vtt',
            },
            {
              id: 'fr',
              language: 'fr',
              label: 'French',
              uri: 'https://example.com/subtitles-fr.vtt',
            },
          ],
          defaultSubtitleTrackId: 'en',
        }}
      />,
    );

    act(() => {
      latestVideoProps?.onSubtitleTrackChange?.('fr');
    });

    expect(latestVideoProps?.currentSubtitleTrackId).toBe('fr');
    expect(latestVideoProps?.selectedTextTrack).toEqual({ type: 'title', value: 'French' });

    act(() => {
      latestVideoProps?.onSubtitleTrackChange?.('off');
    });

    expect(latestVideoProps?.currentSubtitleTrackId).toBe('off');
    expect(latestVideoProps?.selectedTextTrack).toEqual({ type: 'disabled' });
  });

  it('keeps subtitle selection stable when toggling fullscreen', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/subtitles-fullscreen-stable.mp4' }}
        tracks={{
          subtitleTracks: [
            {
              id: 'en',
              language: 'en',
              label: 'English',
              uri: 'https://example.com/subtitles-fullscreen-en.vtt',
            },
            {
              id: 'fr',
              language: 'fr',
              label: 'French',
              uri: 'https://example.com/subtitles-fullscreen-fr.vtt',
            },
          ],
          defaultSubtitleTrackId: 'en',
        }}
      />,
    );

    act(() => {
      latestVideoProps?.onSubtitleTrackChange?.('fr');
    });

    expect(latestVideoProps?.currentSubtitleTrackId).toBe('fr');
    expect(latestVideoProps?.selectedTextTrack).toEqual({ type: 'title', value: 'French' });

    act(() => {
      latestVideoProps?.onFullscreenChange?.(true);
    });

    expect(latestVideoProps?.currentSubtitleTrackId).toBe('fr');
    expect(latestVideoProps?.selectedTextTrack).toEqual({ type: 'disabled' });

    act(() => {
      latestVideoProps?.onFullscreenChange?.(false);
    });

    expect(latestVideoProps?.currentSubtitleTrackId).toBe('fr');
    expect(latestVideoProps?.selectedTextTrack).toEqual({ type: 'title', value: 'French' });
  });

  it('restores playback position after entering and exiting fullscreen', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/fullscreen-restore-position.mp4' }}
        tracks={{
          subtitleTracks: [
            {
              id: 'en',
              language: 'en',
              label: 'English',
              uri: 'https://example.com/fullscreen-restore-position-en.vtt',
            },
          ],
          defaultSubtitleTrackId: 'en',
        }}
      />,
    );

    act(() => {
      emitPlayback({ type: 'time_update', duration: 200, position: 37 });
      latestVideoProps?.onFullscreenChange?.(true);
      emitPlayback({ type: 'ready', duration: 200, position: 0 });
    });

    expect(mockSeek).toHaveBeenCalledWith(37);

    act(() => {
      emitPlayback({ type: 'time_update', duration: 200, position: 52 });
      latestVideoProps?.onFullscreenChange?.(false);
      emitPlayback({ type: 'ready', duration: 200, position: 0 });
    });

    expect(mockSeek).toHaveBeenLastCalledWith(52);
  });

  it('hides quality, audio and subtitle settings when settingsOverlay.enabled is false', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/settings-hidden-all.mp4' }}
        tracks={{
          qualities: [
            {
              id: 'auto',
              label: 'Auto',
              uri: 'https://example.com/auto.m3u8',
              isDefault: true,
            },
            {
              id: '720p',
              label: '720p',
              uri: 'https://example.com/720.m3u8',
            },
          ],
          audioTracks: [
            { id: 'en', label: 'English', language: 'en' },
            { id: 'tr', label: 'Turkish', language: 'tr' },
          ],
          subtitleTracks: [
            {
              id: 'en',
              language: 'en',
              label: 'English',
              uri: 'https://example.com/subtitles-en.vtt',
            },
            {
              id: 'tr',
              language: 'tr',
              label: 'Turkish',
              uri: 'https://example.com/subtitles-tr.vtt',
            },
          ],
        }}
        settingsOverlay={{ enabled: false }}
      />,
    );

    expect(latestVideoProps?.currentQualityId).toBeUndefined();
    expect(latestVideoProps?.onQualityChange).toBeUndefined();
    expect(latestVideoProps?.audioTracks).toBeUndefined();
    expect(latestVideoProps?.currentAudioTrackId).toBeUndefined();
    expect(latestVideoProps?.onAudioTrackChange).toBeUndefined();
    expect(latestVideoProps?.subtitleTracks).toBeUndefined();
    expect(latestVideoProps?.currentSubtitleTrackId).toBeUndefined();
    expect(latestVideoProps?.onSubtitleTrackChange).toBeUndefined();
  });

  it('hides only subtitle settings when settingsOverlay.showSubtitles is false', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/settings-hide-subtitles.mp4' }}
        tracks={{
          qualities: [
            {
              id: 'auto',
              label: 'Auto',
              uri: 'https://example.com/auto.m3u8',
              isDefault: true,
            },
          ],
          audioTracks: [
            { id: 'en', label: 'English', language: 'en' },
            { id: 'tr', label: 'Turkish', language: 'tr' },
          ],
          subtitleTracks: [
            {
              id: 'en',
              language: 'en',
              label: 'English',
              uri: 'https://example.com/subtitles-en.vtt',
            },
          ],
          defaultAudioTrackId: 'tr',
          defaultSubtitleTrackId: 'en',
        }}
        settingsOverlay={{ showSubtitles: false }}
      />,
    );

    expect(latestVideoProps?.currentQualityId).toBe('auto');
    expect(latestVideoProps?.onQualityChange).toBeDefined();
    expect(latestVideoProps?.audioTracks).toHaveLength(2);
    expect(latestVideoProps?.currentAudioTrackId).toBe('tr');
    expect(latestVideoProps?.onAudioTrackChange).toBeDefined();
    expect(latestVideoProps?.subtitleTracks).toBeUndefined();
    expect(latestVideoProps?.currentSubtitleTrackId).toBeUndefined();
    expect(latestVideoProps?.onSubtitleTrackChange).toBeUndefined();
  });

  it('hides only quality settings when settingsOverlay.showQuality is false', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/settings-hide-quality.mp4' }}
        tracks={{
          qualities: [
            {
              id: 'auto',
              label: 'Auto',
              uri: 'https://example.com/auto.m3u8',
              isDefault: true,
            },
            {
              id: '720p',
              label: '720p',
              uri: 'https://example.com/720.m3u8',
            },
          ],
          audioTracks: [
            { id: 'en', label: 'English', language: 'en' },
            { id: 'tr', label: 'Turkish', language: 'tr' },
          ],
          subtitleTracks: [
            {
              id: 'en',
              language: 'en',
              label: 'English',
              uri: 'https://example.com/subtitles-en.vtt',
            },
          ],
          defaultAudioTrackId: 'tr',
          defaultSubtitleTrackId: 'en',
        }}
        settingsOverlay={{ showQuality: false }}
      />,
    );

    expect(latestVideoProps?.currentQualityId).toBeUndefined();
    expect(latestVideoProps?.onQualityChange).toBeUndefined();
    expect(latestVideoProps?.audioTracks).toHaveLength(2);
    expect(latestVideoProps?.currentAudioTrackId).toBe('tr');
    expect(latestVideoProps?.onAudioTrackChange).toBeDefined();
    expect(latestVideoProps?.subtitleTracks).toHaveLength(1);
    expect(latestVideoProps?.currentSubtitleTrackId).toBe('en');
    expect(latestVideoProps?.onSubtitleTrackChange).toBeDefined();
  });

  it('hides only audio settings when settingsOverlay.showAudioTracks is false', () => {
    render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/settings-hide-audio.mp4' }}
        tracks={{
          qualities: [
            {
              id: 'auto',
              label: 'Auto',
              uri: 'https://example.com/auto.m3u8',
              isDefault: true,
            },
          ],
          audioTracks: [
            { id: 'en', label: 'English', language: 'en' },
            { id: 'tr', label: 'Turkish', language: 'tr' },
          ],
          subtitleTracks: [
            {
              id: 'en',
              language: 'en',
              label: 'English',
              uri: 'https://example.com/subtitles-en.vtt',
            },
          ],
          defaultAudioTrackId: 'tr',
          defaultSubtitleTrackId: 'en',
        }}
        settingsOverlay={{ showAudioTracks: false }}
      />,
    );

    expect(latestVideoProps?.currentQualityId).toBe('auto');
    expect(latestVideoProps?.onQualityChange).toBeDefined();
    expect(latestVideoProps?.audioTracks).toBeUndefined();
    expect(latestVideoProps?.currentAudioTrackId).toBeUndefined();
    expect(latestVideoProps?.onAudioTrackChange).toBeUndefined();
    expect(latestVideoProps?.subtitleTracks).toHaveLength(1);
    expect(latestVideoProps?.currentSubtitleTrackId).toBe('en');
    expect(latestVideoProps?.onSubtitleTrackChange).toBeDefined();
  });

  it('opens and closes the settings overlay from controls', () => {
    const { getByTestId, queryByTestId, getByLabelText } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/settings-overlay-open-close.mp4' }}
        tracks={{
          qualities: [
            {
              id: 'auto',
              label: 'Auto',
              uri: 'https://example.com/auto.m3u8',
              isDefault: true,
            },
          ],
          subtitleTracks: [
            {
              id: 'en',
              language: 'en',
              label: 'English',
              uri: 'https://example.com/subtitles-en.vtt',
            },
          ],
        }}
      />,
    );

    expect(queryByTestId('pro-settings-overlay')).toBeNull();

    fireEvent.press(getByTestId('pro-settings-button'));
    expect(getByTestId('pro-settings-overlay')).toBeTruthy();

    fireEvent.press(getByLabelText('Close settings overlay background'));
    expect(queryByTestId('pro-settings-overlay')).toBeNull();

    fireEvent.press(getByTestId('pro-settings-button'));
    expect(getByTestId('pro-settings-overlay')).toBeTruthy();

    fireEvent.press(getByLabelText('Close settings overlay'));
    expect(queryByTestId('pro-settings-overlay')).toBeNull();
  });

  it('renders modern ott main controls and moves pip into settings overlay', () => {
    const { getByTestId, queryByTestId, getByText } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/ott-controls-layout.mp4' }}
        layoutVariant="ott"
        pip={{ enabled: true }}
        tracks={{
          qualities: [
            {
              id: 'auto',
              label: 'Auto',
              uri: 'https://example.com/auto.m3u8',
              isDefault: true,
            },
          ],
        }}
      />,
    );

    expect(getByTestId('pro-transport-play-toggle')).toBeTruthy();
    expect(getByTestId('pro-transport-seek-back-10')).toBeTruthy();
    expect(getByTestId('pro-transport-seek-forward-10')).toBeTruthy();
    expect(getByTestId('pro-transport-settings')).toBeTruthy();
    expect(getByTestId('pro-transport-fullscreen')).toBeTruthy();

    expect(queryByTestId('pro-settings-button')).toBeNull();
    expect(queryByTestId('pro-topright-pip-button')).toBeNull();
    expect(queryByTestId('pro-settings-pip-button')).toBeNull();

    expect(getByText('Play')).toBeTruthy();

    act(() => {
      emitPlayback({ type: 'play', duration: 100, position: 0 });
    });

    expect(getByText('Pause')).toBeTruthy();

    act(() => {
      emitPlayback({ type: 'pause', duration: 100, position: 5 });
    });

    expect(getByText('Play')).toBeTruthy();

    fireEvent.press(getByTestId('pro-transport-settings'));

    expect(getByTestId('pro-settings-pip-button')).toBeTruthy();
  });

  it('toggles paused state from transport button when paused prop is controlled', () => {
    const { getByTestId } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/controlled-paused-toggle.mp4' }}
        paused={false}
        layoutVariant="ott"
      />,
    );

    expect(latestVideoProps?.paused).toBe(false);

    fireEvent.press(getByTestId('pro-transport-play-toggle'));
    expect(latestVideoProps?.paused).toBe(true);

    fireEvent.press(getByTestId('pro-transport-play-toggle'));
    expect(latestVideoProps?.paused).toBe(false);
  });

  it('passes playback position and duration into core timeline', () => {
    const { getByTestId } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/ott-progress-ratio.mp4' }}
        layoutVariant="ott"
      />,
    );

    expect(getByTestId('mamoplayer-core-timeline')).toBeTruthy();
    expect(latestTimelineProps?.duration).toBe(0);
    expect(latestTimelineProps?.position).toBe(0);

    act(() => {
      emitPlayback({ type: 'time_update', duration: 200, position: 50 });
    });

    expect(latestTimelineProps?.duration).toBe(200);
    expect(latestTimelineProps?.position).toBe(50);
  });

  it('shows scrub thumbnail while scrubbing and hides it on scrub end', () => {
    const { queryByTestId, getByTestId } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/ott-scrub-thumbnail.mp4' }}
        layoutVariant="ott"
        thumbnails={{
          frames: [
            { time: 0, uri: 'https://example.com/thumb-0.jpg' },
            { time: 15, uri: 'https://example.com/thumb-15.jpg' },
            { time: 30, uri: 'https://example.com/thumb-30.jpg' },
          ],
        }}
      />,
    );

    expect(getByTestId('mamoplayer-core-timeline')).toBeTruthy();
    expect(queryByTestId('pro-scrub-thumbnail')).toBeNull();

    act(() => {
      latestTimelineProps?.onScrubStart?.();
      latestTimelineProps?.onSeek?.(22);
    });

    expect(queryByTestId('pro-scrub-thumbnail')).toBeTruthy();

    act(() => {
      latestTimelineProps?.onScrubEnd?.(22);
    });

    expect(mockSeek).toHaveBeenCalledWith(22);
    expect(queryByTestId('pro-scrub-thumbnail')).toBeNull();
  });

  it('seeks backward and forward from ott transport controls', () => {
    const { getByTestId } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/ott-seek-controls.mp4' }}
        layoutVariant="ott"
      />,
    );

    act(() => {
      emitPlayback({ type: 'time_update', duration: 45, position: 40 });
    });

    fireEvent.press(getByTestId('pro-transport-seek-back-10'));
    fireEvent.press(getByTestId('pro-transport-seek-forward-10'));

    expect(mockSeek).toHaveBeenNthCalledWith(1, 30);
    expect(mockSeek).toHaveBeenNthCalledWith(2, 45);
  });

  it('renders only enabled settings sections in the overlay', () => {
    const { getByTestId, queryByText, getByText } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/settings-overlay-sections.mp4' }}
        tracks={{
          qualities: [
            {
              id: 'auto',
              label: 'Auto',
              uri: 'https://example.com/auto.m3u8',
              isDefault: true,
            },
            {
              id: '720p',
              label: '720p',
              uri: 'https://example.com/720.m3u8',
            },
          ],
          audioTracks: [
            { id: 'en', label: 'English', language: 'en' },
            { id: 'tr', label: 'Turkish', language: 'tr' },
          ],
          subtitleTracks: [
            {
              id: 'en',
              language: 'en',
              label: 'English',
              uri: 'https://example.com/subtitles-en.vtt',
            },
          ],
        }}
        settingsOverlay={{ showSubtitles: false }}
      />,
    );

    fireEvent.press(getByTestId('pro-settings-button'));

    expect(getByText('Quality')).toBeTruthy();
    expect(getByText('Audio')).toBeTruthy();
    expect(queryByText('Subtitles')).toBeNull();
  });

  it('hides audio settings when dub languages are not different', () => {
    const { getByTestId, queryByText, getByText } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/settings-overlay-audio-languages.mp4' }}
        tracks={{
          qualities: [
            {
              id: 'auto',
              label: 'Auto',
              uri: 'https://example.com/auto.m3u8',
              isDefault: true,
            },
          ],
          audioTracks: [
            { id: 'en-main', label: 'English', language: 'en' },
            { id: 'en-commentary', label: 'English', language: 'en' },
          ],
        }}
      />,
    );

    fireEvent.press(getByTestId('pro-settings-button'));

    expect(getByText('Quality')).toBeTruthy();
    expect(queryByText('Audio')).toBeNull();
    expect(latestVideoProps?.audioTracks).toBeUndefined();
    expect(latestVideoProps?.onAudioTrackChange).toBeUndefined();
  });

  it('highlights current quality, audio and subtitle selections in settings overlay', () => {
    const { getByTestId } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/settings-overlay-current-selections.mp4' }}
        tracks={{
          qualities: [
            {
              id: 'auto',
              label: 'Auto',
              uri: 'https://example.com/auto.m3u8',
              isDefault: true,
            },
            {
              id: '720p',
              label: '720p',
              uri: 'https://example.com/720.m3u8',
            },
          ],
          audioTracks: [
            { id: 'en', label: 'English', language: 'en' },
            { id: 'tr', label: 'Turkish', language: 'tr' },
          ],
          subtitleTracks: [
            {
              id: 'en',
              language: 'en',
              label: 'English',
              uri: 'https://example.com/subtitles-en.vtt',
            },
          ],
          defaultQualityId: 'auto',
          defaultAudioTrackId: 'tr',
          defaultSubtitleTrackId: 'off',
        }}
      />,
    );

    fireEvent.press(getByTestId('pro-settings-button'));

    expect(within(getByTestId('pro-settings-option-quality-auto')).getByText('Current')).toBeTruthy();
    expect(within(getByTestId('pro-settings-option-audio-tr')).getByText('Current')).toBeTruthy();
    expect(within(getByTestId('pro-settings-option-subtitles-off')).getByText('Current')).toBeTruthy();

    fireEvent.press(getByTestId('pro-settings-option-subtitles-en'));
    expect(latestVideoProps?.currentSubtitleTrackId).toBe('en');
    expect(getByTestId('pro-settings-overlay')).toBeTruthy();
    expect(within(getByTestId('pro-settings-option-subtitles-en')).getByText('Current')).toBeTruthy();
  });

  it('selects quality, audio and subtitle options from the settings overlay', () => {
    const { getByTestId } = render(
      <ProMamoPlayer
        source={{ uri: 'https://example.com/settings-overlay-select-options.mp4' }}
        tracks={{
          qualities: [
            {
              id: 'auto',
              label: 'Auto',
              uri: 'https://example.com/auto.m3u8',
              isDefault: true,
            },
            {
              id: '720p',
              label: '720p',
              uri: 'https://example.com/720.m3u8',
            },
          ],
          audioTracks: [
            { id: 'en', label: 'English', language: 'en' },
            { id: 'tr', label: 'Turkish', language: 'tr' },
          ],
          subtitleTracks: [
            {
              id: 'en',
              language: 'en',
              label: 'English',
              uri: 'https://example.com/subtitles-en.vtt',
            },
          ],
          defaultQualityId: 'auto',
          defaultAudioTrackId: 'en',
          defaultSubtitleTrackId: 'off',
        }}
      />,
    );

    fireEvent.press(getByTestId('pro-settings-button'));

    fireEvent.press(getByTestId('pro-settings-option-quality-720p'));
    expect(latestVideoProps?.currentQualityId).toBe('720p');

    fireEvent.press(getByTestId('pro-settings-option-audio-tr'));
    expect(latestVideoProps?.currentAudioTrackId).toBe('tr');

    fireEvent.press(getByTestId('pro-settings-option-subtitles-en'));
    expect(latestVideoProps?.currentSubtitleTrackId).toBe('en');

    fireEvent.press(getByTestId('pro-settings-option-subtitles-off'));
    expect(latestVideoProps?.currentSubtitleTrackId).toBe('off');
  });

  describe('settings overlay behavior', () => {
    describe('quality options', () => {
      it('renders quality option rows in the overlay when tracks.qualities is provided', () => {
        const { getByTestId, queryByTestId } = render(
          <ProMamoPlayer
            source={{ uri: 'https://example.com/video.mp4' }}
            tracks={{
              qualities: [
                { id: 'auto', label: 'Auto', uri: 'https://example.com/auto.m3u8', isDefault: true },
                { id: '720p', label: '720p', uri: 'https://example.com/720.m3u8' },
                { id: '1080p', label: '1080p', uri: 'https://example.com/1080.m3u8' },
              ],
              defaultQualityId: 'auto',
            }}
          />,
        );

        expect(queryByTestId('pro-settings-overlay')).toBeNull();

        fireEvent.press(getByTestId('pro-topright-hd-button'));

        expect(getByTestId('pro-settings-overlay')).toBeTruthy();
        expect(getByTestId('pro-settings-option-quality-auto')).toBeTruthy();
        expect(getByTestId('pro-settings-option-quality-720p')).toBeTruthy();
        expect(getByTestId('pro-settings-option-quality-1080p')).toBeTruthy();
      });

      it('does not show the quality settings button when tracks.qualities is absent', () => {
        const { queryByTestId } = render(
          <ProMamoPlayer source={{ uri: 'https://example.com/video.mp4' }} />,
        );

        expect(queryByTestId('pro-topright-hd-button')).toBeNull();
        expect(queryByTestId('pro-settings-overlay')).toBeNull();
      });
    });

    describe('subtitle options', () => {
      it('adds subtitle option rows to core extraMenuItems when tracks.subtitleTracks is provided', () => {
        render(
          <ProMamoPlayer
            source={{ uri: 'https://example.com/video.mp4' }}
            tracks={{
              subtitleTracks: [
                { id: 'en', language: 'en', label: 'English', uri: 'https://example.com/en.vtt' },
                { id: 'fr', language: 'fr', label: 'French', uri: 'https://example.com/fr.vtt' },
              ],
            }}
          />,
        );

        const subtitleItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
          (item) => item.key === 'subtitle',
        );

        expect(subtitleItem).toBeDefined();
        expect(subtitleItem?.options).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: 'en', label: 'English' }),
            expect.objectContaining({ id: 'fr', label: 'French' }),
            expect.objectContaining({ id: 'off', label: 'Off' }),
          ]),
        );
        expect(subtitleItem?.options).toHaveLength(3);
      });

      it('omits subtitle menu item when tracks.subtitleTracks is absent', () => {
        render(
          <ProMamoPlayer source={{ uri: 'https://example.com/video.mp4' }} />,
        );

        const subtitleItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
          (item) => item.key === 'subtitle',
        );

        expect(subtitleItem).toBeUndefined();
      });
    });

    describe('audio/dub options', () => {
      it('adds audio option rows to core extraMenuItems when tracks.audioTracks has multiple distinct languages', () => {
        render(
          <ProMamoPlayer
            source={{ uri: 'https://example.com/video.mp4' }}
            tracks={{
              audioTracks: [
                { id: 'en', label: 'English', language: 'en' },
                { id: 'de', label: 'German', language: 'de' },
                { id: 'tr', label: 'Turkish', language: 'tr' },
              ],
            }}
          />,
        );

        const audioItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
          (item) => item.key === 'audio',
        );

        expect(audioItem).toBeDefined();
        expect(audioItem?.options).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ id: 'en', label: 'English' }),
            expect.objectContaining({ id: 'de', label: 'German' }),
            expect.objectContaining({ id: 'tr', label: 'Turkish' }),
          ]),
        );
        expect(audioItem?.options).toHaveLength(3);
      });

      it('omits audio menu item when all audio tracks share the same language', () => {
        render(
          <ProMamoPlayer
            source={{ uri: 'https://example.com/video.mp4' }}
            tracks={{
              audioTracks: [
                { id: 'en-main', label: 'English', language: 'en' },
                { id: 'en-commentary', label: 'Commentary', language: 'en' },
              ],
            }}
          />,
        );

        const audioItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
          (item) => item.key === 'audio',
        );

        expect(audioItem).toBeUndefined();
      });

      it('omits audio menu item when tracks.audioTracks is absent', () => {
        render(
          <ProMamoPlayer source={{ uri: 'https://example.com/video.mp4' }} />,
        );

        const audioItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
          (item) => item.key === 'audio',
        );

        expect(audioItem).toBeUndefined();
      });
    });

    describe('close behavior', () => {
      it('closes the quality overlay when the close button is pressed', () => {
        const { getByTestId, queryByTestId } = render(
          <ProMamoPlayer
            source={{ uri: 'https://example.com/video.mp4' }}
            tracks={{
              qualities: [
                { id: 'auto', label: 'Auto', uri: 'https://example.com/auto.m3u8', isDefault: true },
              ],
            }}
          />,
        );

        fireEvent.press(getByTestId('pro-topright-hd-button'));
        expect(getByTestId('pro-settings-overlay')).toBeTruthy();

        fireEvent.press(getByTestId('pro-settings-close-button'));
        expect(queryByTestId('pro-settings-overlay')).toBeNull();
      });

      it('closes the quality overlay when the backdrop is pressed', () => {
        const { getByTestId, queryByTestId } = render(
          <ProMamoPlayer
            source={{ uri: 'https://example.com/video.mp4' }}
            tracks={{
              qualities: [
                { id: 'auto', label: 'Auto', uri: 'https://example.com/auto.m3u8', isDefault: true },
              ],
            }}
          />,
        );

        fireEvent.press(getByTestId('pro-topright-hd-button'));
        expect(getByTestId('pro-settings-overlay')).toBeTruthy();

        fireEvent.press(getByTestId('pro-settings-overlay-backdrop'));
        expect(queryByTestId('pro-settings-overlay')).toBeNull();
      });
    });
  });

  // ─── Video quality switching ────────────────────────────────────────────────
  describe('video quality switching', () => {
    const QUALITIES = [
      { id: 'auto' as const, label: 'Auto', uri: 'https://cdn.example.com/video-auto.m3u8', isDefault: true },
      { id: '720p' as const, label: '720p', uri: 'https://cdn.example.com/video-720p.m3u8' },
      { id: '1080p' as const, label: '1080p', uri: 'https://cdn.example.com/video-1080p.m3u8' },
    ];

    it('initialises with the default quality variant URI as the active source', () => {
      render(
        <ProMamoPlayer
          source={{ uri: 'https://example.com/base.mp4' }}
          tracks={{
            qualities: QUALITIES,
            defaultQualityId: '720p',
          }}
        />,
      );

      expect((latestVideoProps?.source as { uri?: string })?.uri).toBe(
        'https://cdn.example.com/video-720p.m3u8',
      );
      expect(latestVideoProps?.currentQualityId).toBe('720p');
    });

    it('falls back to the isDefault-flagged variant when no defaultQualityId is given', () => {
      render(
        <ProMamoPlayer
          source={{ uri: 'https://example.com/base.mp4' }}
          tracks={{ qualities: QUALITIES }}
        />,
      );

      expect((latestVideoProps?.source as { uri?: string })?.uri).toBe(
        'https://cdn.example.com/video-auto.m3u8',
      );
      expect(latestVideoProps?.currentQualityId).toBe('auto');
    });

    it('changes the active source URI to the selected quality variant', () => {
      render(
        <ProMamoPlayer
          source={{ uri: 'https://example.com/base.mp4' }}
          tracks={{ qualities: QUALITIES }}
        />,
      );

      expect((latestVideoProps?.source as { uri?: string })?.uri).toBe(
        'https://cdn.example.com/video-auto.m3u8',
      );

      const qualityMenuItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
        (item) => item.key === 'quality',
      );

      act(() => {
        qualityMenuItem?.onSelectOption('720p');
      });

      expect((latestVideoProps?.source as { uri?: string })?.uri).toBe(
        'https://cdn.example.com/video-720p.m3u8',
      );
      expect(latestVideoProps?.currentQualityId).toBe('720p');
    });

    it('seeks back to playback position after new quality source fires ready', () => {
      render(
        <ProMamoPlayer
          source={{ uri: 'https://example.com/base.mp4' }}
          tracks={{ qualities: QUALITIES }}
        />,
      );

      // Simulate playback reaching 45 s.
      act(() => {
        emitPlayback({ type: 'ready', duration: 120, position: 0 });
        emitPlayback({ type: 'time_update', duration: 120, position: 45 });
      });

      // User switches quality.
      const qualityMenuItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
        (item) => item.key === 'quality',
      );

      act(() => {
        qualityMenuItem?.onSelectOption('720p');
      });

      // New source loads → ready fires at position 0.
      act(() => {
        emitPlayback({ type: 'ready', duration: 120, position: 0 });
      });

      expect(mockSeek).toHaveBeenCalledTimes(1);
      expect(mockSeek).toHaveBeenCalledWith(45);
    });

    it('does not seek when quality is switched from position 0', () => {
      render(
        <ProMamoPlayer
          source={{ uri: 'https://example.com/base.mp4' }}
          tracks={{ qualities: QUALITIES }}
        />,
      );

      const qualityMenuItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
        (item) => item.key === 'quality',
      );

      // Position is 0 (default) — no seek should be queued.
      act(() => {
        qualityMenuItem?.onSelectOption('1080p');
      });

      act(() => {
        emitPlayback({ type: 'ready', duration: 120, position: 0 });
      });

      expect(mockSeek).not.toHaveBeenCalled();
    });

    it('preserves paused state across a quality switch', () => {
      render(
        <ProMamoPlayer
          source={{ uri: 'https://example.com/base.mp4' }}
          tracks={{ qualities: QUALITIES }}
          paused
        />,
      );

      const qualityMenuItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
        (item) => item.key === 'quality',
      );

      act(() => {
        qualityMenuItem?.onSelectOption('720p');
      });

      // paused prop is propagated unchanged.
      expect(latestVideoProps?.paused).toBe(true);
    });

    it('re-emits only a single ready event (no double source reload) after quality switch', () => {
      const onPlaybackEvent = jest.fn();

      render(
        <ProMamoPlayer
          source={{ uri: 'https://example.com/base.mp4' }}
          tracks={{ qualities: QUALITIES }}
          onPlaybackEvent={onPlaybackEvent}
        />,
      );

      act(() => {
        emitPlayback({ type: 'time_update', duration: 120, position: 30 });
      });

      const qualityMenuItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
        (item) => item.key === 'quality',
      );

      act(() => {
        qualityMenuItem?.onSelectOption('1080p');
      });

      // Only one ready event should result in one session_start analytic.
      onPlaybackEvent.mockClear();

      act(() => {
        emitPlayback({ type: 'ready', duration: 120, position: 0 });
      });

      const readyEvents = onPlaybackEvent.mock.calls.filter(
        ([ev]) => ev.type === 'ready',
      );
      expect(readyEvents).toHaveLength(1);
    });

    it('is a no-op when the same quality is re-selected', () => {
      render(
        <ProMamoPlayer
          source={{ uri: 'https://example.com/base.mp4' }}
          tracks={{ qualities: QUALITIES, defaultQualityId: 'auto' }}
        />,
      );

      act(() => {
        emitPlayback({ type: 'time_update', duration: 120, position: 20 });
      });

      const sourceBeforeReselect = latestVideoProps?.source;

      const qualityMenuItem = latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
        (item) => item.key === 'quality',
      );

      // Re-select the already-active quality.
      act(() => {
        qualityMenuItem?.onSelectOption('auto');
      });

      // Source must not have changed and seek must not be called.
      expect(latestVideoProps?.source).toBe(sourceBeforeReselect);
      expect(mockSeek).not.toHaveBeenCalled();
    });

    it('updates the quality label in the settings menu after a quality change', () => {
      render(
        <ProMamoPlayer
          source={{ uri: 'https://example.com/base.mp4' }}
          tracks={{ qualities: QUALITIES, defaultQualityId: 'auto' }}
        />,
      );

      const qualityMenuItem = () =>
        latestVideoProps?.settingsOverlay?.extraMenuItems?.find(
          (item) => item.key === 'quality',
        );

      expect(qualityMenuItem()?.value).toBe('Auto');
      expect(qualityMenuItem()?.selectedOptionId).toBe('auto');

      act(() => {
        qualityMenuItem()?.onSelectOption('1080p');
      });

      expect(qualityMenuItem()?.value).toBe('1080p');
      expect(qualityMenuItem()?.selectedOptionId).toBe('1080p');
    });

    it('marks the selected quality option with a checkmark in the Pro HD overlay', () => {
      const { getByTestId } = render(
        <ProMamoPlayer
          source={{ uri: 'https://example.com/base.mp4' }}
          tracks={{ qualities: QUALITIES, defaultQualityId: 'auto' }}
        />,
      );

      fireEvent.press(getByTestId('pro-topright-hd-button'));

      // 'auto' is default — its row should contain the check icon.
      expect(
        within(getByTestId('pro-settings-option-quality-auto')).queryByText('check'),
      ).toBeTruthy();
      expect(
        within(getByTestId('pro-settings-option-quality-720p')).queryByText('check'),
      ).toBeNull();

      // Switch to 720p.
      act(() => {
        fireEvent.press(getByTestId('pro-settings-option-quality-720p'));
      });

      expect(
        within(getByTestId('pro-settings-option-quality-720p')).queryByText('check'),
      ).toBeTruthy();
      expect(
        within(getByTestId('pro-settings-option-quality-auto')).queryByText('check'),
      ).toBeNull();
    });
  });
});
