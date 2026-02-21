import { ProMamoPlayer } from '@mamoplayer/pro';
import { StyleSheet, View } from 'react-native';

export default function AdsDemo() {
  return (
    <View style={styles.container}>
      <ProMamoPlayer
        source={{ uri: 'https://main-content-video.mp4' }}
        ads={{
          adBreaks: [
            { type: 'preroll', source: { uri: 'https://ad1.mp4' } },
            { type: 'midroll', time: 30, source: { uri: 'https://ad2.mp4' } },
            { type: 'postroll', source: { uri: 'https://ad3.mp4' } },
          ],
          skipButtonEnabled: true,
          skipAfterSeconds: 5,
        }}
        analytics={{ onEvent: (e) => console.log('analytics', e) }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
