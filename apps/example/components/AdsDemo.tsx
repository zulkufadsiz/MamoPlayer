import { ProMamoPlayer } from '@mamoplayer/pro';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function AdsDemo() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>IMA Ads Demo</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player</Text>
          <View style={styles.playerArea}>
            <ProMamoPlayer
              source={{ uri: 'https://main-content-video.mp4' }}
              ima={{
                enabled: true,
                adTagUrl:
                  'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=',
              }}
              analytics={{ onEvent: (event: unknown) => console.log('analytics', event) }}
              style={styles.player}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  playerArea: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
  },
  player: {
    height: '100%',
    width: '100%',
  },
});
