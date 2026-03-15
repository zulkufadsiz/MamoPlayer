import {
    MamoPlayer as MamoPlayerCore,
    type MamoPlayerProps,
    type MamoPlayerSource,
    type PlaybackEvent,
    type SettingsOverlayConfig,
    type SettingsSection
} from '@mamoplayer/core';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import React, { useRef } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { VideoRef } from 'react-native-video';
import { AdStateMachine } from './ads/AdState';
import { useProPlayerController } from './hooks/useProPlayerController';
import { useProSettingsSections } from './hooks/useProSettingsSections';
import { loadAds, releaseAds, subscribeToAdsEvents } from './ima/nativeBridge';
import { getThumbnailForTime } from './internal/thumbnails';
import { validateLicenseKey } from './licensing/license';
import { ThemeProvider, usePlayerTheme } from './theme/ThemeContext';
import type { AdBreak, AdsConfig } from './types/ads';
import type { AnalyticsConfig, AnalyticsEvent } from './types/analytics';
import type { PlayerIconSet } from './types/icons';
import type { IMAConfig } from './types/ima';
import type { PlayerLayoutVariant } from './types/layout';
import type { PipConfig, PipEvent, PipState } from './types/pip';
import type { PlaybackRestrictions } from './types/restrictions';
import type { PlayerThemeConfig, ThemeName } from './types/theme';
import type { ThumbnailFrame, ThumbnailsConfig } from './types/thumbnails';
import type { TracksConfig, VideoQualityId } from './types/tracks';
import type { WatermarkConfig } from './types/watermark';

/** Internal helper: returns whether a source points to a local/offline file. */
const detectSourceType = (source: MamoPlayerSource): 'offline' | 'streaming' => {
  const isOfflineUri = (uri: string) =>
    uri.startsWith('file://') ||
    uri.startsWith('asset://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('/');

  if (typeof source === 'number') return 'offline';
  if (typeof source === 'string') return isOfflineUri(source) ? 'offline' : 'streaming';
  if (Array.isArray(source)) {
    const first = source[0];
    if (first && typeof first === 'object' && 'uri' in first && typeof first.uri === 'string') {
      return isOfflineUri(first.uri) ? 'offline' : 'streaming';
    }
    return 'streaming';
  }
  if (source && typeof source === 'object') {
    const uri = (source as { uri?: string }).uri;
    if (typeof uri === 'string') return isOfflineUri(uri) ? 'offline' : 'streaming';
  }
  return 'streaming';
};

/**
 * Props for `ProMamoPlayer` — the full-featured Pro video player component.
 *
 * Extends all `MamoPlayerProps` from `@mamoplayer/core` with Pro-exclusive
 * capabilities: ads, analytics, multi-track support, theming, PiP, and more.
 */
export interface ProMamoPlayerProps extends MamoPlayerProps {
  /**
   * Your MamoPlayer Pro license key (format: `MAMO-...`).
   * Required in production. Omitting it logs a warning and disables Pro features.
   */
  licenseKey?: string;
  /**
   * Custom (non-IMA) ad break configuration.
   * Mutually exclusive with `ima` — when both are set `ima` takes precedence.
   */
  ads?: AdsConfig;
  /**
   * Google IMA SDK ad integration.
   * When `ima.enabled` is `true` the native MamoAdsModule handles ad scheduling.
   * Mutually exclusive with `ads`.
   */
  ima?: IMAConfig;
  /** Analytics event listener configuration. All playback and ad lifecycle events are forwarded to `onEvent`. */
  analytics?: AnalyticsConfig;
  /**
   * Override the quality variants, audio tracks, and subtitle tracks available to the user.
   * When omitted the player relies on what the media manifest exposes natively.
   */
  tracks?: TracksConfig;
  /**
   * Pre-generated thumbnail frames for the scrubber preview card.
   * Provide an array of `{ time, uri }` frames; the player shows the closest
   * frame to the scrub position while the user is dragging the timeline.
   */
  thumbnails?: ThumbnailsConfig;
  /** Enforce playback restrictions in the player UI (e.g. disable forward seeking). */
  restrictions?: PlaybackRestrictions;
  /** Text watermark rendered on top of the video to deter unauthorised recording. */
  watermark?: WatermarkConfig;
  /** Built-in preset theme name. When provided alongside `theme`, used as the base. */
  themeName?: ThemeName;
  /** Full custom theme token set. Takes precedence over `themeName`. */
  theme?: PlayerThemeConfig;
  /** Custom icon components to replace the default Material icon set (partial overrides are supported). */
  icons?: PlayerIconSet;
  /**
   * Player UI layout variant.
   * - `'compact'`  — Minimal controls for small embedded players.
   * - `'standard'` — Full controls with transport buttons and timeline (default).
   * - `'ott'`      — OTT streaming-app style with larger scrubber and bottom controls.
   */
  layoutVariant?: PlayerLayoutVariant;
  /** Picture-in-picture configuration. */
  pip?: PipConfig;
  /** Settings overlay configuration (merged with Pro-generated quality/subtitle/audio entries). */
  settingsOverlay?: SettingsOverlayConfig;
  /** Called whenever the picture-in-picture window state changes. */
  onPipEvent?: (event: PipEvent) => void;
}

type OverlayOption = {
  id: string;
  label: string;
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

const getSubtitleCueTextFromPayload = (payload: unknown): string | undefined => {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const payloadRecord = payload as {
    text?: unknown;
    cue?: { text?: unknown } | unknown;
    cues?: Array<{ text?: unknown } | unknown> | unknown;
    nativeEvent?: {
      text?: unknown;
      cue?: { text?: unknown } | unknown;
      cues?: Array<{ text?: unknown } | unknown> | unknown;
    };
  };

  const candidateContainers = [payloadRecord, payloadRecord.nativeEvent].filter(Boolean) as Array<{
    text?: unknown;
    cue?: { text?: unknown } | unknown;
    cues?: Array<{ text?: unknown } | unknown> | unknown;
  }>;

  for (const container of candidateContainers) {
    if (typeof container.text === 'string') {
      const normalized = container.text.trim();
      if (normalized.length > 0) {
        return normalized;
      }
    }

    if (
      container.cue &&
      typeof container.cue === 'object' &&
      typeof (container.cue as { text?: unknown }).text === 'string'
    ) {
      const normalized = (container.cue as { text: string }).text.trim();
      if (normalized.length > 0) {
        return normalized;
      }
    }

    if (Array.isArray(container.cues)) {
      const textLines = container.cues
        .filter((cue): cue is { text?: unknown } => Boolean(cue) && typeof cue === 'object')
        .map((cue) => cue.text)
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

      if (textLines.length > 0) {
        return textLines.join('\n');
      }
    }
  }

  return undefined;
};

type ParsedSubtitleCue = {
  start: number;
  end: number;
  text: string;
};

const parseVttTimestampToSeconds = (rawTimestamp: string): number | null => {
  const normalizedTimestamp = rawTimestamp.trim().replace(',', '.');
  const parts = normalizedTimestamp.split(':');

  if (parts.length < 2 || parts.length > 3) {
    return null;
  }

  const [hoursPart, minutesPart, secondsPart] =
    parts.length === 3 ? parts : ['0', parts[0] ?? '0', parts[1] ?? '0'];
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  const seconds = Number(secondsPart);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return null;
  }

  return hours * 3600 + minutes * 60 + seconds;
};

const parseVttCues = (vttContent: string): ParsedSubtitleCue[] => {
  const normalizedContent = vttContent.replace(/\r/g, '');
  const blocks = normalizedContent.split(/\n\n+/);
  const cues: ParsedSubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      continue;
    }

    if (lines[0] === 'WEBVTT' || lines[0].startsWith('NOTE') || lines[0].startsWith('STYLE')) {
      continue;
    }

    const timingLineIndex = lines.findIndex((line) => line.includes('-->'));

    if (timingLineIndex < 0) {
      continue;
    }

    const timingLine = lines[timingLineIndex];
    const [startRaw = '', endWithSettings = ''] = timingLine.split('-->');
    const endRaw = endWithSettings.trim().split(/\s+/)[0] ?? '';
    const startSeconds = parseVttTimestampToSeconds(startRaw);
    const endSeconds = parseVttTimestampToSeconds(endRaw);

    if (
      typeof startSeconds !== 'number' ||
      typeof endSeconds !== 'number' ||
      endSeconds <= startSeconds
    ) {
      continue;
    }

    const cueText = lines
      .slice(timingLineIndex + 1)
      .join('\n')
      .trim();

    if (cueText.length === 0) {
      continue;
    }

    cues.push({
      start: startSeconds,
      end: endSeconds,
      text: cueText,
    });
  }

  return cues;
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

