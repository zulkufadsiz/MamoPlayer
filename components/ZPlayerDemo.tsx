import React from 'react';
import { StyleSheet, View } from 'react-native';
import ZPlayer from './ZPlayer';

export const ZPlayerDemo: React.FC = () => {
  // Example video URL (replace with your own)
  const videoSource = {
    uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  };

  const videoSourcesByLanguage = {
    en: {
      uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    },
    tr: {
      uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    },
    es: {
      uri: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    },
  };

  // Sample subtitle tracks (adjust timing for your video)
  const subtitleTracks = [
    {
      id: 'en',
      label: 'English',
      language: 'en',
      subtitles: [
        { start: '00:00:00', end: '00:00:05', text: 'Opening scene' },
        { start: '00:00:05', end: '00:00:10', text: 'A quiet forest' },
        { start: '00:00:10', end: '00:00:15', text: 'A giant rabbit appears' },
        { start: '00:00:15', end: '00:00:20', text: 'The rodents arrive' },
        { start: '00:00:20', end: '00:00:25', text: 'They start mischief' },
        { start: '00:00:25', end: '00:00:30', text: 'Bunny looks surprised' },
        { start: '00:00:30', end: '00:00:35', text: 'A chase begins' },
        { start: '00:00:35', end: '00:00:40', text: 'Quick camera pan' },
        { start: '00:00:40', end: '00:00:45', text: 'The plot thickens' },
        { start: '00:00:45', end: '00:00:50', text: 'A playful moment' },
        { start: '00:00:50', end: '00:00:55', text: 'Almost the end' },
        { start: '00:00:55', end: '00:01:00', text: 'Thanks for watching' },
      ],
    },
    {
      id: 'tr',
      label: 'Türkçe',
      language: 'tr',
      subtitles: [
        { start: '00:00:00', end: '00:00:05', text: 'Açılış sahnesi' },
        { start: '00:00:05', end: '00:00:10', text: 'Sessiz bir orman' },
        { start: '00:00:10', end: '00:00:15', text: 'Kocaman bir tavşan belirir' },
        { start: '00:00:15', end: '00:00:20', text: 'Kemirgenler gelir' },
        { start: '00:00:20', end: '00:00:25', text: 'Yaramazlık başlar' },
        { start: '00:00:25', end: '00:00:30', text: 'Tavşan şaşırır' },
        { start: '00:00:30', end: '00:00:35', text: 'Bir kovalamaca başlar' },
        { start: '00:00:35', end: '00:00:40', text: 'Hızlı kamera hareketi' },
        { start: '00:00:40', end: '00:00:45', text: 'Olaylar karışır' },
        { start: '00:00:45', end: '00:00:50', text: 'Neşeli bir an' },
        { start: '00:00:50', end: '00:00:55', text: 'Neredeyse bitti' },
        { start: '00:00:55', end: '00:01:00', text: 'İzlediğiniz için teşekkürler' },
      ],
    },
    {
      id: 'es',
      label: 'Español',
      language: 'es',
      subtitles: [
        { start: '00:00:00', end: '00:00:05', text: 'Escena de apertura' },
        { start: '00:00:05', end: '00:00:10', text: 'Un bosque tranquilo' },
        { start: '00:00:10', end: '00:00:15', text: 'Aparece un conejo gigante' },
        { start: '00:00:15', end: '00:00:20', text: 'Llegan los roedores' },
        { start: '00:00:20', end: '00:00:25', text: 'Empieza la travesura' },
        { start: '00:00:25', end: '00:00:30', text: 'El conejo se sorprende' },
        { start: '00:00:30', end: '00:00:35', text: 'Comienza la persecución' },
        { start: '00:00:35', end: '00:00:40', text: 'Paneo de cámara rápido' },
        { start: '00:00:40', end: '00:00:45', text: 'La trama se complica' },
        { start: '00:00:45', end: '00:00:50', text: 'Un momento divertido' },
        { start: '00:00:50', end: '00:00:55', text: 'Casi al final' },
        { start: '00:00:55', end: '00:01:00', text: 'Gracias por mirar' },
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
          playerType="simple"          
          contentFit="contain" // Options: 'contain' (shows full video, may have bars) | 'cover' (fills screen, may crop) | 'fill' (stretches)          
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
    paddingTop: 80,
    backgroundColor: '#000',
    height: 400,
    //flex: 1,
  },
  player: {
    flex: 1,
  },
});

export default ZPlayerDemo;
