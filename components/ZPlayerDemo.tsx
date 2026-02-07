import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import ZPlayer from './ZPlayer';

export const ZPlayerDemo: React.FC = () => {
  // Example video URL (replace with your own)
  const videoSource = {
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  };

  // Sample subtitles (adjust timing for your video)
  const subtitles = [
    { start: 0, end: 5, text: "Welcome to Big Buck Bunny" },
    { start: 5, end: 10, text: "A short animated film" },
    { start: 10, end: 15, text: "Featuring a giant rabbit" },
    { start: 15, end: 20, text: "And some mischievous rodents" },
    { start: 20, end: 25, text: "Enjoy the show!" },
  ];

  const handleSettingsPress = () => {
    Alert.alert('Settings', 'Settings menu will be implemented here');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Video Player Demo</Text>
        
        <ZPlayer
          source={videoSource}
          autoPlay={false}
          allowsFullscreen={true}
          style={styles.player}
          subtitles={subtitles}
          onSettingsPress={handleSettingsPress}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  player: {
    marginVertical: 16,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  featureItem: {
    fontSize: 13,
    color: '#555',
    marginLeft: 8,
  },
});

export default ZPlayerDemo;