interface ProMamoPlayerQualityOverlayProps {
  showAdOverlay: boolean;
  adOverlayInset?: AdsConfig['overlayInset'];
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
  qualityOptions: OverlayOption[];
  selectedQualityOptionId?: string;
  selectQualityOption?: (qualityId: string) => void;
  layoutVariant: PlayerLayoutVariant;
  icons?: PlayerIconSet;
  watermark?: WatermarkConfig;
  watermarkPosition: { top: number; left: number };
  subtitleText?: string;
  subtitleBottomOffset?: number;
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

const ProMamoPlayerQualityOverlay: React.FC<ProMamoPlayerQualityOverlayProps> = ({
  showAdOverlay,
  adOverlayInset,
  skipButtonEnabled,
  isSkipDisabled,
  skipSecondsRemaining,
  handleSkipAd,
  isSettingsOpen,
  closeSettings,
  qualityOptions,
  selectedQualityOptionId,
  selectQualityOption,
  layoutVariant,
  watermark,
  watermarkPosition,
  subtitleText,
  subtitleBottomOffset,
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

    return colors.primaryText ?? colors.textPrimary ?? colors.secondaryText ?? '#E5E7EB';
  }, [playerTheme]);
  const styles = React.useMemo(
    () => stylesFactory(playerTheme, layoutVariant),
    [layoutVariant, playerTheme],
  );
  const resolvedAdOverlayInsetStyle = React.useMemo(
    () => ({
      paddingRight: adOverlayInset?.right ?? (isOttLayout ? 20 : 14),
      paddingBottom: adOverlayInset?.bottom ?? (isOttLayout ? 22 : 16),
    }),
    [adOverlayInset?.bottom, adOverlayInset?.right, isOttLayout],
  );
  const handleQualityOptionPress = React.useCallback(
    (optionId: string) => {
      selectQualityOption?.(optionId);

      if (CLOSE_SETTINGS_ON_SELECTION) {
        closeSettings();
      }
    },
    [closeSettings, selectQualityOption],
  );

