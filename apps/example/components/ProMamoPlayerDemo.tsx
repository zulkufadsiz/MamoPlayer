import { ProMamoPlayer } from '@mamoplayer/pro';
import { StyleSheet, View } from 'react-native';

export default function ProMamoPlayerDemo() {
  return (
    <View style={styles.container}>
      <ProMamoPlayer
        source={{ uri: 'https://test-stream.m3u8' }}
        analytics={{ onEvent: (e) => console.log('analytics event:', e) }}
        watermark={{
          text: 'developer@example.com',
          opacity: 0.2,
          randomizePosition: true,
          intervalMs: 5000,
        }}
        restrictions={{
          disableSeekingForward: true,
          maxPlaybackRate: 1.0,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
