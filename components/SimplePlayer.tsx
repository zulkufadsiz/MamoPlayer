import type { PlayerIconSet } from '@/types/icons';
import type { PlayerLayoutVariant } from '@/types/layout';
import type { VideoSource } from '@/types/video';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Video from 'react-native-video';

interface Subtitle {
  start: number | string;
  end: number | string;
  text: string;
}

interface SubtitleTrack {
  id: string;
  label: string;
  language?: string;
  subtitles: Subtitle[];
}

interface AudioTrack {
  id: string;
  label: string;
  language?: string;
}

export interface SimplePlayerProps {
  source: VideoSource;
  videoSourcesByLanguage?: Record<string, VideoSource>;
  qualitySources?: Record<string, VideoSource>;
  qualitySourcesByLanguage?: Record<string, Record<string, VideoSource>>;
  audioTracks?: AudioTrack[];
  defaultAudioTrackId?: string | null;
  style?: any;
  autoPlay?: boolean;
  resizeMode?: 'contain' | 'cover' | 'stretch';
  startAt?: number;
  nativeControls?: boolean;
  contentFit?: 'contain' | 'cover' | 'fill';
  allowsFullscreen?: boolean;
  allowsPictureInPicture?: boolean;
  onPlayingChange?: (isPlaying: boolean) => void;
  subtitles?: Subtitle[];
  subtitleTracks?: SubtitleTrack[];
  defaultSubtitleTrackId?: string | null;
  onSettingsPress?: () => void;
  icons?: PlayerIconSet;
  skipSeconds?: number;
  showSkipButtons?: boolean;
  title?: string;
  author?: string;
  artwork?: string;
  isPremiumUser?: boolean;
  layoutVariant?: PlayerLayoutVariant;
}

const resolveSource = (source: VideoSource) => {
  if (typeof source === 'number') return source;
  if (typeof source === 'string') return { uri: source };
  return source;
};

export const SimplePlayer: React.FC<SimplePlayerProps> = ({
  source,
  autoPlay = false,
  resizeMode,
  nativeControls = true,
  contentFit = 'contain',
  style,
  onPlayingChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const resolvedSource = useMemo(() => resolveSource(source), [source]);
  const effectiveResizeMode = resizeMode ?? (contentFit === 'fill' ? 'stretch' : contentFit);

  const handleTogglePlay = () => {
    const next = !isPlaying;
    setIsPlaying(next);
    onPlayingChange?.(next);
  };

  return (
    <View style={[styles.container, style]}>
      <Video
        source={resolvedSource as any}
        paused={!isPlaying}
        controls={nativeControls}
        resizeMode={effectiveResizeMode}
        style={styles.video}
      />
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable onPress={handleTogglePlay} style={styles.playButton}>
          <Text style={styles.playText}>{isPlaying ? 'Pause' : 'Play'}</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 16,
  },
  playButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  playText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default SimplePlayer;
