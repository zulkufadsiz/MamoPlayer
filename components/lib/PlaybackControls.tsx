import type { PlayerIconSet } from '@/types/icons';
import type { PlayerLayoutVariant } from '@/types/layout';
import { useEffect, useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Timeline from './Timeline';

const Ionicons = ({ name, size = 20, color = '#fff' }: { name: string; size?: number; color?: string }) => {
  const fallback = name.includes('chat') ? '💬' : '•';
  return <Text style={{ fontSize: size, color }}>{fallback}</Text>;
};

const MaterialIcons = ({ name, size = 20, color = '#fff' }: { name: string; size?: number; color?: string }) => {
  const fallback = name.includes('picture') ? '▣' : '•';
  return <Text style={{ fontSize: size, color }}>{fallback}</Text>;
};

interface Subtitle {
  start: number | string;
  end: number | string;
  text: string;
}

const parseTimeToSeconds = (value: number | string): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return 0;

  const normalized = value.trim().replace(',', '.');
  if (!normalized) return 0;

  const parts = normalized.split(':');
  if (parts.length > 3) return 0;

  const toNumber = (input: string) => Number.parseFloat(input);
  const parsePart = (input: string) => {
    const parsed = toNumber(input);
    return Number.isFinite(parsed) ? parsed : NaN;
  };

  if (parts.length === 3) {
    const hrs = parsePart(parts[0]);
    const mins = parsePart(parts[1]);
    const secs = parsePart(parts[2]);
    if ([hrs, mins, secs].some((part) => Number.isNaN(part))) return 0;
    return Math.max(0, hrs * 3600 + mins * 60 + secs);
  }
  if (parts.length === 2) {
    const mins = parsePart(parts[0]);
    const secs = parsePart(parts[1]);
    if ([mins, secs].some((part) => Number.isNaN(part))) return 0;
    return Math.max(0, mins * 60 + secs);
  }

  const secondsOnly = parsePart(parts[0]);
  if (Number.isNaN(secondsOnly)) return 0;
  return Math.max(0, secondsOnly);
};

interface PlaybackControlsProps {
  isPlaying: boolean;
  player: any;
  duration: number;
  mediaUrl?: string | null;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  icons?: PlayerIconSet;
  onSkipBackward?: () => void;
  onSkipForward?: () => void;
  skipSeconds?: number;
  isFullscreen: boolean;
  onFullscreenChange: (isFullscreen: boolean) => void;
  subtitles?: Subtitle[];
  showSubtitles?: boolean;
  subtitleFontSize?: number;
  subtitleFontStyle?: 'normal' | 'bold' | 'thin' | 'italic';
  onSubtitlesToggle?: () => void;
  onSettingsPress?: () => void;
  settingsOpen?: boolean;
  allowsPictureInPicture?: boolean;
  isPictureInPictureActive?: boolean;
  onPictureInPictureToggle?: () => void;
  hasSubtitles?: boolean;
  layoutVariant?: PlayerLayoutVariant;
  autoHideControls?: boolean;
  autoHideDelayMs?: number;
}

const renderIcon = (
  IconComponent: PlayerIconSet[keyof PlayerIconSet] | undefined,
  fallbackLabel: string,
  size: number,
) => {
  if (IconComponent) {
    return <IconComponent size={size} color="#FFFFFF" />;
  }

  return <Text style={[styles.defaultIconText, { fontSize: size }]}>{fallbackLabel}</Text>;
};

type LayoutTheme = {
  buttonBackground: string;
  skipButtonBackground: string;
  overlayBackground: string;
};

const defaultLayoutTheme: LayoutTheme = {
  buttonBackground: 'rgba(0, 0, 0, 0.6)',
  skipButtonBackground: 'rgba(0, 0, 0, 0.5)',
  overlayBackground: 'rgba(0, 0, 0, 0.2)',
};

