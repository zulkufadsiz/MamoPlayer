import { ProMamoPlayer } from '@mamoplayer/pro';
import { StyleSheet, View } from 'react-native';

export default function ProMamoPlayerDemo() {
  return (
    <View style={styles.container}>
      <ProMamoPlayer
        source={{ uri: 'https://your-test-video.mp4' }}
        analytics={{ onEvent: (e) => console.log('analytics event', e) }}
        watermark={{
          text: 'user@example.com',
          randomizePosition: true,
          intervalMs: 7000,
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
