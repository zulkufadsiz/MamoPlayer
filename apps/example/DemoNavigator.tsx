import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import CoreDemoScreen from './CoreDemoScreen';
import ProDemoScreen from './ProDemoScreen';

type ActiveDemo = 'core' | 'pro' | null;

/**
 * DemoNavigator is the canonical entry point for the MamoPlayer SDK demo app.
 *
 * It renders a home screen with cards for each demo, and mounts the selected
 * demo screen with a back button to return to the home screen.
 *
 * Usage in index.js:
 *   import DemoNavigator from './apps/example/DemoNavigator';
 *   AppRegistry.registerComponent(appName, () => DemoNavigator);
 */
export default function DemoNavigator() {
  const [activeDemo, setActiveDemo] = useState<ActiveDemo>(null);

  if (activeDemo === 'core') {
    return <CoreDemoScreen onBack={() => setActiveDemo(null)} />;
  }

  if (activeDemo === 'pro') {
    return <ProDemoScreen onBack={() => setActiveDemo(null)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>MamoPlayer SDK Demo</Text>
        <Text style={styles.subtitle}>Select a demo to explore</Text>
      </View>

      <View style={styles.grid}>
        <Pressable
          style={styles.card}
          onPress={() => setActiveDemo('core')}
          testID="nav-core-demo"
        >
          <Text style={styles.cardLabel}>CORE</Text>
          <Text style={styles.cardTitle}>Core Demo</Text>
          <Text style={styles.cardDescription}>
            MP4 · HLS · subtitles · seek · settings overlay · debug overlay{'\n'}via @mamoplayer/core
          </Text>
        </Pressable>

        <Pressable
          style={styles.card}
          onPress={() => setActiveDemo('pro')}
          testID="nav-pro-demo"
        >
          <Text style={styles.cardLabel}>PRO</Text>
          <Text style={styles.cardTitle}>Pro Demo</Text>
          <Text style={styles.cardDescription}>
            Ads · tracks · thumbnails · PiP · restrictions · debug overlay{'\n'}via @mamoplayer/pro
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 32,
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.5,
  },
  grid: {
    gap: 16,
  },
  card: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 12,
    gap: 4,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    opacity: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  cardDescription: {
    fontSize: 13,
    opacity: 0.6,
    lineHeight: 18,
    marginTop: 4,
  },
});