const getLayoutStyles = (layoutVariant: PlayerLayoutVariant, theme: LayoutTheme) => {
  if (layoutVariant === 'compact') {
    return {
      centerGap: 14,
      playButtonSize: 68,
      playIconSize: 34,
      skipButtonSize: 46,
      skipIconSize: 20,
      skipTextSize: 10,
      actionButtonSize: 42,
      actionIconSize: 18,
      actionTopOffset: 8,
      actionRightOffset: 8,
      actionGap: 8,
      subtitleBottom: 72,
      subtitlePaddingHorizontal: 12,
      subtitlePaddingVertical: 8,
      subtitleMaxWidth: '88%' as const,
      subtitleSizeMultiplier: 0.9,
      showSkipButtons: false,
      showSettingsButton: false,
      showPipButton: false,
      showOttActionLabels: false,
      overlayBackground: theme.overlayBackground,
      buttonBackground: theme.buttonBackground,
      skipButtonBackground: theme.skipButtonBackground,
    };
  }

  if (layoutVariant === 'ott') {
    return {
      centerGap: 30,
      playButtonSize: 96,
      playIconSize: 48,
      skipButtonSize: 66,
      skipIconSize: 28,
      skipTextSize: 13,
      actionButtonSize: 56,
      actionIconSize: 26,
      actionTopOffset: 16,
      actionRightOffset: 16,
      actionGap: 12,
      subtitleBottom: 100,
      subtitlePaddingHorizontal: 22,
      subtitlePaddingVertical: 14,
      subtitleMaxWidth: '94%' as const,
      subtitleSizeMultiplier: 1.2,
      showSkipButtons: true,
      showSettingsButton: true,
      showPipButton: true,
      showOttActionLabels: true,
      overlayBackground: 'rgba(0, 0, 0, 0.28)',
      buttonBackground: theme.buttonBackground,
      skipButtonBackground: theme.skipButtonBackground,
    };
  }

  return {
    centerGap: 24,
    playButtonSize: 80,
    playIconSize: 42,
    skipButtonSize: 56,
    skipIconSize: 24,
    skipTextSize: 11,
    actionButtonSize: 50,
    actionIconSize: 24,
    actionTopOffset: 12,
    actionRightOffset: 12,
    actionGap: 10,
    subtitleBottom: 80,
    subtitlePaddingHorizontal: 16,
    subtitlePaddingVertical: 10,
    subtitleMaxWidth: '90%' as const,
    subtitleSizeMultiplier: 1,
    showSkipButtons: true,
    showSettingsButton: true,
    showPipButton: true,
    showOttActionLabels: false,
    overlayBackground: theme.overlayBackground,
    buttonBackground: theme.buttonBackground,
    skipButtonBackground: theme.skipButtonBackground,
  };
};