  return (
    <>
      {showAdOverlay ? (
        <View style={[styles.adOverlay, resolvedAdOverlayInsetStyle]}>
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
      

      {isSettingsOpen ? (
        <View
          style={styles.settingsOverlayRoot}
          testID="pro-settings-overlay"
          pointerEvents="box-none"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close quality settings overlay background"
            accessibilityHint="Closes the quality settings overlay"
            onPress={closeSettings}
            style={styles.settingsOverlayBackdrop}
            testID="pro-settings-overlay-backdrop"
          />

          <Animated.View style={[styles.settingsPanel, settingsPanelAnimatedStyle]}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>Video Quality Options</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close video quality options overlay"
                accessibilityHint="Closes the video quality options overlay"
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

            <ScrollView
              style={styles.settingsSectionsScroll}
              contentContainerStyle={styles.settingsSectionsContainer}
              showsVerticalScrollIndicator={false}
              testID="pro-settings-sections-scroll"
            >
              <View style={styles.settingsSection}>
                {qualityOptions.map((option) => {
                  const isSelected = option.id === selectedQualityOptionId;

                  return (
                    <Pressable
                      key={`quality-${option.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Quality ${option.label}`}
                      accessibilityHint={`Select ${option.label} for quality`}
                      onPress={() => handleQualityOptionPress(option.id)}
                      style={styles.settingsOptionRow}
                      testID={`pro-settings-option-quality-${option.id}`}
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
                        <MaterialIcons name="check" size={22} color={overlayIconColor} />
                      ) : (
                        <View style={styles.settingsOptionCheckPlaceholder} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
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
      {subtitleText ? (
        <Text
          style={[
            styles.subtitleText,
            typeof subtitleBottomOffset === 'number' ? { bottom: subtitleBottomOffset } : null,
          ]}
        >
          {subtitleText}
        </Text>
      ) : null}
    </>
  );
};

interface ProFullscreenSubtitleOverlayProps {
  subtitleText?: string;
  layoutVariant: PlayerLayoutVariant;
}

const ProFullscreenSubtitleOverlay: React.FC<ProFullscreenSubtitleOverlayProps> = ({
  subtitleText,
  layoutVariant,
}) => {
  const playerTheme = usePlayerTheme();
  const styles = React.useMemo(
    () => stylesFactory(playerTheme, layoutVariant),
    [layoutVariant, playerTheme],
  );

  if (!subtitleText) {
    return null;
  }

  return <Text style={styles.subtitleText}>{subtitleText}</Text>;
};

export const ProMamoPlayer: React.FC<ProMamoPlayerProps> = ({
  licenseKey,
  ads,
  ima,
  analytics: analyticsProp,
  tracks,
  thumbnails,
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
  const ProCompatibleMamoPlayer = MamoPlayerCore as unknown as React.ComponentType<
    Record<string, unknown>
  >;
  const {
    style: playerStyle,
    topRightActions: consumerTopRightActions,
    onTextTrackDataChanged: consumerOnTextTrackDataChanged,
    ...playerProps
  } = rest as typeof rest & {
    topRightActions?: React.ReactNode;
    onTextTrackDataChanged?: (payload: unknown) => void;
  };

  const resolvedSettings = {
    enabled: settingsOverlay?.enabled ?? true,
    showQuality: settingsOverlay?.showQuality ?? true,
    showSubtitles: settingsOverlay?.showSubtitles ?? true,
    showAudioTracks: settingsOverlay?.showAudioTracks ?? true,
  };

  const isOfflineSource = React.useMemo(
    () => detectSourceType(rest.source) === 'offline',
    [rest.source],
  );
  // Analytics are network-dependent; suppress them for offline/local sources.
  const analytics = isOfflineSource ? undefined : analyticsProp;

  const hasMultipleDubLanguageOptions = React.useMemo(() => {
    const audioTracks = tracks?.audioTracks;

    if (!audioTracks || audioTracks.length < 2) {
      return false;
    }

    const uniqueLanguages = new Set(
      audioTracks
        .map((audioTrack) => {
          const normalizedLanguage = audioTrack.language?.trim().toLowerCase();
          if (normalizedLanguage) {
            return normalizedLanguage;
          }

          const normalizedLabel = audioTrack.label.trim().toLowerCase();
          return normalizedLabel.length > 0 ? normalizedLabel : audioTrack.id;
        }),
    );

    return uniqueLanguages.size > 1;
  }, [tracks?.audioTracks]);

  const shouldShowQualitySettings = resolvedSettings.enabled && resolvedSettings.showQuality;
  const shouldShowSubtitleSettings = resolvedSettings.enabled && resolvedSettings.showSubtitles;
  const shouldShowAudioTrackSettings =
    resolvedSettings.enabled && resolvedSettings.showAudioTracks && hasMultipleDubLanguageOptions;
  // Separate from shouldShowAudioTrackSettings: this only requires the tracks to exist,
  // not multiple distinct languages, so the Audio section appears whenever audio tracks are provided.
  const hasAudioSectionOptions =
    resolvedSettings.enabled && resolvedSettings.showAudioTracks && Boolean(tracks?.audioTracks?.length);

  const playerRef = React.useRef<VideoRef | null>(null);
  const adRef = useRef(new AdStateMachine());
  const quartileStateRef = React.useRef<Record<Quartile, boolean>>(createQuartileState());
  const positionRef = React.useRef(0);
  const durationRef = React.useRef<number | undefined>(undefined);
  // Tracks the last thumbnail frame URI that triggered a setScrubThumbnailFrame call so
  // we can bail out early when the thumbnail hasn't actually changed, avoiding unnecessary
  // re-renders of ProMamoPlayer (and its entire subtree) on every pan-move event.
  const scrubThumbnailFrameRef = React.useRef<ThumbnailFrame | null>(null);
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
  const pendingFullscreenSeekPositionRef = React.useRef<number | null>(null);
  const pendingAdSeekPositionRef = React.useRef<number | null>(null);
  const adSourceMapRef = React.useRef<Map<string, AdBreak>>(new Map());
  const adMainContentStartPositionRef = React.useRef<number | null>(null);
  const [isAdMode, setIsAdMode] = React.useState(false);
  const [resumeMainAfterAd, setResumeMainAfterAd] = React.useState(false);
  const [activeSource, setActiveSource] =
    React.useState<MamoPlayerProps['source']>(initialMainSource);
  const [watermarkPosition, setWatermarkPosition] = React.useState({ top: 10, left: 10 });
  const [adStartedAt, setAdStartedAt] = React.useState<number | null>(null);
  const [overlayTimestamp, setOverlayTimestamp] = React.useState(() => Date.now());
  const shouldUseNativeIMA = Boolean(ima?.enabled && ima.adTagUrl && !isOfflineSource);
  const [hasNativeIMAFailed, setHasNativeIMAFailed] = React.useState(false);
  const [isNativeAdPlaying, setIsNativeAdPlaying] = React.useState(false);
  const [isMainContentPausedByNativeAd, setIsMainContentPausedByNativeAd] = React.useState(false);

  // ─── Pro controller ───────────────────────────────────────────────────────
  // Delegates quality / subtitle / audio-track state, PiP state, debug
  // visibility, and their associated analytics to `useProPlayerController`.
  const proController = useProPlayerController({
    tracks,
    pip,
    thumbnails,
    analytics,
    // Provide live position/duration so analytics events are enriched.
    // positionRef / durationRef are updated in handlePlaybackEvent so the
    // ref values are always current when an action callback fires.
    coreController: { position: positionRef.current, duration: durationRef.current ?? 0 },
    initialQualityId,
    initialAudioTrackId: initialAudioTrackId ?? null,
    initialSubtitleTrackId: initialSubtitleTrackId ?? null,
    videoRef: playerRef,
    onPipEvent: (event) => {
      onPipEvent?.(event);
    },
  });

  // Stable ref so async callbacks (analytics in handlePlaybackEvent) always
  // read the latest track selection without stale-closure issues.
  const proControllerRef = React.useRef(proController);
  proControllerRef.current = proController;

  const { currentQualityId, currentAudioTrackId, currentSubtitleTrackId } = proController;

  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [pausedOverride, setPausedOverride] = React.useState<boolean | null>(null);
  const [isInlinePlaybackPaused, setIsInlinePlaybackPaused] = React.useState<boolean | undefined>(
    undefined,
  );
  const [isInlinePlaybackActive, setIsInlinePlaybackActive] = React.useState(
    Boolean(rest.autoPlay),
  );
  const [mediaDuration, setMediaDuration] = React.useState(0);
  const [currentPosition, setCurrentPosition] = React.useState(0);
  const [bufferedPosition, setBufferedPosition] = React.useState<number | undefined>(undefined);
  const [isTimelineScrubbing, setIsTimelineScrubbing] = React.useState(false);
  const [scrubThumbnailFrame, setScrubThumbnailFrame] = React.useState<ThumbnailFrame | null>(
    null,
  );
  const [activeSubtitleCueText, setActiveSubtitleCueText] = React.useState<string | undefined>(
    undefined,
  );
  const [parsedSubtitleCues, setParsedSubtitleCues] = React.useState<ParsedSubtitleCue[]>([]);
  const [isCoreFullscreen, setIsCoreFullscreen] = React.useState(false);

  const qualityOptions = React.useMemo<OverlayOption[]>(() => {
    if (!shouldShowQualitySettings || !tracks?.qualities?.length) {
      return [];
    }

    return tracks.qualities.map((quality) => ({
      id: quality.id,
      label: quality.label,
    }));
  }, [shouldShowQualitySettings, tracks?.qualities]);

  const hasQualityOptions = Boolean(shouldShowQualitySettings && tracks?.qualities?.length);

  React.useEffect(() => {
    if (!hasQualityOptions && isSettingsOpen) {
      setIsSettingsOpen(false);
    }
  }, [hasQualityOptions, isSettingsOpen]);

  const openSettings = React.useCallback(() => {
    if (!hasQualityOptions) {
      return;
    }

    setIsSettingsOpen(true);
  }, [hasQualityOptions]);

  const closeSettings = React.useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const resolvedPausedState = pausedOverride ??
    (typeof rest.paused === 'boolean' ? rest.paused : isInlinePlaybackPaused);

  React.useEffect(() => {
    setPausedOverride(null);
  }, [rest.paused]);

  const resolveScrubThumbnailFrame = React.useCallback(
    (time: number): ThumbnailFrame | null => {
      return getThumbnailForTime(thumbnails, time);
    },
    [thumbnails],
  );

  const handleTimelineScrubStart = React.useCallback(() => {
    setIsTimelineScrubbing(true);

    if (!thumbnails) {
      scrubThumbnailFrameRef.current = null;
      setScrubThumbnailFrame(null);
      return;
    }

    const initialFrame = resolveScrubThumbnailFrame(positionRef.current);
    scrubThumbnailFrameRef.current = initialFrame;
    setScrubThumbnailFrame(initialFrame);
  }, [resolveScrubThumbnailFrame, thumbnails]);

  const handleTimelineScrub = React.useCallback(
    (time: number) => {
      if (!thumbnails) {
        return;
      }

      const nextFrame = resolveScrubThumbnailFrame(time);
      // Only update state when the thumbnail URI actually changes to prevent
      // re-rendering the full ProMamoPlayer tree on every pan-move event.
      if (nextFrame?.uri === scrubThumbnailFrameRef.current?.uri) {
        return;
      }
      scrubThumbnailFrameRef.current = nextFrame;
      setScrubThumbnailFrame(nextFrame);
    },
    [resolveScrubThumbnailFrame, thumbnails],
  );

  const handleTimelineScrubEnd = React.useCallback(
    (_time: number) => {
      // MamoPlayerCore already handles the seek and playback resume on scrub end.
      // Here we only clear the thumbnail preview state.
      setIsTimelineScrubbing(false);
      scrubThumbnailFrameRef.current = null;
      setScrubThumbnailFrame(null);
    },
    [],
  );
  // Native PiP events ('mamo_pip_active' / 'mamo_pip_exiting') are handled
  // inside useProPlayerController which owns the pipState.
  // The Video component's onPictureInPictureStatusChanged is also forwarded to
  // the consumer via onPipEvent so existing API consumers keep working.
  const handlePictureInPictureStatusChanged = React.useCallback(
    (event: Readonly<{ isActive: boolean }>) => {
      if (pip?.enabled !== false) {
        const state = event.isActive ? 'active' : 'inactive';
        proController.setPipState(state);
        onPipEvent?.({ state });
      }
      onPictureInPictureStatusChanged?.(event);
    },
    [onPictureInPictureStatusChanged, onPipEvent, pip?.enabled, proController],
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
      proControllerRef.current.setIsAdPlaying(false);

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
            proControllerRef.current.setIsAdPlaying(true);

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
            proControllerRef.current.setIsAdPlaying(false);

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

    const qualityVariant = tracks?.qualities?.find(
      (quality) => quality.id === currentQualityId,
    );

    const nextSource = qualityVariant?.uri
      ? resolveSourceWithQualityUri(rest.source, qualityVariant.uri)
      : rest.source;

    mainSourceRef.current = nextSource;
    setActiveSource(nextSource);
  }, [currentQualityId, isAdMode, rest.source, tracks?.qualities]);

  React.useEffect(() => {
    setActiveSubtitleCueText(undefined);
  }, [currentSubtitleTrackId]);

  const changeQuality = React.useCallback(
    (qualityId: VideoQualityId) => {
      const qualityVariant = tracks?.qualities?.find((quality) => quality.id === qualityId);

      if (!qualityVariant) {
        return;
      }

      if (qualityVariant.id === proControllerRef.current.currentQualityId) {
        return;
      }

      const previousPosition = positionRef.current;
      pendingQualitySeekPositionRef.current = previousPosition > 0 ? previousPosition : null;

      // Pre-compute and cache the source so the sync-effect and completeAdPlayback
      // both use exactly the same object, avoiding a second native video reload.
      const nextSource = resolveSourceWithQualityUri(rest.source, qualityVariant.uri);
      mainSourceRef.current = nextSource;

      console.log(`[MamoPlayer Pro] Quality changed: ${qualityVariant.id}`);

      // Delegates state update and analytics to the controller hook.
      proControllerRef.current.changeQuality(qualityVariant.id);

      // Source update is handled exclusively by the source-sync effect below.
      // Calling setActiveSource here too would trigger a second native reload
      // (different object reference, same URI), causing duplicate ready events,
      // double session_start analytics, and a transient positionRef reset to 0.
    },
    [rest.source, tracks?.qualities],
  );

  const changeAudioTrack = React.useCallback(
    (audioTrackId: string) => {
      const audioTrack = tracks?.audioTracks?.find((t) => t.id === audioTrackId);

      if (!audioTrack || audioTrackId === proControllerRef.current.currentAudioTrackId) {
        return;
      }

      console.log(
        `[MamoPlayer Pro] Audio track changed: ${audioTrackId}${
          audioTrack.label ? ` (${audioTrack.label})` : ''
        }`,
      );

      // Delegates state update and analytics to the controller hook.
      proControllerRef.current.changeAudioTrack(audioTrackId);
    },
    [tracks?.audioTracks],
  );

  const changeSubtitleTrack = React.useCallback(
    // TODO: Expose as part of a ProMamoPlayer imperative ref handle so consumers can
    // programmatically switch subtitle tracks (e.g. changeSubtitleTrack('en') or 'off').
    // Requires converting ProMamoPlayer from React.FC to React.forwardRef and defining
    // a ProMamoPlayerRef type with { changeSubtitleTrack, currentSubtitleTrackId }.
    (subtitleTrackId: string | 'off') => {
      const subtitleTracks = tracks?.subtitleTracks;

      if (!subtitleTracks) {
        return;
      }

      const currentSubtitleId = proControllerRef.current.currentSubtitleTrackId;

      if (subtitleTrackId === 'off') {
        if (currentSubtitleId === 'off') {
          return;
        }

        console.log('[MamoPlayer Pro] Subtitle track changed: off');
        // Delegates state update and analytics to the controller hook.
        proControllerRef.current.changeSubtitleTrack('off');
        return;
      }

      const subtitleTrackExists = subtitleTracks.some(
        (subtitleTrack) => subtitleTrack.id === subtitleTrackId,
      );

      if (!subtitleTrackExists || subtitleTrackId === currentSubtitleId) {
        return;
      }

      const selectedSubtitleTrackLabel = subtitleTracks.find(
        (subtitleTrack) => subtitleTrack.id === subtitleTrackId,
      )?.label;
      console.log(
        `[MamoPlayer Pro] Subtitle track changed: ${subtitleTrackId}${
          selectedSubtitleTrackLabel ? ` (${selectedSubtitleTrackLabel})` : ''
        }`,
      );
      // Delegates state update and analytics to the controller hook.
      proControllerRef.current.changeSubtitleTrack(subtitleTrackId);
    },
    [tracks?.subtitleTracks],
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

    const selectedSubtitleTrack = tracks.subtitleTracks.find(
      (subtitleTrack) => subtitleTrack.id === currentSubtitleTrackId,
    );

    if (!selectedSubtitleTrack) {
      return { type: 'disabled' as const };
    }

    return {
      type: 'title' as const,
      value: selectedSubtitleTrack.label,
    };
  }, [currentSubtitleTrackId, tracks?.subtitleTracks]);

  const playerTextTracks = textTracks;

  const sourceWithSubtitles = React.useMemo(() => {
    if (!textTracks || textTracks.length === 0) {
      return activeSource;
    }

    const sourceBase =
      typeof activeSource === 'string'
        ? { uri: activeSource }
        : activeSource && typeof activeSource === 'object' && !Array.isArray(activeSource)
          ? { ...(activeSource as object) }
          : null;

    if (!sourceBase) {
      return activeSource;
    }

    return {
      ...sourceBase,
      textTracks,
      selectedTextTrack,
    };
  }, [activeSource, textTracks, selectedTextTrack]);

  const completeAdPlayback = React.useCallback(
    (playbackEvent?: PlaybackEvent) => {
      const currentAdBreak = adRef.current.currentAdBreak;
      const mainContentPositionToResume =
        adMainContentStartPositionRef.current ?? positionRef.current;

      if (currentAdBreak) {
        adRef.current.markAdCompleted(currentAdBreak);
      }

      if (mainContentPositionToResume > 0) {
        pendingAdSeekPositionRef.current = mainContentPositionToResume;
      }

      positionRef.current = mainContentPositionToResume;
      setIsAdMode(false);
      setActiveSource(mainSourceRef.current);
      setResumeMainAfterAd(true);
      setAdStartedAt(null);
      proControllerRef.current.setIsAdPlaying(false);

      emitAdAnalytics(analytics, 'ad_complete', {
        playbackEvent,
        fallbackPosition: positionRef.current,
        adPosition: currentAdBreak?.type,
        mainContentPositionAtAdStart: mainContentPositionToResume,
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
      proControllerRef.current.setIsAdPlaying(false);

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
      mainSourceRef.current = activeSource;
      setActiveSource(adSource as MamoPlayerProps['source']);
      setIsAdMode(true);
      setAdStartedAt(Date.now());
      setOverlayTimestamp(Date.now());
      proControllerRef.current.setIsAdPlaying(true);

      const mainContentPositionAtAdStart = playbackEvent?.position ?? positionRef.current;
      adMainContentStartPositionRef.current = mainContentPositionAtAdStart;

      emitAdAnalytics(analytics, 'ad_start', {
        playbackEvent,
        fallbackPosition: positionRef.current,
        adPosition: adBreak.type,
        mainContentPositionAtAdStart,
      });
    },
    [activeSource, analytics],
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

  const restorePendingSeekPosition = React.useCallback(() => {
    const positionToRestore =
      pendingQualitySeekPositionRef.current ??
      pendingFullscreenSeekPositionRef.current ??
      pendingAdSeekPositionRef.current;

    pendingQualitySeekPositionRef.current = null;
    pendingFullscreenSeekPositionRef.current = null;
    pendingAdSeekPositionRef.current = null;

    if (typeof positionToRestore === 'number' && positionToRestore > 0) {
      playerRef.current?.seek(positionToRestore);
    }
  }, []);

  const handlePlaybackEvent = React.useCallback(
    (playbackEvent: PlaybackEvent) => {
      const playbackEventWithBuffer = playbackEvent as PlaybackEvent & {
        buffered?: number;
        playableDuration?: number;
      };
      const bufferedCandidate =
        typeof playbackEventWithBuffer.buffered === 'number' &&
        Number.isFinite(playbackEventWithBuffer.buffered)
          ? playbackEventWithBuffer.buffered
          : typeof playbackEventWithBuffer.playableDuration === 'number' &&
              Number.isFinite(playbackEventWithBuffer.playableDuration)
            ? playbackEventWithBuffer.playableDuration
            : undefined;

      if (typeof bufferedCandidate === 'number') {
        setBufferedPosition(bufferedCandidate);
      }

      setCurrentPosition(playbackEvent.position);

      if (typeof playbackEvent.duration === 'number' && playbackEvent.duration > 0) {
        setMediaDuration(playbackEvent.duration);
        durationRef.current = playbackEvent.duration;
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
            (pendingQualitySeekPositionRef.current !== null ||
              pendingFullscreenSeekPositionRef.current !== null) &&
            !isNativeAdPlaying &&
            !isMainContentPausedByNativeAd
          ) {
            restorePendingSeekPosition();
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
            emitAnalytics(analytics, {
              type: 'buffering_start',
              position: playbackEvent.position,
              duration: playbackEvent.duration,
              selectedQuality: proControllerRef.current.currentQualityId,
              selectedSubtitle: proControllerRef.current.currentSubtitleTrackId ?? undefined,
              selectedAudioTrack: proControllerRef.current.currentAudioTrackId ?? undefined,
              playbackEvent,
              sessionId: analytics?.sessionId,
            });
            break;
          case 'buffer_end':
            emitAnalytics(analytics, {
              type: 'buffer_end',
              position: playbackEvent.position,
              duration: playbackEvent.duration,
              playbackEvent,
            });
            emitAnalytics(analytics, {
              type: 'buffering_end',
              position: playbackEvent.position,
              duration: playbackEvent.duration,
              selectedQuality: proControllerRef.current.currentQualityId,
              selectedSubtitle: proControllerRef.current.currentSubtitleTrackId ?? undefined,
              selectedAudioTrack: proControllerRef.current.currentAudioTrackId ?? undefined,
              playbackEvent,
              sessionId: analytics?.sessionId,
            });
            break;
          case 'error':
            emitAnalytics(analytics, {
              type: 'playback_error',
              position: playbackEvent.position,
              duration: playbackEvent.duration,
              selectedQuality: proControllerRef.current.currentQualityId,
              selectedSubtitle: proControllerRef.current.currentSubtitleTrackId ?? undefined,
              selectedAudioTrack: proControllerRef.current.currentAudioTrackId ?? undefined,
              errorMessage: playbackEvent.error?.message,
              playbackEvent,
              sessionId: analytics?.sessionId,
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

        if (preroll?.source && !adRef.current.hasPlayedPreroll && !isOfflineSource) {
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

          if (adBreak?.source && !isOfflineSource) {
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

        if (adBreak?.source && !isOfflineSource) {
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
        if (
          pendingQualitySeekPositionRef.current !== null ||
          pendingFullscreenSeekPositionRef.current !== null ||
          pendingAdSeekPositionRef.current !== null
        ) {
          restorePendingSeekPosition();
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
          emitAnalytics(analytics, {
            type: 'buffering_start',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            selectedQuality: proControllerRef.current.currentQualityId,
            selectedSubtitle: proControllerRef.current.currentSubtitleTrackId ?? undefined,
            selectedAudioTrack: proControllerRef.current.currentAudioTrackId ?? undefined,
            playbackEvent,
            sessionId: analytics?.sessionId,
          });
          break;
        case 'buffer_end':
          emitAnalytics(analytics, {
            type: 'buffer_end',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            playbackEvent,
          });
          emitAnalytics(analytics, {
            type: 'buffering_end',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            selectedQuality: proControllerRef.current.currentQualityId,
            selectedSubtitle: proControllerRef.current.currentSubtitleTrackId ?? undefined,
            selectedAudioTrack: proControllerRef.current.currentAudioTrackId ?? undefined,
            playbackEvent,
            sessionId: analytics?.sessionId,
          });
          break;
        case 'error':
          emitAnalytics(analytics, {
            type: 'playback_error',
            position: playbackEvent.position,
            duration: playbackEvent.duration,
            selectedQuality: proControllerRef.current.currentQualityId,
            selectedSubtitle: proControllerRef.current.currentSubtitleTrackId ?? undefined,
            selectedAudioTrack: proControllerRef.current.currentAudioTrackId ?? undefined,
            errorMessage: playbackEvent.error?.message,
            playbackEvent,
            sessionId: analytics?.sessionId,
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
      isOfflineSource,
      onPlaybackEvent,
      restrictions,
      restorePendingSeekPosition,
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

    if (hasConfiguredPreroll && !adRef.current.hasPlayedPreroll && !isOfflineSource) {
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
    isOfflineSource,
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

  const selectedAudio = React.useMemo(
    () => tracks?.audioTracks?.find((audioTrack) => audioTrack.id === currentAudioTrackId),
    [currentAudioTrackId, tracks?.audioTracks],
  );
  const selectedSubtitle = React.useMemo(
    () => tracks?.subtitleTracks?.find((subtitleTrack) => subtitleTrack.id === currentSubtitleTrackId),
    [currentSubtitleTrackId, tracks?.subtitleTracks],
  );

  React.useEffect(() => {
    if (!shouldShowSubtitleSettings || currentSubtitleTrackId === 'off' || !selectedSubtitle?.uri) {
      setParsedSubtitleCues([]);
      return;
    }

    let isCancelled = false;

    const loadSubtitleCues = async () => {
      try {
        const response = await fetch(selectedSubtitle.uri);

        if (!response.ok) {
          throw new Error(`Failed to fetch subtitle track (${response.status})`);
        }

        const subtitleFileContent = await response.text();

        if (isCancelled) {
          return;
        }

        const cues = parseVttCues(subtitleFileContent);
        setParsedSubtitleCues(cues);
        console.log(
          `[MamoPlayer Pro] Loaded subtitle cues: ${cues.length} from ${selectedSubtitle.uri}`,
        );
      } catch (error) {
        if (isCancelled) {
          return;
        }

        setParsedSubtitleCues([]);
        const reason =
          error instanceof Error ? error.message : 'Unable to parse subtitle cues from track URI.';
        console.warn(`[MamoPlayer Pro] ${reason}`);
      }
    };

    void loadSubtitleCues();

    return () => {
      isCancelled = true;
    };
  }, [currentSubtitleTrackId, selectedSubtitle?.uri, shouldShowSubtitleSettings]);

  const fallbackSubtitleCueText = React.useMemo(() => {
    if (currentSubtitleTrackId === 'off' || parsedSubtitleCues.length === 0) {
      return undefined;
    }

    const activeCue = parsedSubtitleCues.find(
      (cue) => currentPosition >= cue.start && currentPosition <= cue.end,
    );

    return activeCue?.text;
  }, [currentPosition, currentSubtitleTrackId, parsedSubtitleCues]);
  const resolvedSubtitleText =
    currentSubtitleTrackId === 'off' ? undefined : activeSubtitleCueText ?? fallbackSubtitleCueText;

  const selectedAudioTrackForPlayer = React.useMemo(() => {
    if (!currentAudioTrackId || !tracks?.audioTracks) {
      return undefined;
    }

    const audioTrack = tracks.audioTracks.find((t) => t.id === currentAudioTrackId);
    const nativeLanguage = audioTrack?.language?.trim();

    if (!nativeLanguage) {
      return undefined;
    }

    return { type: 'language' as const, value: nativeLanguage };
  }, [currentAudioTrackId, tracks?.audioTracks]);

  const selectedTextTrackForPlayer = React.useMemo(() => {
    if (isCoreFullscreen && currentSubtitleTrackId && currentSubtitleTrackId !== 'off') {
      return { type: 'disabled' as const };
    }

    return selectedTextTrack;
  }, [currentSubtitleTrackId, isCoreFullscreen, selectedTextTrack]);

  const handleCoreFullscreenChange = React.useCallback((isFullscreen: boolean) => {
    if (positionRef.current > 0) {
      pendingFullscreenSeekPositionRef.current = positionRef.current;
    }

    setIsCoreFullscreen(isFullscreen);
  }, []);

  const handleTextTrackDataChanged = React.useCallback(
    (payload: unknown) => {
      console.log('[MamoPlayer Pro] Text track data changed:', payload);

      if (!shouldShowSubtitleSettings || currentSubtitleTrackId === 'off') {
        setActiveSubtitleCueText(undefined);
        consumerOnTextTrackDataChanged?.(payload);
        return;
      }

      const cueText = getSubtitleCueTextFromPayload(payload);
      setActiveSubtitleCueText(cueText);

      if (cueText) {
        console.log(`[MamoPlayer Pro] Subtitle cue: ${cueText}`);
      }

      consumerOnTextTrackDataChanged?.(payload);
    },
    [consumerOnTextTrackDataChanged, currentSubtitleTrackId, shouldShowSubtitleSettings],
  );

  const proSettingsSections: SettingsSection[] = useProSettingsSections({
    tracks,
    shouldShowQuality: shouldShowQualitySettings,
    shouldShowSubtitles: shouldShowSubtitleSettings,
    shouldShowAudio: hasAudioSectionOptions,
    currentQualityId,
    currentSubtitleTrackId,
    currentAudioTrackId,
    changeQuality,
    changeSubtitleTrack,
    changeAudioTrack,
  });

  const coreSettingsOverlayConfig = React.useMemo<SettingsOverlayConfig | undefined>(() => {
    return {
      ...settingsOverlay,
      showSubtitles: false,
      extraSections: proSettingsSections,
    };
  }, [settingsOverlay, proSettingsSections]);

  return (
    <ThemeProvider theme={theme} themeName={themeName}>
      <View style={[styles.playerContainer, playerStyle]}>
        <ProCompatibleMamoPlayer
          ref={playerRef}
          {...playerProps}
          useTextureView={playerProps.useTextureView ?? Platform.OS === 'android'}
          style={StyleSheet.absoluteFillObject}
          settingsOverlay={coreSettingsOverlayConfig}
          source={sourceWithSubtitles}
          autoPlay={effectiveAutoPlay}
          textTracks={playerTextTracks as MamoPlayerProps['textTracks']}
          selectedTextTrack={selectedTextTrackForPlayer as MamoPlayerProps['selectedTextTrack']}
          audioTracks={shouldShowAudioTrackSettings ? tracks?.audioTracks : undefined}
          defaultAudioTrackId={initialAudioTrackId ?? null}
          selectedAudioTrack={selectedAudioTrackForPlayer}
          rate={rate}
          currentQualityId={shouldShowQualitySettings ? currentQualityId : undefined}
          currentAudioTrackId={shouldShowAudioTrackSettings ? currentAudioTrackId : undefined}
          subtitleTracks={shouldShowSubtitleSettings ? tracks?.subtitleTracks : undefined}
          currentSubtitleTrackId={shouldShowSubtitleSettings ? currentSubtitleTrackId : undefined}
          onQualityChange={shouldShowQualitySettings ? changeQuality : undefined}
          onAudioTrackChange={shouldShowAudioTrackSettings ? changeAudioTrack : undefined}
          onSubtitleTrackChange={shouldShowSubtitleSettings ? changeSubtitleTrack : undefined}
          onTextTrackDataChanged={handleTextTrackDataChanged}
          onFullscreenChange={handleCoreFullscreenChange}
          overlayContent={
            isCoreFullscreen ? (
              <ProFullscreenSubtitleOverlay
                subtitleText={resolvedSubtitleText}
                layoutVariant={layoutVariant}
              />
            ) : null
          }
          onPlaybackEvent={handlePlaybackEvent}
          onPictureInPictureStatusChanged={handlePictureInPictureStatusChanged}
          paused={resolvedPausedState}
          onScrubStart={handleTimelineScrubStart}
          onScrubMove={handleTimelineScrub}
          onScrubEnd={handleTimelineScrubEnd}
          timelineConfig={scrubThumbnailFrame?.uri ? { thumbnailUri: scrubThumbnailFrame.uri } : undefined}
          topRightActions={
            <View style={styles.topRightActionsContainer}>
              {consumerTopRightActions ? consumerTopRightActions : null}
              {pip?.enabled === true ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Enter picture in picture"
                  onPress={proController.requestPip}
                  testID="pro-topright-pip-button"
                >
                  <MaterialIcons name="picture-in-picture" size={24} color="#FFFFFF" />
                </Pressable>
              ) : null}
              {hasQualityOptions ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open quality settings overlay"
                  onPress={openSettings}
                  testID="pro-topright-hd-button"
                >
                  <MaterialIcons name="hd" size={24} color="#FFFFFF" />
                </Pressable>
              ) : null}
            </View>
          }
        
        />
      
        <ProMamoPlayerQualityOverlay
          showAdOverlay={adRef.current.isAdPlaying === true || isNativeAdPlaying}
          adOverlayInset={ads?.overlayInset}
          skipButtonEnabled={skipButtonEnabled}
          isSkipDisabled={isSkipDisabled}
          skipSecondsRemaining={skipSecondsRemaining}
          handleSkipAd={handleSkipAd}
          showPipButton={pip?.enabled === true}
          pipState={proController.pipState}
          requestPip={proController.requestPip}
          showSettingsButton={hasQualityOptions}
          isSettingsOpen={isSettingsOpen}
          openSettings={openSettings}
          closeSettings={closeSettings}
          qualityOptions={qualityOptions}
          selectedQualityOptionId={currentQualityId}
          selectQualityOption={selectQualityOption}
          layoutVariant={layoutVariant}
          icons={icons}
          watermark={watermark}
          watermarkPosition={watermarkPosition}
          subtitleText={!isCoreFullscreen ? resolvedSubtitleText : undefined}
          subtitleBottomOffset={layoutVariant === 'ott' ? 56 : 42}
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
  topRightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  const adButtonBackgroundColor =
    colors.controlBackground ?? colors.overlay ?? colors.backgroundOverlay ?? 'rgba(31, 41, 55, 0.95)';
  const accentColor = colors.accent ?? colors.primary ?? primaryTextColor;
  const settingsBackdropColor = 'rgba(0, 0, 0, 0.5)';
  const settingsPanelColor = 'rgba(17, 24, 39, 0.98)';
  const settingsBorderColor = 'rgba(148, 163, 184, 0.3)';
  const settingsHeaderBorderColor = 'rgba(148, 163, 184, 0.35)';
  const settingsPrimaryTextColor = colors.primaryText ?? colors.textPrimary ?? '#E5E7EB';
  const settingsSecondaryTextColor = colors.secondaryText ?? colors.textSecondary ?? '#9CA3AF';
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
      alignItems: 'flex-end',
      justifyContent: 'flex-end',
      gap: 8,
      zIndex: 2,
      backgroundColor: 'transparent',
      paddingRight: isOttLayout ? 20 : 14,
      paddingBottom: isOttLayout ? 22 : 16,
    },
    adText: {
      color: primaryTextColor,
      fontSize: textMediumSize,
      textAlign: 'right',
    },
    skipButton: {
      backgroundColor: adButtonBackgroundColor,
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
    transportOptions: {
      flex: 4,
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
      width: '100%',
      justifyContent: 'center',
      gap: isOttLayout ? 8 : 6,
    },
    timelineThumbnailContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    timelineThumbnail: {
      width: isOttLayout ? 136 : 120,
      height: isOttLayout ? 76 : 68,
      borderRadius: mediumRadius,
      borderWidth: 1,
      borderColor: panelBorderColor,
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
      backgroundColor: settingsBackdropColor,
    },
    settingsPanel: {
      backgroundColor: settingsPanelColor,
      borderTopLeftRadius: isOttLayout ? largeRadius : mediumRadius,
      borderTopRightRadius: isOttLayout ? largeRadius : mediumRadius,
      borderBottomLeftRadius: isOttLayout ? 0 : mediumRadius,
      borderBottomRightRadius: isOttLayout ? 0 : mediumRadius,
      borderWidth: 1,
      borderColor: settingsBorderColor,
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
      minHeight: 36,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: settingsHeaderBorderColor,
      paddingBottom: 8,
      marginBottom: isOttLayout ? 10 : 8,
    },
    settingsTitle: {
      color: settingsPrimaryTextColor,
      flex: 1,
      textAlign: 'center',
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
    },
    settingsCloseButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    settingsCloseButtonText: {
      color: primaryTextColor,
    },
    settingsSectionsContainer: {
      gap: isOttLayout ? 16 : 12,
      paddingBottom: isOttLayout ? 8 : 4,
    },
    settingsSectionsScroll: {
      flexShrink: 1,
    },
    settingsSection: {
      gap: 4,
    },
    settingsSectionTitle: {
      color: settingsSecondaryTextColor,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '700',
      marginTop: isOttLayout ? 6 : 4,
    },
    settingsOptionRow: {
      minHeight: isOttLayout ? 50 : 44,
      borderRadius: 0,
      backgroundColor: 'transparent',
      borderWidth: 0,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: settingsBorderColor,
      paddingHorizontal: 0,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settingsOptionLabel: {
      color: settingsPrimaryTextColor,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      flexShrink: 1,
    },
    settingsOptionLeading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flexShrink: 1,
    },
    settingsOptionLabelSelected: {
      color: settingsPrimaryTextColor,
      fontWeight: '600',
    },
    settingsOptionCheckPlaceholder: {
      width: 24,
      height: 24,
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
    subtitleText: {
      position: 'absolute',
      bottom: isOttLayout ? 88 : 48,
      alignSelf: 'center',
      color: primaryTextColor,
      fontSize: isOttLayout ? textMediumSize : textSmallSize,
      fontWeight: '600',
      backgroundColor: panelOverlayColor,
      borderRadius: mediumRadius,
      paddingHorizontal: isOttLayout ? 10 : 8,
      paddingVertical: isOttLayout ? 6 : 4,
      maxWidth: '90%',
      textAlign: 'center',
    },
  });
};

export default ProMamoPlayer;
