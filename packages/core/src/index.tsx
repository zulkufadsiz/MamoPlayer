import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Video from 'react-native-video';

export type MamoPlayerSource = React.ComponentProps<typeof Video>['source'];

export interface MamoPlayerCoreProps {
  source: MamoPlayerSource;
  style?: ViewStyle;
  videoStyle?: ViewStyle;
  paused?: boolean;
  repeat?: boolean;
  muted?: boolean;
  controls?: boolean;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'none';
  poster?: string;
  onEnd?: () => void;
  onError?: (error: unknown) => void;
}

export const MamoPlayerCore: React.FC<MamoPlayerCoreProps> = ({
  source,
  style,
  videoStyle,
  paused = false,
  repeat = false,
  muted = false,
  controls = true,
  resizeMode = 'contain',
  poster,
  onEnd,
  onError,
}) => {
  return (
    <View style={[styles.container, style]}>
      <Video
        source={source}
        style={[styles.video, videoStyle]}
        paused={paused}
        repeat={repeat}
        muted={muted}
        controls={controls}
        resizeMode={resizeMode}
        poster={poster}
        onEnd={onEnd}
        onError={onError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});

export default MamoPlayerCore;