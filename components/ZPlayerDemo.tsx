import React from 'react';
import { StyleSheet, View } from 'react-native';
import ZPlayer from './ZPlayer';

export const ZPlayerDemo: React.FC = () => {
  // Example video URL (replace with your own)
  const videoSource = {
    uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  };

  const videoSourcesByLanguage = {
    en: {
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    tr: {
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    },
    es: {
      uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    },
  };

  // Sample subtitle tracks (adjust timing for your video)
  const subtitleTracks = [
    {
      id: 'en',
      label: 'English',
      language: 'en',
      subtitles: [
        { start: 0, end: 5, text: 'Welcome to Big Buck Bunny' },
        { start: 5, end: 10, text: 'A short animated film' },
        { start: 10, end: 15, text: 'Featuring a giant rabbit' },
        { start: 15, end: 20, text: 'And some mischievous rodents' },
        { start: 20, end: 25, text: 'Enjoy the show!' },
      ],
    },
    {
      id: 'tr',
      label: 'Türkçe',
      language: 'tr',
      subtitles: [
        { start: 0, end: 5, text: 'Big Buck Bunny’ye hoş geldiniz' },
        { start: 5, end: 10, text: 'Kısa bir animasyon film' },
        { start: 10, end: 15, text: 'Kocaman bir tavşanla' },
        { start: 15, end: 20, text: 'Ve yaramaz kemirgenlerle' },
        { start: 20, end: 25, text: 'İyi seyirler!' },
      ],
    },
    {
      id: 'es',
      label: 'Español',
      language: 'es',
      subtitles: [
        { start: 0, end: 5, text: 'Bienvenido a Big Buck Bunny' },
        { start: 5, end: 10, text: 'Un corto animado' },
        { start: 10, end: 15, text: 'Con un conejo gigante' },
        { start: 15, end: 20, text: 'Y unos roedores traviesos' },
        { start: 20, end: 25, text: '¡Disfruta el show!' },
      ],
    },
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
          videoSourcesByLanguage={videoSourcesByLanguage}
          autoPlay={true}
          startAt={12}
          style={styles.player}
          subtitleTracks={subtitleTracks}
          defaultSubtitleTrackId="en"
          onSettingsPress={handleSettingsPress}
          playerType="landscape"
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
    backgroundColor: '#000',
    flex: 1,
  },
  player: {
    flex: 1,
  },
});

export default ZPlayerDemo;