export default function PlaybackControls({
  isPlaying,
  player,
  mediaUrl,
  onPlayPause,
  onSeek,
  icons,
  onSkipBackward,
  onSkipForward,
  skipSeconds = 10,
  isFullscreen,
  onFullscreenChange,
  subtitles = [],
  showSubtitles = true,
  subtitleFontSize = 18,
  subtitleFontStyle = 'normal',
  onSubtitlesToggle,
  onSettingsPress,
  settingsOpen = false,
  allowsPictureInPicture = false,
  isPictureInPictureActive = false,
  onPictureInPictureToggle,
  hasSubtitles,
  layoutVariant = 'standard',
  autoHideControls = false,
  autoHideDelayMs = 3000,
}: PlaybackControlsProps) {
  const { width: _width, height: _height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [controlsVisible, setControlsVisible] = useState(true);
  const layoutStyles = getLayoutStyles(layoutVariant, defaultLayoutTheme);

  const showSkipControls = layoutStyles.showSkipButtons;
  const showSettingsButton = layoutStyles.showSettingsButton;
  const showPipButton = layoutStyles.showPipButton;
  const showOttActionLabels = layoutStyles.showOttActionLabels;
  const subtitleEffectiveSize = Math.round(subtitleFontSize * layoutStyles.subtitleSizeMultiplier);

  // Track current subtitle
  useEffect(() => {
    if (!player || subtitles.length === 0) return;

    const interval = setInterval(() => {
      const currentTime = player.currentTime || 0;
      const subtitle = subtitles.find((sub) => {
        const start = parseTimeToSeconds(sub.start);
        const end = parseTimeToSeconds(sub.end);
        return currentTime >= start && currentTime <= end;
      });
      setCurrentSubtitle(subtitle ? subtitle.text : '');
    }, 100);

    return () => clearInterval(interval);
  }, [player, subtitles]);

  const handlePlayPause = () => {
    onPlayPause();
  };

  const handleSettingsPress = () => {
    setControlsVisible(true);
    onSettingsPress?.();
  };

  const currentDuration = player?.duration ?? 0;

  const showControls = () => {
    setControlsVisible(true);
  };

  const handleFullscreen = () => {
    if (!isFullscreen) {
      onFullscreenChange(true);
    } else {
      onFullscreenChange(false);
    }
  };

  useEffect(() => {
    if (settingsOpen) {
      setControlsVisible(true);
      return;
    }

    if (!autoHideControls) {
      setControlsVisible(true);
      return;
    }

    if (!isPlaying) {
      setControlsVisible(true);
      return;
    }

    const timer = setTimeout(() => {
      setControlsVisible(false);
    }, autoHideDelayMs);

    return () => clearTimeout(timer);
  }, [autoHideControls, autoHideDelayMs, controlsVisible, isPlaying, settingsOpen]);

  return (
    <View style={styles.container}>
      {!controlsVisible && autoHideControls && (
        <Pressable
          style={styles.tapToShow}
          onPress={showControls}
          accessibilityRole="button"
          accessibilityLabel="Show playback controls"
          accessibilityHint="Shows playback actions and timeline"
          hitSlop={12}
        />
      )}

      {controlsVisible && (
        <View
          style={[styles.controlsOverlay, { backgroundColor: layoutStyles.overlayBackground }]}
          importantForAccessibility={controlsVisible ? 'yes' : 'no-hide-descendants'}
        >
          {/* Center Play/Pause Button */}
          <View style={[styles.centerControls, { gap: layoutStyles.centerGap }]}>
            {showSkipControls && onSkipBackward && (
              <TouchableOpacity
                style={[
                  styles.skipButton,
                  {
                    width: layoutStyles.skipButtonSize,
                    height: layoutStyles.skipButtonSize,
                    borderRadius: layoutStyles.skipButtonSize / 2,
                    backgroundColor: layoutStyles.skipButtonBackground,
                  },
                ]}
                onPress={onSkipBackward}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Skip backward ${skipSeconds} seconds`}
                accessibilityHint="Moves playback position backward"
                hitSlop={10}
              >
                <Text style={[styles.skipIconText, { fontSize: layoutStyles.skipIconSize }]}>↺</Text>
                <Text style={[styles.skipText, { fontSize: layoutStyles.skipTextSize }]}>
                  {skipSeconds}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.playButton,
                {
                  width: layoutStyles.playButtonSize,
                  height: layoutStyles.playButtonSize,
                  borderRadius: layoutStyles.playButtonSize / 2,
                  backgroundColor: layoutStyles.buttonBackground,
                },
              ]}
              onPress={handlePlayPause}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause video' : 'Play video'}
              accessibilityHint={isPlaying ? 'Pauses playback' : 'Starts playback'}
              hitSlop={10}
            >
              {isPlaying
                ? renderIcon(icons?.Pause, '❚❚', layoutStyles.playIconSize)
                : renderIcon(icons?.Play, '▶', layoutStyles.playIconSize)}
            </TouchableOpacity>
            {showSkipControls && onSkipForward && (
              <TouchableOpacity
                style={[
                  styles.skipButton,
                  {
                    width: layoutStyles.skipButtonSize,
                    height: layoutStyles.skipButtonSize,
                    borderRadius: layoutStyles.skipButtonSize / 2,
                    backgroundColor: layoutStyles.skipButtonBackground,
                  },
                ]}
                onPress={onSkipForward}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Skip forward ${skipSeconds} seconds`}
                accessibilityHint="Moves playback position forward"
                hitSlop={10}
              >
                <Text style={[styles.skipIconText, { fontSize: layoutStyles.skipIconSize }]}>↻</Text>
                <Text style={[styles.skipText, { fontSize: layoutStyles.skipTextSize }]}>
                  {skipSeconds}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom Controls */}
          <View
            style={[
              styles.bottomControls,
              {
                top: layoutStyles.actionTopOffset,
                right: layoutStyles.actionRightOffset,
                gap: layoutStyles.actionGap,
              },
              isFullscreen && {
                top: 8,
                right: Math.max(12, insets.right + 8),
              },
            ]}
          >
            {showSettingsButton && onSettingsPress && (
              <TouchableOpacity
                style={[
                  styles.fullscreenButton,
                  {
                    width: layoutStyles.actionButtonSize,
                    height: layoutStyles.actionButtonSize,
                    borderRadius: layoutStyles.actionButtonSize / 2,
                  },
                  showOttActionLabels ? styles.ottActionButton : null,
                ]}
                onPress={handleSettingsPress}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Open settings"
                accessibilityHint="Opens playback and subtitle settings"
                hitSlop={10}
              >
                {renderIcon(icons?.Settings, '⚙', layoutStyles.actionIconSize)}
                {showOttActionLabels ? <Text style={styles.ottActionLabel}>Settings</Text> : null}
              </TouchableOpacity>
            )}
            {onSubtitlesToggle && (hasSubtitles ?? subtitles.length > 0) && (
              <TouchableOpacity
                style={[
                  styles.fullscreenButton,
                  {
                    width: layoutStyles.actionButtonSize,
                    height: layoutStyles.actionButtonSize,
                    borderRadius: layoutStyles.actionButtonSize / 2,
                  },
                  showOttActionLabels ? styles.ottActionButton : null,
                ]}
                onPress={onSubtitlesToggle}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={showSubtitles ? 'Hide subtitles' : 'Show subtitles'}
                accessibilityHint="Toggles subtitle visibility"
                hitSlop={10}
              >
                <Ionicons
                  name={showSubtitles ? 'chatbox' : 'chatbox-outline'}
                  size={layoutStyles.actionIconSize}
                  color="#FFFFFF"
                />
                {showOttActionLabels ? <Text style={styles.ottActionLabel}>Subtitles</Text> : null}
              </TouchableOpacity>
            )}
            {showPipButton && allowsPictureInPicture && onPictureInPictureToggle && (
              <TouchableOpacity
                style={[
                  styles.fullscreenButton,
                  {
                    width: layoutStyles.actionButtonSize,
                    height: layoutStyles.actionButtonSize,
                    borderRadius: layoutStyles.actionButtonSize / 2,
                  },
                  showOttActionLabels ? styles.ottActionButton : null,
                ]}
                onPress={onPictureInPictureToggle}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={
                  isPictureInPictureActive ? 'Exit picture in picture' : 'Enter picture in picture'
                }
                accessibilityHint="Toggles picture in picture mode"
                hitSlop={10}
              >
                <MaterialIcons
                  name={isPictureInPictureActive ? 'picture-in-picture' : 'picture-in-picture-alt'}
                  size={layoutStyles.actionIconSize}
                  color="#FFFFFF"
                />
                {showOttActionLabels ? <Text style={styles.ottActionLabel}>PiP</Text> : null}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.fullscreenButton,
                {
                  width: layoutStyles.actionButtonSize,
                  height: layoutStyles.actionButtonSize,
                  borderRadius: layoutStyles.actionButtonSize / 2,
                },
                showOttActionLabels ? styles.ottActionButton : null,
              ]}
              onPress={handleFullscreen}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              accessibilityHint={
                isFullscreen ? 'Returns to inline player' : 'Expands video to fullscreen'
              }
              hitSlop={10}
            >
              {isFullscreen
                ? renderIcon(icons?.ExitFullscreen, '🗗', layoutStyles.actionIconSize - 6)
                : renderIcon(icons?.Fullscreen, '⛶', layoutStyles.actionIconSize - 6)}
              {showOttActionLabels ? (
                <Text style={styles.ottActionLabel}>{isFullscreen ? 'Exit' : 'Fullscreen'}</Text>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Subtitle Display */}
      {showSubtitles && currentSubtitle && (
        <View
          style={[
            styles.subtitleContainer,
            {
              bottom: layoutStyles.subtitleBottom,
              paddingHorizontal: layoutStyles.subtitlePaddingHorizontal,
            },
            isFullscreen && {
              bottom: Math.max(100, insets.bottom + 80),
              paddingLeft: Math.max(20, insets.left + 16),
              paddingRight: Math.max(20, insets.right + 16),
            },
          ]}
          pointerEvents="none"
        >
          <Text
            style={[
              styles.subtitleText,
              {
                fontSize: subtitleEffectiveSize,
                color: '#FFFFFF',
                fontWeight:
                  subtitleFontStyle === 'bold'
                    ? '700'
                    : subtitleFontStyle === 'thin'
                      ? '300'
                      : '400',
                fontStyle: subtitleFontStyle === 'italic' ? 'italic' : 'normal',
                paddingHorizontal: layoutStyles.subtitlePaddingHorizontal,
                paddingVertical: layoutStyles.subtitlePaddingVertical,
                maxWidth: layoutStyles.subtitleMaxWidth,
              },
            ]}
          >
            {currentSubtitle}
          </Text>
        </View>
      )}

      {controlsVisible && (
        <Timeline
          isPlaying={isPlaying}
          player={player}
          duration={currentDuration}
          onSeek={onSeek}
          isFullscreen={isFullscreen}
          mediaUrl={mediaUrl}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 10,
  },
  controlsOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  tapToShow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  skipText: {
    position: 'absolute',
    bottom: 10,
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipIconText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  defaultIconText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 10,
  },
  fullscreenButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ottActionButton: {
    width: 'auto',
    minWidth: 84,
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 6,
  },
  ottActionLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  subtitleContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  subtitleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    maxWidth: '90%',
  },
});
