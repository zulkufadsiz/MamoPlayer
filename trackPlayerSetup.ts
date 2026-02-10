import TrackPlayer from 'react-native-track-player';

let isRegistered = false;

export const registerTransportService = () => {
  if (isRegistered) return;
  TrackPlayer.registerPlaybackService(() => require('./trackPlayerService'));
  isRegistered = true;
};
