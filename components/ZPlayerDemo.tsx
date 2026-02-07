import React from 'react';
import { StyleSheet, View } from 'react-native';
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
    console.log('Settings button pressed');
  };

  const handleLike = () => {
    console.log('Liked!');
  };

  const handleComment = () => {
    console.log('Comment button pressed');
  };

  const handleShare = () => {
    console.log('Share button pressed');
  };

  return (
    <View style={styles.container}>
        <ZPlayer
          source={videoSource}
          autoPlay={true}
          style={styles.player}
          subtitles={subtitles}
          onSettingsPress={handleSettingsPress}
          playerType="vertical"
          title="Big Buck Bunny"
          description="A fun animated short film about a giant rabbit and his adventures"
          author="blender_foundation"
          likes={125300}
          comments={3450}
          shares={8920}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
        />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  player: {
    flex: 1,
  },
});

export default ZPlayerDemo;
