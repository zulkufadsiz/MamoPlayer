import { MamoPlayer, Timeline, type MamoPlayerProps, type PlaybackEvent } from '@mamoplayer/core';
import React, { useRef } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import type { VideoRef } from 'react-native-video';
import { AdStateMachine } from './ads/AdState';
import { loadAds, releaseAds, subscribeToAdsEvents } from './ima/nativeBridge';
import { validateLicenseKey } from './licensing/license';
import { subscribeToPipEvents } from './pip/nativeBridge';
import { ThemeProvider, usePlayerTheme } from './theme/ThemeContext';
import type { AdBreak, AdsConfig } from './types/ads';
import type { AnalyticsConfig, AnalyticsEvent } from './types/analytics';
import type { PlayerIconSet } from './types/icons';
import type { IMAConfig } from './types/ima';
import type { PlayerLayoutVariant } from './types/layout';
import type { PipConfig, PipEvent, PipState } from './types/pip';
import type { PlaybackRestrictions } from './types/restrictions';
import type { SettingsOverlayConfig } from './types/settings';
import type { PlayerThemeConfig, ThemeName } from './types/theme';
import type { ThumbnailsConfig } from './types/thumbnails';
import type { TracksConfig, VideoQualityId } from './types/tracks';
import type { WatermarkConfig } from './types/watermark';

export interface ProMamoPlayerProps extends MamoPlayerProps {
  licenseKey?: string;
  ads?: AdsConfig;
  ima?: IMAConfig;
  analytics?: AnalyticsConfig;
  tracks?: TracksConfig;
  thumbnails?: ThumbnailsConfig;
  restrictions?: PlaybackRestrictions;
  watermark?: WatermarkConfig;
  themeName?: ThemeName;
  theme?: PlayerThemeConfig;
  icons?: PlayerIconSet;
  layoutVariant?: PlayerLayoutVariant;
  pip?: PipConfig;
  settingsOverlay?: SettingsOverlayConfig;
  onPipEvent?: (event: PipEvent) => void;
}

type OverlayOption = {
  id: string;
  label: string;
};

type OverlaySection = {
  key: 'quality' | 'subtitles' | 'audio';
  title: 'Quality' | 'Subtitles' | 'Audio';
  options: OverlayOption[];
  selectedOptionId?: string;
};

type Quartile = 25 | 50 | 75 | 100;

const QUARTILES: Quartile[] = [25, 50, 75, 100];

// UX preference: keep settings overlay open after a selection so users can quickly adjust
// multiple options (quality, subtitles, audio) in one pass.
const CLOSE_SETTINGS_ON_SELECTION = false;

const createQuartileState = (): Record<Quartile, boolean> => ({
  25: false,
  50: false,
  75: false,
  100: false,
});

const createAdBreakKey = (type: AdBreak['type'], time?: number) => `${type}:${time ?? 'none'}`;

const isAdPosition = (value: unknown): value is NonNullable<AnalyticsEvent['adPosition']> =>
  value === 'preroll' || value === 'midroll' || value === 'postroll';

