import { ProMamoPlayer } from '@mamoplayer/pro';
import { useState } from 'react';
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const THEME_OPTIONS = ['light', 'dark', 'ott'] as const;
const LAYOUT_OPTIONS = ['compact', 'standard', 'ott'] as const;

type DemoThemeName = (typeof THEME_OPTIONS)[number];
type DemoLayoutVariant = (typeof LAYOUT_OPTIONS)[number];

export default function ProMamoPlayerDemo() {
  const [selectedThemeName, setSelectedThemeName] = useState<DemoThemeName>('dark');
  const [selectedLayoutVariant, setSelectedLayoutVariant] = useState<DemoLayoutVariant>('standard');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Pro MamoPlayer Demo</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player Configuration</Text>

          <Text style={styles.label}>Theme</Text>
          <View style={styles.optionsRow}>
            {THEME_OPTIONS.map((themeName) => {
              return (
                <View
                  key={themeName}
                  style={styles.optionButtonContainer}
                >
                  <Button
                    title={`${selectedThemeName === themeName ? '✓ ' : ''}${themeName.toUpperCase()}`}
                    onPress={() => setSelectedThemeName(themeName)}
                  />
                </View>
              );
            })}
          </View>

          <Text style={styles.label}>Layout Variant</Text>
          <View style={styles.optionsRow}>
            {LAYOUT_OPTIONS.map((layoutVariant) => {
              return (
                <View
                  key={layoutVariant}
                  style={styles.optionButtonContainer}
                >
                  <Button
                    title={`${selectedLayoutVariant === layoutVariant ? '✓ ' : ''}${layoutVariant.toUpperCase()}`}
                    onPress={() => setSelectedLayoutVariant(layoutVariant)}
                  />
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Player</Text>
          <View style={styles.playerArea}>
            <ProMamoPlayer
              source={{ uri: 'https://test-stream.m3u8' }}
              themeName={selectedThemeName}
              layoutVariant={selectedLayoutVariant}
              analytics={{ onEvent: (event: unknown) => console.log('analytics event:', event) }}
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
    gap: 12,
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
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  optionButtonContainer: {
    minWidth: 108,
  },
  playerArea: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
  },
  player: {
    width: '100%',
    height: '100%',
  },
});