const getErrorMessageFromUnknown = (payload?: unknown): string | undefined => {
  if (payload instanceof Error) {
    return payload.message;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const payloadRecord = payload as {
    message?: unknown;
    errorMessage?: unknown;
    error?: { message?: unknown } | unknown;
  };

  if (typeof payloadRecord.errorMessage === 'string' && payloadRecord.errorMessage.length > 0) {
    return payloadRecord.errorMessage;
  }

  if (typeof payloadRecord.message === 'string' && payloadRecord.message.length > 0) {
    return payloadRecord.message;
  }

  if (
    payloadRecord.error &&
    typeof payloadRecord.error === 'object' &&
    typeof (payloadRecord.error as { message?: unknown }).message === 'string' &&
    ((payloadRecord.error as { message?: string }).message?.length ?? 0) > 0
  ) {
    return (payloadRecord.error as { message: string }).message;
  }

  return undefined;
};

const getErrorMessageFromPlaybackEvent = (playbackEvent?: PlaybackEvent): string | undefined => {
  if (!playbackEvent || playbackEvent.type !== 'error') {
    return undefined;
  }

  return getErrorMessageFromUnknown(playbackEvent.error);
};

const getAdPositionFromPayload = (payload?: unknown): AnalyticsEvent['adPosition'] | undefined => {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const payloadRecord = payload as {
    adPosition?: unknown;
    position?: unknown;
    adBreakType?: unknown;
    breakType?: unknown;
  };

  const candidates = [
    payloadRecord.adPosition,
    payloadRecord.position,
    payloadRecord.adBreakType,
    payloadRecord.breakType,
  ];

  for (const candidate of candidates) {
    if (isAdPosition(candidate)) {
      return candidate;
    }
  }

  return undefined;
};

const emitAnalytics = (
  analytics: AnalyticsConfig | undefined,
  event: Omit<AnalyticsEvent, 'timestamp'>,
) => {
  if (!analytics) {
    return;
  }

  analytics.onEvent({
    ...event,
    timestamp: Date.now(),
  });
};

const emitAdAnalytics = (
  analytics: AnalyticsConfig | undefined,
  type: 'ad_start' | 'ad_complete' | 'ad_error',
  {
    playbackEvent,
    fallbackPosition,
    adTagUrl,
    adPosition,
    errorMessage,
    mainContentPositionAtAdStart,
  }: {
    playbackEvent?: PlaybackEvent;
    fallbackPosition?: number;
    adTagUrl?: string;
    adPosition?: AnalyticsEvent['adPosition'];
    errorMessage?: string;
    mainContentPositionAtAdStart?: number;
  } = {},
) => {
  emitAnalytics(analytics, {
    type,
    position: playbackEvent?.position ?? fallbackPosition ?? 0,
    duration: playbackEvent?.duration,
    playbackEvent,
    adTagUrl,
    adPosition,
    errorMessage,
    mainContentPositionAtAdStart,
    sessionId: analytics?.sessionId,
  });
};

type OverlayThemePrimitives = {
  colors: Record<string, string | undefined>;
  typography: Record<string, number | string | undefined>;
  shape: Record<string, number | undefined>;
};

const getThemePrimitives = (theme: PlayerThemeConfig): OverlayThemePrimitives => {
  const themeRecord = theme as unknown as {
    tokens?: {
      colors?: Record<string, string | undefined>;
      typography?: Record<string, number | string | undefined>;
      shape?: Record<string, number | undefined>;
    };
    colors?: Record<string, string | undefined>;
    typography?: Record<string, number | string | undefined>;
    shape?: Record<string, number | undefined>;
  };

  return {
    colors: themeRecord.tokens?.colors ?? themeRecord.colors ?? {},
    typography: themeRecord.tokens?.typography ?? themeRecord.typography ?? {},
    shape: themeRecord.tokens?.shape ?? themeRecord.shape ?? {},
  };
};

const getInitialQualityId = (tracks?: TracksConfig): VideoQualityId | undefined => {
  const qualities = tracks?.qualities;

  if (!qualities || qualities.length === 0) {
    return tracks?.defaultQualityId;
  }

  if (tracks?.defaultQualityId) {
    const configuredDefault = qualities.find((quality) => quality.id === tracks.defaultQualityId);

    if (configuredDefault) {
      return configuredDefault.id;
    }
  }

  const flaggedDefault = qualities.find((quality) => quality.isDefault === true);

  if (flaggedDefault) {
    return flaggedDefault.id;
  }

  const autoQuality = qualities.find((quality) => quality.id === 'auto');

  if (autoQuality) {
    return autoQuality.id;
  }

  return qualities[0]?.id;
};

const getInitialAudioTrackId = (tracks?: TracksConfig): string | undefined => {
  const audioTracks = tracks?.audioTracks;

  if (!audioTracks || audioTracks.length === 0) {
    return tracks?.defaultAudioTrackId ?? undefined;
  }

  if (tracks?.defaultAudioTrackId) {
    const configuredDefault = audioTracks.find(
      (audioTrack) => audioTrack.id === tracks.defaultAudioTrackId,
    );

    if (configuredDefault) {
      return configuredDefault.id;
    }
  }

  return audioTracks[0]?.id;
};

const getInitialSubtitleTrackId = (tracks?: TracksConfig): string | 'off' | undefined => {
  const subtitleTracks = tracks?.subtitleTracks;

  if (!subtitleTracks) {
    return tracks?.defaultSubtitleTrackId ?? undefined;
  }

  if (tracks?.defaultSubtitleTrackId === 'off') {
    return 'off';
  }

  if (tracks?.defaultSubtitleTrackId) {
    const configuredDefault = subtitleTracks.find(
      (subtitleTrack) => subtitleTrack.id === tracks.defaultSubtitleTrackId,
    );

    if (configuredDefault) {
      return configuredDefault.id;
    }
  }

  const flaggedDefault = subtitleTracks.find((subtitleTrack) => subtitleTrack.isDefault === true);

  if (flaggedDefault) {
    return flaggedDefault.id;
  }

  return 'off';
};

const resolveSourceWithQualityUri = (
  source: MamoPlayerProps['source'],
  qualityUri: string,
): MamoPlayerProps['source'] => {
  if (source && typeof source === 'object' && !Array.isArray(source)) {
    return {
      ...source,
      uri: qualityUri,
    } as MamoPlayerProps['source'];
  }

  return { uri: qualityUri } as MamoPlayerProps['source'];
};

interface ProMamoPlayerOverlaysProps {
  showAdOverlay: boolean;
  skipButtonEnabled: boolean;
  isSkipDisabled: boolean;
  skipSecondsRemaining: number;
  handleSkipAd: () => void;
  showPipButton: boolean;
  pipState: PipState;
  requestPip: () => void;
  showSettingsButton: boolean;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  settingsSections: OverlaySection[];
  settingsHeaderTitle: string;
  settingsLabelForOff: string;
  selectQualityOption?: (qualityId: string) => void;
  selectSubtitleOption?: (subtitleTrackId: string | 'off') => void;
  selectAudioOption?: (audioTrackId: string) => void;
  showTransportControls: boolean;
  isPlaying: boolean;
  isFullscreen: boolean;
  timelineDuration: number;
  timelinePosition: number;
  onTimelineSeek: (time: number) => void;
  onTogglePlayback: () => void;
  onSeekBackTenSeconds: () => void;
  onSeekForwardTenSeconds: () => void;
  onToggleFullscreen: () => void;
  layoutVariant: PlayerLayoutVariant;
  icons?: PlayerIconSet;
  watermark?: WatermarkConfig;
  watermarkPosition: { top: number; left: number };
}

const renderOverlayIcon = (
  IconComponent: PlayerIconSet[keyof PlayerIconSet] | undefined,
  fallbackLabel: string,
  size: number,
  color: string,
) => {
  if (IconComponent) {
    return <IconComponent size={size} color={color} />;
  }

  return (
    <Text
      style={{
        color,
        fontSize: size,
        fontWeight: '700',
      }}
    >
      {fallbackLabel}
    </Text>
  );
};

const ProMamoPlayerOverlays: React.FC<ProMamoPlayerOverlaysProps> = ({
  showAdOverlay,
  skipButtonEnabled,
  isSkipDisabled,
  skipSecondsRemaining,
  handleSkipAd,
  showPipButton,
  pipState,
  requestPip,
  showSettingsButton,
  isSettingsOpen,
  openSettings,
  closeSettings,
  settingsSections,
  settingsHeaderTitle,
  settingsLabelForOff,
  selectQualityOption,
  selectSubtitleOption,
  selectAudioOption,
  showTransportControls,
  isPlaying,
  isFullscreen,
  timelineDuration,
  timelinePosition,
  onTimelineSeek,
  onTogglePlayback,
  onSeekBackTenSeconds,
  onSeekForwardTenSeconds,
  onToggleFullscreen,
  layoutVariant,
  icons,
  watermark,
  watermarkPosition,
}) => {
  const playerTheme = usePlayerTheme();
  const isOttLayout = layoutVariant === 'ott';
  const settingsAnimation = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!isSettingsOpen) {
      settingsAnimation.setValue(0);
      return;
    }

    Animated.timing(settingsAnimation, {
      toValue: 1,
      duration: isOttLayout ? 220 : 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isOttLayout, isSettingsOpen, settingsAnimation]);

  const settingsPanelAnimatedStyle = React.useMemo(
    () => ({
      opacity: settingsAnimation,
      transform: isOttLayout
        ? [
            {
              translateY: settingsAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [44, 0],
              }),
            },
          ]
        : [
            {
              scale: settingsAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.96, 1],
              }),
            },
          ],
    }),
    [isOttLayout, settingsAnimation],
  );

  const overlayIconColor = React.useMemo(() => {
    const { colors } = getThemePrimitives(playerTheme);

    return colors.primaryText ?? colors.textPrimary ?? colors.secondaryText ?? '#FFFFFF';
  }, [playerTheme]);
  const styles = React.useMemo(
    () => stylesFactory(playerTheme, layoutVariant),
    [layoutVariant, playerTheme],
  );
  const handleSectionOptionPress = React.useCallback(
    (sectionKey: OverlaySection['key'], optionId: string) => {
      if (sectionKey === 'quality') {
        selectQualityOption?.(optionId);
      } else if (sectionKey === 'audio') {
        selectAudioOption?.(optionId);
      } else if (sectionKey === 'subtitles') {
        selectSubtitleOption?.(optionId);
      }

      if (CLOSE_SETTINGS_ON_SELECTION) {
        closeSettings();
      }
    },
    [closeSettings, selectAudioOption, selectQualityOption, selectSubtitleOption],
  );

  return (
    <>
      {showAdOverlay ? (
        <View style={styles.adOverlay}>
          <Text style={styles.adText}>Ad playing...</Text>
          {skipButtonEnabled ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleSkipAd}
              disabled={isSkipDisabled}
              style={[styles.skipButton, isSkipDisabled ? styles.skipButtonDisabled : null]}
            >
              <Text style={styles.skipButtonText}>
                {isSkipDisabled ? `Skip in ${skipSecondsRemaining}s` : 'Skip ad'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {showTransportControls ? (
        <View style={styles.transportControlsRoot}>
          <View style={styles.transportControlsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Seek backward 10 seconds"
              accessibilityHint="Rewinds by ten seconds"
              onPress={onSeekBackTenSeconds}
              style={styles.transportButton}
              testID="pro-transport-seek-back-10"
            >
              <View style={styles.transportButtonContent}>
                {renderOverlayIcon(undefined, '↺', isOttLayout ? 20 : 18, overlayIconColor)}
                <Text style={styles.transportButtonLabel}>10s</Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              accessibilityHint={isPlaying ? 'Pauses playback' : 'Resumes playback'}
              onPress={onTogglePlayback}
              style={styles.transportPrimaryButton}
              testID="pro-transport-play-toggle"
            >
              <View style={styles.transportButtonContent}>
                {renderOverlayIcon(
                  isPlaying ? icons?.Pause : icons?.Play,
                  isPlaying ? '⏸' : '▶',
                  isOttLayout ? 22 : 20,
                  overlayIconColor,
                )}
                <Text style={styles.transportButtonLabel}>{isPlaying ? 'Pause' : 'Play'}</Text>
              </View>
            </Pressable>
            {showSettingsButton ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open settings overlay"
                accessibilityHint="Opens quality, subtitles and audio settings"
                onPress={openSettings}
                style={styles.transportButton}
                testID="pro-transport-settings"
              >
                <View style={styles.transportButtonContent}>
                  {renderOverlayIcon(icons?.Settings, '⚙', isOttLayout ? 20 : 18, overlayIconColor)}
                  <Text style={styles.transportButtonLabel}>Settings</Text>
                </View>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              accessibilityHint={
                isFullscreen ? 'Returns to inline mode' : 'Expands to fullscreen mode'
              }
              onPress={onToggleFullscreen}
              style={styles.transportButton}
              testID="pro-transport-fullscreen"
            >
              <View style={styles.transportButtonContent}>
                {renderOverlayIcon(
                  isFullscreen ? icons?.ExitFullscreen : icons?.Fullscreen,
                  isFullscreen ? '⤡' : '⤢',
                  isOttLayout ? 20 : 18,
                  overlayIconColor,
                )}
                <Text style={styles.transportButtonLabel}>
                  {isFullscreen ? 'Minimize' : 'Fullscreen'}
                </Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Seek forward 10 seconds"
              accessibilityHint="Advances by ten seconds"
              onPress={onSeekForwardTenSeconds}
              style={styles.transportButton}
              testID="pro-transport-seek-forward-10"
            >
              <View style={styles.transportButtonContent}>
                {renderOverlayIcon(undefined, '↻', isOttLayout ? 20 : 18, overlayIconColor)}
                <Text style={styles.transportButtonLabel}>10s</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.ottProgressTrack} testID="pro-transport-progress-track">
            <Timeline
              duration={timelineDuration}
              position={timelinePosition}
              onSeek={onTimelineSeek}
            />
          </View>
        </View>
      ) : null}
      {!isOttLayout && (showPipButton || showSettingsButton) ? (
        <View style={styles.controlsRow}>
          {showSettingsButton ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings overlay"
              accessibilityHint="Opens quality, subtitles and audio settings"
              onPress={openSettings}
              style={styles.settingsButton}
              testID="pro-settings-button"
            >
              {renderOverlayIcon(icons?.Settings, '⚙', 18, overlayIconColor)}
              <Text style={styles.settingsButtonText}>Settings</Text>
            </Pressable>
          ) : null}

          {showPipButton ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                pipState === 'active' ? 'Picture in picture is active' : 'Enter picture in picture'
              }
              onPress={requestPip}
              style={styles.pipButton}
              testID="pro-pip-button"
            >
              {renderOverlayIcon(icons?.PictureInPicture, '▣', 16, overlayIconColor)}
              <Text style={styles.pipButtonText}>PiP</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {isSettingsOpen ? (
        <View
          style={styles.settingsOverlayRoot}
          testID="pro-settings-overlay"
          pointerEvents="box-none"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close settings overlay background"
            accessibilityHint="Closes the settings overlay"
            onPress={closeSettings}
            style={styles.settingsOverlayBackdrop}
            testID="pro-settings-overlay-backdrop"
          />

          <Animated.View style={[styles.settingsPanel, settingsPanelAnimatedStyle]}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>{settingsHeaderTitle}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close settings overlay"
                accessibilityHint="Closes the settings overlay"
                onPress={closeSettings}
                style={styles.settingsCloseButton}
                testID="pro-settings-close-button"
              >
                {renderOverlayIcon(
                  undefined,
                  '✕',
                  layoutVariant === 'ott' ? 22 : 18,
                  overlayIconColor,
                )}
              </Pressable>
            </View>

            <View style={styles.settingsSectionsContainer}>
              {settingsSections.map((section) => (
                <View key={section.key} style={styles.settingsSection}>
                  <Text style={styles.settingsSectionTitle}>{section.title}</Text>
                  {section.options.map((option) => {
                    const isSelected = option.id === section.selectedOptionId;

                    return (
                      <Pressable
                        key={`${section.key}-${option.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={`${section.title} ${option.label}`}
                        accessibilityHint={`Select ${option.label} for ${section.title.toLowerCase()}`}
                        onPress={() => handleSectionOptionPress(section.key, option.id)}
                        style={styles.settingsOptionRow}
                        testID={`pro-settings-option-${section.key}-${option.id}`}
                      >
                        <Text
                          style={[
                            styles.settingsOptionLabel,
                            isSelected ? styles.settingsOptionLabelSelected : null,
                          ]}
                        >
                          {option.label}
                        </Text>
                        {isSelected ? (
                          <Text style={styles.settingsOptionSelectedLabel}>Current</Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                  {section.key === 'subtitles' ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${section.title} ${settingsLabelForOff}`}
                      accessibilityHint="Turns subtitles off"
                      onPress={() => handleSectionOptionPress('subtitles', 'off')}
                      style={styles.settingsOptionRow}
                      testID="pro-settings-option-subtitles-off"
                    >
                      <Text
                        style={[
                          styles.settingsOptionLabel,
                          section.selectedOptionId === 'off'
                            ? styles.settingsOptionLabelSelected
                            : null,
                        ]}
                      >
                        {settingsLabelForOff}
                      </Text>
                      {section.selectedOptionId === 'off' ? (
                        <Text style={styles.settingsOptionSelectedLabel}>Current</Text>
                      ) : null}
                    </Pressable>
                  ) : null}
                </View>
              ))}
              {isOttLayout && showPipButton ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    pipState === 'active'
                      ? 'Picture in picture is active'
                      : 'Enter picture in picture'
                  }
                  accessibilityHint="Moves playback into picture in picture"
                  onPress={requestPip}
                  style={styles.settingsOptionRow}
                  testID="pro-settings-pip-button"
                >
                  <View style={styles.settingsOptionLeading}>
                    {renderOverlayIcon(icons?.PictureInPicture, '▣', 16, overlayIconColor)}
                    <Text style={styles.settingsOptionLabel}>Picture in Picture</Text>
                  </View>
                </Pressable>
              ) : null}
            </View>
          </Animated.View>
        </View>
      ) : null}
      {watermark ? (
        <Text
          pointerEvents="none"
          style={[
            styles.watermarkText,
            {
              top: watermarkPosition.top,
              left: watermarkPosition.left,
              opacity: watermark.opacity ?? 0.5,
            },
          ]}
        >
          {watermark.text}
        </Text>
      ) : null}
    </>
  );
};

export const ProMamoPlayer: React.FC<ProMamoPlayerProps> = ({
  licenseKey,
  ads,
  ima,
  analytics,
  tracks,
  restrictions,
  watermark,
  theme,
  themeName,
  layoutVariant = 'standard',
  icons,
  pip,
  settingsOverlay,
  onPictureInPictureStatusChanged,
  onPlaybackEvent,
  onPipEvent,
  ...rest
}) => {
  const ProCompatibleMamoPlayer = MamoPlayer as unknown as React.ComponentType<
    Record<string, unknown>
  >;
  const { style: playerStyle, ...playerProps } = rest;

  const resolvedSettings = {
    enabled: settingsOverlay?.enabled ?? true,
    showQuality: settingsOverlay?.showQuality ?? true,
    showSubtitles: settingsOverlay?.showSubtitles ?? true,
    showAudioTracks: settingsOverlay?.showAudioTracks ?? true,
  };

  const shouldShowQualitySettings = resolvedSettings.enabled && resolvedSettings.showQuality;
  const shouldShowSubtitleSettings = resolvedSettings.enabled && resolvedSettings.showSubtitles;
  const shouldShowAudioTrackSettings = resolvedSettings.enabled && resolvedSettings.showAudioTracks;

  const playerRef = React.useRef<VideoRef | null>(null);
  const adRef = useRef(new AdStateMachine());
  const quartileStateRef = React.useRef<Record<Quartile, boolean>>(createQuartileState());
  const positionRef = React.useRef(0);
  const initialQualityId = React.useMemo(() => getInitialQualityId(tracks), [tracks]);
  const initialAudioTrackId = React.useMemo(() => getInitialAudioTrackId(tracks), [tracks]);
  const initialSubtitleTrackId = React.useMemo(() => getInitialSubtitleTrackId(tracks), [tracks]);
  const initialQualityVariant = React.useMemo(
    () => tracks?.qualities?.find((quality) => quality.id === initialQualityId),
    [initialQualityId, tracks?.qualities],
  );
  const initialMainSource = React.useMemo(
    () =>
      initialQualityVariant?.uri
        ? resolveSourceWithQualityUri(playerProps.source, initialQualityVariant.uri)
        : playerProps.source,
    [initialQualityVariant?.uri, playerProps.source],
  );
  const mainSourceRef = React.useRef(initialMainSource);
  const pendingSessionEndEventRef = React.useRef<PlaybackEvent | null>(null);
  const pendingQualitySeekPositionRef = React.useRef<number | null>(null);
  const adSourceMapRef = React.useRef<Map<string, AdBreak>>(new Map());
  const adMainContentStartPositionRef = React.useRef<number | null>(null);
  const [isAdMode, setIsAdMode] = React.useState(false);
  const [resumeMainAfterAd, setResumeMainAfterAd] = React.useState(false);
  const [activeSource, setActiveSource] =
    React.useState<MamoPlayerProps['source']>(initialMainSource);
  const [watermarkPosition, setWatermarkPosition] = React.useState({ top: 10, left: 10 });
  const [adStartedAt, setAdStartedAt] = React.useState<number | null>(null);
  const [overlayTimestamp, setOverlayTimestamp] = React.useState(() => Date.now());
  const shouldUseNativeIMA = Boolean(ima?.enabled && ima.adTagUrl);
  const [hasNativeIMAFailed, setHasNativeIMAFailed] = React.useState(false);
  const [isNativeAdPlaying, setIsNativeAdPlaying] = React.useState(false);
  const [isMainContentPausedByNativeAd, setIsMainContentPausedByNativeAd] = React.useState(false);
  const [currentQualityId, setCurrentQualityId] = React.useState<VideoQualityId | undefined>(
    initialQualityId,
  );
  const [currentAudioTrackId, setCurrentAudioTrackId] = React.useState<string | undefined>(
    initialAudioTrackId,
  );
  const [currentSubtitleTrackId, setCurrentSubtitleTrackId] = React.useState<
    string | 'off' | undefined
  >(initialSubtitleTrackId);
  const [pipState, setPipState] = React.useState<PipState>('inactive');
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isInlinePlaybackPaused, setIsInlinePlaybackPaused] = React.useState<boolean | undefined>(
    undefined,
  );
  const [isInlinePlaybackActive, setIsInlinePlaybackActive] = React.useState(
    Boolean(rest.autoPlay),
  );
  const [mediaDuration, setMediaDuration] = React.useState(0);
  const [currentPosition, setCurrentPosition] = React.useState(0);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const settingsSections = React.useMemo<OverlaySection[]>(() => {
    const sections: OverlaySection[] = [];

    if (shouldShowQualitySettings && tracks?.qualities?.length) {
      sections.push({
        key: 'quality',
        title: 'Quality',
        options: tracks.qualities.map((quality) => ({ id: quality.id, label: quality.label })),
        selectedOptionId: currentQualityId,
      });
    }

    if (shouldShowSubtitleSettings && tracks?.subtitleTracks?.length) {
      sections.push({
        key: 'subtitles',
        title: 'Subtitles',
        options: tracks.subtitleTracks.map((subtitleTrack) => ({
          id: subtitleTrack.id,
          label: subtitleTrack.label,
        })),
        selectedOptionId: currentSubtitleTrackId,
      });
    }

    if (shouldShowAudioTrackSettings && tracks?.audioTracks?.length) {
      sections.push({
        key: 'audio',
        title: 'Audio',
        options: tracks.audioTracks.map((audioTrack) => ({
          id: audioTrack.id,
          label: audioTrack.label,
        })),
        selectedOptionId: currentAudioTrackId,
      });
    }

    return sections;
  }, [
    currentAudioTrackId,
    currentQualityId,
    currentSubtitleTrackId,
    shouldShowAudioTrackSettings,
    shouldShowQualitySettings,
    shouldShowSubtitleSettings,
    tracks?.audioTracks,
    tracks?.qualities,
    tracks?.subtitleTracks,
  ]);

  const hasSettingsSections = settingsSections.length > 0;

  React.useEffect(() => {
    if (!hasSettingsSections && isSettingsOpen) {
      setIsSettingsOpen(false);
    }
  }, [hasSettingsSections, isSettingsOpen]);

  const openSettings = React.useCallback(() => {
    if (!hasSettingsSections) {
      return;
    }

    setIsSettingsOpen(true);
  }, [hasSettingsSections]);

  const closeSettings = React.useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const resolvedPausedState =
    typeof rest.paused === 'boolean' ? rest.paused : isInlinePlaybackPaused;
  const canTogglePlayback = typeof rest.paused !== 'boolean';

  const handleTogglePlayback = React.useCallback(() => {
    if (!canTogglePlayback) {
      return;
    }

    setIsInlinePlaybackPaused((previousValue) => {
      const currentlyPaused =
        typeof previousValue === 'boolean' ? previousValue : !isInlinePlaybackActive;
      return !currentlyPaused;
    });
  }, [canTogglePlayback, isInlinePlaybackActive]);

  const handleSeekBackTenSeconds = React.useCallback(() => {
    const nextPosition = Math.max(0, positionRef.current - 10);
    playerRef.current?.seek(nextPosition);
  }, []);

  const handleSeekForwardTenSeconds = React.useCallback(() => {
    const targetDuration = mediaDuration > 0 ? mediaDuration : Number.MAX_SAFE_INTEGER;
    const nextPosition = Math.min(targetDuration, positionRef.current + 10);
    playerRef.current?.seek(nextPosition);
  }, [mediaDuration]);

  const handleToggleFullscreen = React.useCallback(() => {
    const nextFullscreenState = !isFullscreen;
    const fullscreenRef = playerRef.current as
      | (VideoRef & {
          presentFullscreenPlayer?: () => void;
          dismissFullscreenPlayer?: () => void;
          setFullScreen?: (fullScreen: boolean) => void;
        })
      | null;

    if (nextFullscreenState) {
      fullscreenRef?.presentFullscreenPlayer?.();
    } else {
      fullscreenRef?.dismissFullscreenPlayer?.();
    }

    fullscreenRef?.setFullScreen?.(nextFullscreenState);
    setIsFullscreen(nextFullscreenState);
  }, [isFullscreen]);

  const handleTimelineSeek = React.useCallback(
    (time: number) => {
      const safeDuration = mediaDuration > 0 ? mediaDuration : Number.MAX_SAFE_INTEGER;
      const nextPosition = Math.max(0, Math.min(time, safeDuration));
      playerRef.current?.seek(nextPosition);
    },
    [mediaDuration],
  );
  const emitPipEvent = React.useCallback(
    (event: PipEvent) => {
      setPipState(event.state);
      onPipEvent?.(event);
    },
    [onPipEvent],
  );
  const requestPip = React.useCallback(() => {
    emitPipEvent({
      state: 'entering',
    });

    console.log('PiP requested');
    // TODO: Invoke native PiP entry request once native bridge API is available.
    // TODO: Hook this to the underlying player's PiP APIs and error handling callbacks.
  }, [emitPipEvent]);
  const handleNativePipStateChange = React.useCallback(
    (state: Extract<PipState, 'active' | 'exiting'>) => {
      emitPipEvent({ state });
    },
    [emitPipEvent],
  );

  React.useEffect(() => {
    if (pip?.enabled !== true) {
      return;
    }

    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = subscribeToPipEvents((eventName) => {
        if (eventName === 'mamo_pip_active') {
          handleNativePipStateChange('active');
          return;
        }

        if (eventName === 'mamo_pip_exiting') {
          handleNativePipStateChange('exiting');
        }
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to subscribe to native PiP events.';
      console.warn(`[MamoPlayer Pro] ${message}`);
    }

    return () => {
      unsubscribe?.();
    };
  }, [handleNativePipStateChange, pip?.enabled]);
  const handlePictureInPictureStatusChanged = React.useCallback(
    (event: Readonly<{ isActive: boolean }>) => {
      const isActive = event.isActive;
      const shouldEmitPipEvents = pip?.enabled !== false;

      if (shouldEmitPipEvents) {
        emitPipEvent({
          state: isActive ? 'active' : 'inactive',
        });
      }

      onPictureInPictureStatusChanged?.(event);
    },
    [emitPipEvent, onPictureInPictureStatusChanged, pip?.enabled],
  );
  const useNativeIMA = shouldUseNativeIMA && !hasNativeIMAFailed;
  const hasConfiguredPreroll = React.useMemo(
    () => Boolean(ads?.adBreaks.some((adBreak) => adBreak.type === 'preroll')),
    [ads?.adBreaks],
  );
  const skipButtonEnabled = ads?.skipButtonEnabled === true;
  const skipAfterSeconds = Math.max(0, ads?.skipAfterSeconds ?? 0);
  const licenseCheckRef = React.useRef(validateLicenseKey(licenseKey));

  React.useEffect(() => {
    const licenseCheck = licenseCheckRef.current;

    if (licenseCheck.valid) {
      return;
    }

    console.warn(
      `[MamoPlayer Pro] Invalid or missing license key (${licenseCheck.reason ?? 'UNKNOWN'}). Access is enforced via private npm package access.`,
    );
  }, []);

  React.useEffect(() => {
    if (!shouldUseNativeIMA) {
      setHasNativeIMAFailed(false);
      setIsNativeAdPlaying(false);
      setIsMainContentPausedByNativeAd(false);
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    const onNativeAdsError = (payload?: unknown) => {
      const message = getErrorMessageFromUnknown(payload) ?? 'Native IMA ad playback failed.';

      console.error(`[MamoPlayer] ${message}`);
      emitAdAnalytics(analytics, 'ad_error', {
        fallbackPosition: positionRef.current,
        adTagUrl: ima?.adTagUrl,
        adPosition: getAdPositionFromPayload(payload),
        errorMessage: message,
        mainContentPositionAtAdStart: adMainContentStartPositionRef.current ?? positionRef.current,
      });
      adMainContentStartPositionRef.current = null;

      setIsNativeAdPlaying(false);
      setIsMainContentPausedByNativeAd(false);
      setResumeMainAfterAd(true);
      setHasNativeIMAFailed(true);

      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }

      void releaseAds().catch(() => undefined);
    };

    const initializeNativeIMA = async () => {
      if (!ima?.adTagUrl) {
        return;
      }

      try {
        unsubscribe = subscribeToAdsEvents((eventName, payload) => {
          if (!isMounted) {
            return;
          }

          if (eventName === 'mamo_ads_started') {
            setIsNativeAdPlaying(true);
            setIsMainContentPausedByNativeAd(true);
            setResumeMainAfterAd(false);

            const mainContentPositionAtAdStart = positionRef.current;
            adMainContentStartPositionRef.current = mainContentPositionAtAdStart;

            emitAdAnalytics(analytics, 'ad_start', {
              fallbackPosition: positionRef.current,
              adTagUrl: ima?.adTagUrl,
              adPosition: getAdPositionFromPayload(payload),
              mainContentPositionAtAdStart,
            });
            return;
          }

          if (eventName === 'mamo_ads_completed') {
            setIsNativeAdPlaying(false);
            setIsMainContentPausedByNativeAd(false);
            setResumeMainAfterAd(true);

            emitAdAnalytics(analytics, 'ad_complete', {
              fallbackPosition: positionRef.current,
              adTagUrl: ima?.adTagUrl,
              adPosition: getAdPositionFromPayload(payload),
              mainContentPositionAtAdStart:
                adMainContentStartPositionRef.current ?? positionRef.current,
            });
            adMainContentStartPositionRef.current = null;
            return;
          }

          if (eventName === 'mamo_ads_error') {
            onNativeAdsError(payload);
          }
        });

        await loadAds(ima.adTagUrl);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        onNativeAdsError(error);
      }
    };

    void initializeNativeIMA();

    return () => {
      isMounted = false;

      if (unsubscribe) {
        unsubscribe();
      }

      void releaseAds().catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Unable to release native IMA ads.';
        console.error(`[MamoPlayer] ${message}`);
      });
    };
  }, [analytics, ima?.adTagUrl, shouldUseNativeIMA]);

  React.useEffect(() => {
    setHasNativeIMAFailed(false);
    setIsNativeAdPlaying(false);
    setIsMainContentPausedByNativeAd(false);
  }, [rest.source]);

  React.useEffect(() => {
    setCurrentQualityId(initialQualityId);
  }, [initialQualityId]);

  React.useEffect(() => {
    const adBreaks = ads?.adBreaks;

    if (!adBreaks) {
      adSourceMapRef.current = new Map();
      return;
    }

    adSourceMapRef.current = new Map(
      adBreaks.map((adBreak) => [createAdBreakKey(adBreak.type, adBreak.time), adBreak]),
    );

    adRef.current.setAdBreaks(
      adBreaks.map((adBreak) => ({
        type: adBreak.type,
        offset: adBreak.time,
      })),
    );
  }, [ads?.adBreaks]);

  React.useEffect(() => {
    if (isAdMode) {
      return;
    }

    const qualityVariant =
      tracks?.qualities?.find((quality) => quality.id === currentQualityId) ??
      tracks?.qualities?.find((quality) => quality.id === initialQualityId);

    const nextSource = qualityVariant?.uri
      ? resolveSourceWithQualityUri(rest.source, qualityVariant.uri)
      : rest.source;

    if (qualityVariant?.id && qualityVariant.id !== currentQualityId) {
      setCurrentQualityId(qualityVariant.id);
    }

    mainSourceRef.current = nextSource;
    setActiveSource(nextSource);
  }, [currentQualityId, initialQualityId, isAdMode, rest.source, tracks?.qualities]);

  React.useEffect(() => {
    setCurrentAudioTrackId(initialAudioTrackId);
  }, [initialAudioTrackId]);

  React.useEffect(() => {
    setCurrentSubtitleTrackId(initialSubtitleTrackId);
  }, [initialSubtitleTrackId]);

  const changeQuality = React.useCallback(
    (qualityId: VideoQualityId) => {
      const qualityVariant = tracks?.qualities?.find((quality) => quality.id === qualityId);

      if (!qualityVariant) {
        return;
      }

      if (qualityVariant.id === currentQualityId) {
        return;
      }

      const previousPosition = positionRef.current;
      pendingQualitySeekPositionRef.current = previousPosition > 0 ? previousPosition : null;

      const nextSource = resolveSourceWithQualityUri(rest.source, qualityVariant.uri);
      mainSourceRef.current = nextSource;

      setCurrentQualityId(qualityVariant.id);

      if (!isAdMode) {
        setActiveSource(nextSource);
      }
    },
    [currentQualityId, isAdMode, rest.source, tracks?.qualities],
  );

  const changeAudioTrack = React.useCallback(
    (audioTrackId: string) => {
      const audioTrackExists = tracks?.audioTracks?.some(
        (audioTrack) => audioTrack.id === audioTrackId,
      );

      if (!audioTrackExists || audioTrackId === currentAudioTrackId) {
        return;
      }

      setCurrentAudioTrackId(audioTrackId);

      // TODO: Integrate native player-level audio track switching (HLS audio groups / rendition selection).
      // TODO: Emit `audio_track_change` analytics once analytics types support custom track-change events.
    },
    [currentAudioTrackId, tracks?.audioTracks],
  );

  const changeSubtitleTrack = React.useCallback(
    (subtitleTrackId: string | 'off') => {
      const subtitleTracks = tracks?.subtitleTracks;

      if (!subtitleTracks) {
        return;
      }

      if (subtitleTrackId === 'off') {
        if (currentSubtitleTrackId === 'off') {
          return;
        }

        setCurrentSubtitleTrackId('off');
        return;
      }

      const subtitleTrackExists = subtitleTracks.some(
        (subtitleTrack) => subtitleTrack.id === subtitleTrackId,
      );

      if (!subtitleTrackExists || subtitleTrackId === currentSubtitleTrackId) {
        return;
      }

      setCurrentSubtitleTrackId(subtitleTrackId);
    },
    [currentSubtitleTrackId, tracks?.subtitleTracks],
  );

  const selectQualityOption = React.useCallback(
    (qualityId: string) => {
      if (!shouldShowQualitySettings) {
        return;
      }

      changeQuality(qualityId as VideoQualityId);
    },
    [changeQuality, shouldShowQualitySettings],
  );

  const selectAudioOption = React.useCallback(
    (audioTrackId: string) => {
      if (!shouldShowAudioTrackSettings) {
        return;
      }

      changeAudioTrack(audioTrackId);
    },
    [changeAudioTrack, shouldShowAudioTrackSettings],
  );

  const selectSubtitleOption = React.useCallback(
    (subtitleTrackId: string | 'off') => {
      if (!shouldShowSubtitleSettings) {
        return;
      }

      changeSubtitleTrack(subtitleTrackId);
    },
    [changeSubtitleTrack, shouldShowSubtitleSettings],
  );

  const textTracks = React.useMemo(() => {
    if (!tracks?.subtitleTracks) {
      return undefined;
    }

    return tracks.subtitleTracks.map((subtitleTrack) => ({
      title: subtitleTrack.label,
      language: subtitleTrack.language,
      type: 'text/vtt' as const,
      uri: subtitleTrack.uri,
    }));
  }, [tracks?.subtitleTracks]);

  const selectedTextTrack = React.useMemo(() => {
    if (!tracks?.subtitleTracks) {
      return undefined;
    }

    if (currentSubtitleTrackId === 'off') {
      return { type: 'disabled' as const };
    }

    const selectedSubtitleTrackIndex = tracks.subtitleTracks.findIndex(
      (subtitleTrack) => subtitleTrack.id === currentSubtitleTrackId,
    );

    if (selectedSubtitleTrackIndex < 0) {
      return { type: 'disabled' as const };
    }

    return {
      type: 'index' as const,
      value: selectedSubtitleTrackIndex,
    };
  }, [currentSubtitleTrackId, tracks?.subtitleTracks]);

  const completeAdPlayback = React.useCallback(
    (playbackEvent?: PlaybackEvent) => {
      const currentAdBreak = adRef.current.currentAdBreak;

      if (currentAdBreak) {
        adRef.current.markAdCompleted(currentAdBreak);
      }

      setIsAdMode(false);
      setActiveSource(mainSourceRef.current);
      setResumeMainAfterAd(true);
      setAdStartedAt(null);

      emitAdAnalytics(analytics, 'ad_complete', {
        playbackEvent,
        fallbackPosition: positionRef.current,
        adPosition: currentAdBreak?.type,
        mainContentPositionAtAdStart: adMainContentStartPositionRef.current ?? positionRef.current,
      });
      adMainContentStartPositionRef.current = null;
    },
    [analytics],
  );

  const failAdPlayback = React.useCallback(
    (playbackEvent: PlaybackEvent) => {
      const currentAdBreak = adRef.current.currentAdBreak;

      if (currentAdBreak) {
        adRef.current.markAdCompleted(currentAdBreak);
      }

      setIsAdMode(false);
      setActiveSource(mainSourceRef.current);
      setResumeMainAfterAd(true);
      setAdStartedAt(null);

      emitAdAnalytics(analytics, 'ad_error', {
        playbackEvent,
        fallbackPosition: positionRef.current,
        adPosition: currentAdBreak?.type,
        errorMessage: getErrorMessageFromPlaybackEvent(playbackEvent),
        mainContentPositionAtAdStart: adMainContentStartPositionRef.current ?? positionRef.current,
      });
      adMainContentStartPositionRef.current = null;
    },
    [analytics],
  );

  const beginAdPlayback = React.useCallback(
    (
      adBreak: { type: 'preroll' | 'midroll' | 'postroll'; offset?: number },
      adSource: unknown,
      playbackEvent?: PlaybackEvent,
    ) => {
      adRef.current.markAdStarted(adBreak);
      mainSourceRef.current = rest.source;
      setActiveSource(adSource as MamoPlayerProps['source']);
      setIsAdMode(true);
      setAdStartedAt(Date.now());
      setOverlayTimestamp(Date.now());

      const mainContentPositionAtAdStart = playbackEvent?.position ?? positionRef.current;
      adMainContentStartPositionRef.current = mainContentPositionAtAdStart;

      emitAdAnalytics(analytics, 'ad_start', {
        playbackEvent,
        fallbackPosition: positionRef.current,
        adPosition: adBreak.type,
        mainContentPositionAtAdStart,
      });
    },
    [analytics, rest.source],
  );

  React.useEffect(() => {
    if (!skipButtonEnabled || skipAfterSeconds <= 0 || !isAdMode || adStartedAt === null) {
      return;
    }

    const interval = setInterval(() => {
      setOverlayTimestamp(Date.now());
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, [adStartedAt, isAdMode, skipAfterSeconds, skipButtonEnabled]);

  const rate = React.useMemo(() => {
    if (typeof rest.rate !== 'number') {
      return rest.rate;
    }

    if (typeof restrictions?.maxPlaybackRate !== 'number') {
      return rest.rate;
    }

    return Math.min(rest.rate, restrictions.maxPlaybackRate);
  }, [rest.rate, restrictions?.maxPlaybackRate]);

  React.useEffect(() => {
    if (!watermark?.randomizePosition) {
      setWatermarkPosition({ top: 10, left: 10 });
      return;
    }

    const range = 30;
    const interval = setInterval(() => {
      setWatermarkPosition({
        top: 10 + Math.floor(Math.random() * (range + 1)),
        left: 10 + Math.floor(Math.random() * (range + 1)),
      });
    }, watermark.intervalMs ?? 5000);

    return () => {
      clearInterval(interval);
    };
  }, [watermark]);

  const trackQuartiles = React.useCallback(
    (playbackEvent: PlaybackEvent) => {
      const duration = playbackEvent.duration;
      const position = playbackEvent.position;

      if (!duration || duration <= 0) {
        return;
      }

      const progress = position / duration;

      QUARTILES.forEach((quartile) => {
        if (!quartileStateRef.current[quartile] && progress >= quartile / 100) {
          quartileStateRef.current[quartile] = true;
          emitAnalytics(analytics, {
            type: 'quartile',
            quartile,
            position,
            duration,
            playbackEvent,
          });
        }
      });
    },
    [analytics],
  );

  const handlePlaybackEvent = React.useCallback(
    (playbackEvent: PlaybackEvent) => {
      setCurrentPosition(playbackEvent.position);

      if (typeof playbackEvent.duration === 'number' && playbackEvent.duration > 0) {
        setMediaDuration(playbackEvent.duration);
      }

      if (playbackEvent.type === 'play') {
        setIsInlinePlaybackActive(true);
      } else if (playbackEvent.type === 'pause' || playbackEvent.type === 'ended') {
        setIsInlinePlaybackActive(false);
      }

      // Native IMA path
      if (useNativeIMA) {
        positionRef.current = playbackEvent.position;
        onPlaybackEvent?.(playbackEvent);

        if (playbackEvent.type === 'ready') {
          if (
            pendingQualitySeekPositionRef.current !== null &&
            !isNativeAdPlaying &&
            !isMainContentPausedByNativeAd
          ) {
            const positionToRestore = pendingQualitySeekPositionRef.current;
            pendingQualitySeekPositionRef.current = null;
            playerRef.current?.seek(positionToRestore);
          }

          quartileStateRef.current = createQuartileState();
        }

        switch (playbackEvent.type) {
          case 'ready':
            emitAnalytics(analytics, {
              type: 'session_start',
              position: playbackEvent.position,
              duration: playbackEvent.duration,
              playbackEvent,
            });
            break;
          case 'play':
            emitAnalytics(analytics, {
              type: 'play',
              position: playbackEvent.position,
              duration: playbackEvent.duration,
              playbackEvent,
            });
            break;
          case 'pause':
            emitAnalytics(analytics, {
              type: 'pause',
              position: playbackEvent.position,
              duration: playbackEvent.duration,
              playbackEvent,
            });
            break;
          case 'ended':
            emitAnalytics(analytics, {
              type: 'ended',
              position: playbackEvent.position,
              duration: playbackEvent.duration,
              playbackEvent,
            });
            emitAnalytics(analytics, {
              type: 'session_end',
              position: playbackEvent.position,
              duration: playbackEvent.duration,
              playbackEvent,
            });
            break;
          case 'buffer_start':
            emitAnalytics(analytics, {
              type: 'buffer_start',
              position: playbackEvent.position,
              duration: playbackEvent.duration,
              playbackEvent,
            });
            break;
          case 'buffer_end':
            emitAnalytics(analytics, {
              type: 'buffer_end',
              position: playbackEvent.position,
              duration: playbackEvent.duration,
              playbackEvent,
            });
            break;
          case 'seek':
            emitAnalytics(analytics, {
              type: 'seek',
              position: playbackEvent.position,
              duration: playbackEvent.duration,
              playbackEvent,
            });
            break;
          default:
            break;
        }

        trackQuartiles(playbackEvent);
        return;
      }

      // Simulated ads fallback path
      if (adRef.current.isAdPlaying || isAdMode) {
        if (playbackEvent.type === 'ended') {
          completeAdPlayback(playbackEvent);

          const pendingSessionEndEvent = pendingSessionEndEventRef.current;

          if (pendingSessionEndEvent) {
            emitAnalytics(analytics, {
              type: 'session_end',
              position: pendingSessionEndEvent.position,
              duration: pendingSessionEndEvent.duration,
              playbackEvent: pendingSessionEndEvent,
            });
            pendingSessionEndEventRef.current = null;
          }
        }

        if (playbackEvent.type === 'error') {
          failAdPlayback(playbackEvent);

          const pendingSessionEndEvent = pendingSessionEndEventRef.current;

          if (pendingSessionEndEvent) {
            emitAnalytics(analytics, {
              type: 'session_end',
              position: pendingSessionEndEvent.position,
              duration: pendingSessionEndEvent.duration,
              playbackEvent: pendingSessionEndEvent,
            });
            pendingSessionEndEventRef.current = null;
          }
        }

        return;
      }

      if (playbackEvent.type === 'ready') {
        const preroll = ads?.adBreaks.find((adBreak) => adBreak.type === 'preroll');

        if (preroll?.source && !adRef.current.hasPlayedPreroll) {
          const prerollBreak = { type: 'preroll' as const };

          beginAdPlayback(prerollBreak, preroll.source, playbackEvent);
          return;
        }
      }

      if (playbackEvent.type === 'time_update') {
        const ad = adRef.current.getNextAd(playbackEvent.position, false);

        if (ad?.type === 'midroll') {
          const offset = ad.offset;

          if (typeof offset === 'number' && adRef.current.playedMidrolls.has(offset)) {
            return;
          }

          const adBreak = adSourceMapRef.current.get(createAdBreakKey(ad.type, ad.offset));

          if (adBreak?.source) {
            if (typeof offset === 'number') {
              adRef.current.playedMidrolls.add(offset);
            }

            beginAdPlayback(ad, adBreak.source, playbackEvent);
            return;
          }
        }
      }

      const shouldPlayAd =
        playbackEvent.type === 'ended'
          ? adRef.current.getNextAd(playbackEvent.position, true)
          : null;

      if (shouldPlayAd) {
        const adBreak = adSourceMapRef.current.get(
          createAdBreakKey(shouldPlayAd.type, shouldPlayAd.offset),
        );

        if (adBreak?.source) {
          if (shouldPlayAd.type === 'postroll' && !adRef.current.hasPlayedPostroll) {
            emitAnalytics(analytics, {
              type: 'ended',
              position: playbackEvent.position,
              duration: playbackEvent.duration,
              playbackEvent,
            });
            pendingSessionEndEventRef.current = playbackEvent;
          }

          beginAdPlayback(shouldPlayAd, adBreak.source, playbackEvent);
          return;
        }
      }

      const previousPosition = positionRef.current;

      if (playbackEvent.type === 'seek') {
        if (restrictions?.disableSeekingForward && playbackEvent.position > previousPosition) {
          return;
        }

        if (restrictions?.disableSeekingBackward && playbackEvent.position < previousPosition) {
          return;
        }
      }

      positionRef.current = playbackEvent.position;
      onPlaybackEvent?.(playbackEvent);

      if (resumeMainAfterAd && playbackEvent.type === 'play') {
        setResumeMainAfterAd(false);
      }

      if (playbackEvent.type === 'ready') {
        if (pendingQualitySeekPositionRef.current !== null) {
          const positionToRestore = pendingQualitySeekPositionRef.current;
          pendingQualitySeekPositionRef.current = null;
          playerRef.current?.seek(positionToRestore);
        }

        quartileStateRef.current = createQuartileState();
        positionRef.current = playbackEvent.position;
      }

      switch (playbackEvent.type) {
        case 'ready':
          emitAnalytics(analytics, {
            type: 'session_start',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            playbackEvent,
          });
          break;
        case 'play':
          emitAnalytics(analytics, {
            type: 'play',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            playbackEvent,
          });
          break;
        case 'pause':
          emitAnalytics(analytics, {
            type: 'pause',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            playbackEvent,
          });
          break;
        case 'ended':
          emitAnalytics(analytics, {
            type: 'ended',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            playbackEvent,
          });
          emitAnalytics(analytics, {
            type: 'session_end',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            playbackEvent,
          });
          break;
        case 'buffer_start':
          emitAnalytics(analytics, {
            type: 'buffer_start',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            playbackEvent,
          });
          break;
        case 'buffer_end':
          emitAnalytics(analytics, {
            type: 'buffer_end',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            playbackEvent,
          });
          break;
        case 'seek':
          emitAnalytics(analytics, {
            type: 'seek',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            playbackEvent,
          });
          break;
        default:
          break;
      }

      trackQuartiles(playbackEvent);
    },
    [
      ads?.adBreaks,
      analytics,
      beginAdPlayback,
      completeAdPlayback,
      failAdPlayback,
      isAdMode,
      onPlaybackEvent,
      restrictions,
      resumeMainAfterAd,
      trackQuartiles,
      useNativeIMA,
    ],
  );

  const effectiveAutoPlay = React.useMemo(() => {
    if (isMainContentPausedByNativeAd) {
      return false;
    }

    if (useNativeIMA) {
      if (resumeMainAfterAd) {
        return true;
      }

      return rest.autoPlay;
    }

    if (isAdMode) {
      return true;
    }

    if (hasConfiguredPreroll && !adRef.current.hasPlayedPreroll) {
      return false;
    }

    if (resumeMainAfterAd) {
      return true;
    }

    return rest.autoPlay;
  }, [
    hasConfiguredPreroll,
    isAdMode,
    isMainContentPausedByNativeAd,
    resumeMainAfterAd,
    rest.autoPlay,
    useNativeIMA,
  ]);

  const skipSecondsRemaining = React.useMemo(() => {
    if (!skipButtonEnabled || skipAfterSeconds <= 0) {
      return 0;
    }

    if (adStartedAt === null) {
      return skipAfterSeconds;
    }

    const elapsedSeconds = Math.floor((overlayTimestamp - adStartedAt) / 1000);
    return Math.max(0, skipAfterSeconds - elapsedSeconds);
  }, [adStartedAt, overlayTimestamp, skipAfterSeconds, skipButtonEnabled]);

  const isSkipDisabled = skipButtonEnabled && skipSecondsRemaining > 0;

  const handleSkipAd = React.useCallback(() => {
    if (isSkipDisabled) {
      return;
    }

    completeAdPlayback();
  }, [completeAdPlayback, isSkipDisabled]);

  return (
    <ThemeProvider theme={theme} themeName={themeName}>
      <View style={[styles.playerContainer, playerStyle]}>
        <ProCompatibleMamoPlayer
          ref={playerRef}
          {...playerProps}
          useTextureView={playerProps.useTextureView ?? Platform.OS === 'android'}
          style={StyleSheet.absoluteFillObject}
          source={activeSource}
          autoPlay={effectiveAutoPlay}
          textTracks={textTracks as MamoPlayerProps['textTracks']}
          selectedTextTrack={selectedTextTrack as MamoPlayerProps['selectedTextTrack']}
          audioTracks={shouldShowAudioTrackSettings ? tracks?.audioTracks : undefined}
          subtitleTracks={shouldShowSubtitleSettings ? tracks?.subtitleTracks : undefined}
          defaultAudioTrackId={initialAudioTrackId ?? null}
          rate={rate}
          currentQualityId={shouldShowQualitySettings ? currentQualityId : undefined}
          currentAudioTrackId={shouldShowAudioTrackSettings ? currentAudioTrackId : undefined}
          currentSubtitleTrackId={shouldShowSubtitleSettings ? currentSubtitleTrackId : undefined}
          onQualityChange={shouldShowQualitySettings ? changeQuality : undefined}
          onAudioTrackChange={shouldShowAudioTrackSettings ? changeAudioTrack : undefined}
          onSubtitleTrackChange={shouldShowSubtitleSettings ? changeSubtitleTrack : undefined}
          onPlaybackEvent={handlePlaybackEvent}
          onPictureInPictureStatusChanged={handlePictureInPictureStatusChanged}
          paused={resolvedPausedState}
        />
        {/* Modern OTT layout: enable with layoutVariant="ott" and themeName="ott". */}
        <ProMamoPlayerOverlays
          showAdOverlay={adRef.current.isAdPlaying === true || isNativeAdPlaying}
          skipButtonEnabled={skipButtonEnabled}
          isSkipDisabled={isSkipDisabled}
          skipSecondsRemaining={skipSecondsRemaining}
          handleSkipAd={handleSkipAd}
          showPipButton={pip?.enabled === true}
          pipState={pipState}
          requestPip={requestPip}
          showSettingsButton={hasSettingsSections}
          isSettingsOpen={isSettingsOpen}
          openSettings={openSettings}
          closeSettings={closeSettings}
          settingsSections={settingsSections}
          settingsHeaderTitle="Settings"
          settingsLabelForOff="Off"
          selectQualityOption={selectQualityOption}
          selectSubtitleOption={selectSubtitleOption}
          selectAudioOption={selectAudioOption}
          showTransportControls
          isPlaying={
            resolvedPausedState === undefined ? isInlinePlaybackActive : !resolvedPausedState
          }
          isFullscreen={isFullscreen}
          timelineDuration={mediaDuration}
          timelinePosition={currentPosition}
          onTimelineSeek={handleTimelineSeek}
          onTogglePlayback={handleTogglePlayback}
          onSeekBackTenSeconds={handleSeekBackTenSeconds}
          onSeekForwardTenSeconds={handleSeekForwardTenSeconds}
          onToggleFullscreen={handleToggleFullscreen}
          layoutVariant={layoutVariant}
          icons={icons}
          watermark={watermark}
          watermarkPosition={watermarkPosition}
        />
      </View>
    </ThemeProvider>
  );
};

const styles = StyleSheet.create({
  playerContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
});

const stylesFactory = (theme: PlayerThemeConfig, layoutVariant: PlayerLayoutVariant) => {
  const { colors, typography, shape } = getThemePrimitives(theme);
  const isOttLayout = layoutVariant === 'ott';

  // Modern OTT layout: enable by setting layoutVariant="ott" and themeName="ott".

  const overlayBackgroundColor =
    colors.overlay ?? colors.backgroundOverlay ?? colors.controlBackground ?? colors.background;
  const primaryTextColor = colors.primaryText ?? colors.textPrimary ?? colors.secondaryText;
  const secondaryTextColor = colors.secondaryText ?? colors.primaryText ?? colors.textSecondary;
  const buttonBackgroundColor = colors.primary ?? colors.accent ?? colors.background;
  const panelBackgroundColor = colors.background ?? '#0B0D10';
  const panelOverlayColor = colors.overlay ?? colors.backgroundOverlay ?? overlayBackgroundColor;
  const panelBorderColor = colors.border ?? 'rgba(255, 255, 255, 0.15)';
  const accentColor = colors.accent ?? colors.primary ?? primaryTextColor;
  const textSmallSize =
    typeof typography.fontSizeSmall === 'number'
      ? typography.fontSizeSmall
      : typeof typography.captionSize === 'number'
        ? typography.captionSize
        : 12;
  const textMediumSize =
    typeof typography.fontSizeMedium === 'number'
      ? typography.fontSizeMedium
      : typeof typography.bodySize === 'number'
        ? typography.bodySize
        : 14;
  const textLargeSize =
    typeof typography.fontSizeLarge === 'number'
      ? typography.fontSizeLarge
      : typeof typography.headingSize === 'number'
        ? typography.headingSize
        : 20;
  const tokenLargeTypography =
    typeof typography.large === 'number' ? typography.large : textLargeSize;
  const mediumRadius =
    typeof shape.borderRadiusMedium === 'number'
      ? shape.borderRadiusMedium
      : typeof shape.radiusMd === 'number'
        ? shape.radiusMd
        : 12;
  const largeRadius =
    typeof shape.borderRadiusLarge === 'number'
      ? shape.borderRadiusLarge
      : typeof shape.radiusLg === 'number'
        ? shape.radiusLg
        : 18;

  return StyleSheet.create({
    adOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      zIndex: 2,
      backgroundColor: overlayBackgroundColor,
    },
    adText: {
      color: primaryTextColor,
      fontSize: textMediumSize,
    },
    skipButton: {
      backgroundColor: buttonBackgroundColor,
      borderRadius: mediumRadius,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    skipButtonDisabled: {
      opacity: 0.6,
    },
    skipButtonText: {
      color: primaryTextColor,
      fontSize: textSmallSize,
    },
    controlsRow: {
      position: 'absolute',
      top: 12,
      right: 12,
      zIndex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: isOttLayout ? 10 : 8,
      backgroundColor: panelOverlayColor,
      borderWidth: 1,
      borderColor: panelBorderColor,
      borderRadius: isOttLayout ? largeRadius : mediumRadius,
      paddingHorizontal: isOttLayout ? 10 : 8,
      paddingVertical: isOttLayout ? 8 : 6,
    },
    settingsButton: {
      backgroundColor: panelOverlayColor,
      borderRadius: isOttLayout ? largeRadius : mediumRadius,
      borderWidth: 1,
      borderColor: panelBorderColor,
      minHeight: isOttLayout ? 50 : 40,
      paddingHorizontal: isOttLayout ? 16 : 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    transportControlsRoot: {
      position: 'absolute',
      bottom: 10,
      left: 12,
      right: 12,
      zIndex: 2,
      gap: 10,
      backgroundColor: panelOverlayColor,
      borderWidth: 1,
      borderColor: panelBorderColor,
      borderRadius: isOttLayout ? largeRadius : mediumRadius,
      paddingHorizontal: isOttLayout ? 14 : 10,
      paddingVertical: isOttLayout ? 12 : 8,
    },
    transportControlsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    transportButton: {
      minHeight: isOttLayout ? 56 : 44,
      minWidth: isOttLayout ? 56 : 44,
      paddingHorizontal: isOttLayout ? 14 : 10,
      borderRadius: isOttLayout ? largeRadius : mediumRadius,
      backgroundColor: panelOverlayColor,
      borderWidth: 1,
      borderColor: panelBorderColor,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },
    transportPrimaryButton: {
      minHeight: isOttLayout ? 58 : 46,
      minWidth: isOttLayout ? 92 : 72,
      paddingHorizontal: isOttLayout ? 18 : 14,
      borderRadius: isOttLayout ? largeRadius : mediumRadius,
      backgroundColor: buttonBackgroundColor,
      borderWidth: 1,
      borderColor: panelBorderColor,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1.1,
    },
    transportButtonText: {
      color: primaryTextColor,
      fontSize: isOttLayout ? textMediumSize + 2 : textMediumSize,
      fontWeight: '700',
    },
    transportButtonContent: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: isOttLayout ? 4 : 2,
    },
    transportButtonLabel: {
      color: primaryTextColor,
      fontSize: isOttLayout ? textSmallSize : Math.max(10, textSmallSize - 1),
      fontWeight: '700',
      letterSpacing: 0.2,
    },
    ottProgressTrack: {
      height: isOttLayout ? 8 : 5,
      borderRadius: isOttLayout ? 999 : 8,
      justifyContent: 'center',
    },
    settingsButtonText: {
      color: primaryTextColor,
      fontSize: isOttLayout ? textMediumSize : textSmallSize,
      fontWeight: '700',
    },
    pipButton: {
      backgroundColor: buttonBackgroundColor,
      borderRadius: isOttLayout ? largeRadius : mediumRadius,
      paddingHorizontal: isOttLayout ? 14 : 12,
      minHeight: isOttLayout ? 50 : 40,
      borderWidth: 1,
      borderColor: panelBorderColor,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 6,
    },
    pipButtonText: {
      color: primaryTextColor,
      fontSize: isOttLayout ? textMediumSize : textSmallSize,
      fontWeight: '700',
    },
    settingsOverlayRoot: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 4,
      justifyContent: isOttLayout ? 'flex-end' : 'center',
      alignItems: isOttLayout ? 'stretch' : 'center',
    },
    settingsOverlayBackdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: panelOverlayColor,
    },
    settingsPanel: {
      backgroundColor: panelBackgroundColor,
      borderTopLeftRadius: isOttLayout ? largeRadius : mediumRadius,
      borderTopRightRadius: isOttLayout ? largeRadius : mediumRadius,
      borderBottomLeftRadius: isOttLayout ? 0 : mediumRadius,
      borderBottomRightRadius: isOttLayout ? 0 : mediumRadius,
      borderWidth: 1,
      borderColor: panelBorderColor,
      borderBottomWidth: isOttLayout ? 0 : 1,
      paddingHorizontal: isOttLayout ? 20 : 16,
      paddingTop: isOttLayout ? 16 : 12,
      paddingBottom: isOttLayout ? 28 : 20,
      maxHeight: isOttLayout ? '78%' : '66%',
      width: isOttLayout ? '100%' : '88%',
    },
    settingsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: isOttLayout ? 14 : 10,
    },
    settingsTitle: {
      color: primaryTextColor,
      fontSize: isOttLayout ? tokenLargeTypography : textMediumSize,
      fontWeight: '800',
    },
    settingsCloseButton: {
      minWidth: isOttLayout ? 44 : 36,
      minHeight: isOttLayout ? 44 : 36,
      borderRadius: isOttLayout ? 22 : 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: overlayBackgroundColor,
    },
    settingsCloseButtonText: {
      color: primaryTextColor,
    },
    settingsSectionsContainer: {
      gap: isOttLayout ? 16 : 12,
    },
    settingsSection: {
      gap: 8,
    },
    settingsSectionTitle: {
      color: primaryTextColor,
      fontSize: isOttLayout ? tokenLargeTypography : textSmallSize,
      fontWeight: '700',
    },
    settingsOptionRow: {
      minHeight: isOttLayout ? 58 : 42,
      borderRadius: mediumRadius,
      backgroundColor: panelOverlayColor,
      borderWidth: 1,
      borderColor: panelBorderColor,
      paddingHorizontal: isOttLayout ? 18 : 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settingsOptionLabel: {
      color: secondaryTextColor,
      fontSize: isOttLayout ? textLargeSize : textSmallSize,
      fontWeight: '500',
      flexShrink: 1,
    },
    settingsOptionLeading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flexShrink: 1,
    },
    settingsOptionLabelSelected: {
      color: primaryTextColor,
      fontWeight: '700',
    },
    settingsOptionSelectedLabel: {
      color: accentColor,
      fontSize: isOttLayout ? textSmallSize : Math.max(11, textSmallSize - 1),
      fontWeight: '700',
    },
    watermarkText: {
      position: 'absolute',
      color: primaryTextColor,
      fontSize: textSmallSize,
    },
  });
};

export default ProMamoPlayer;
