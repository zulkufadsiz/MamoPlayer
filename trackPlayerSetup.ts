// TODO: Deferred — not yet imported by index.js or any demo screen. Wire this up
// once react-native-track-player is added as a dependency and the background audio
// feature is scoped for implementation.
import TrackPlayer from 'react-native-track-player';

let isRegistered = false;

export const registerTransportService = () => {
  if (isRegistered) return;
  TrackPlayer.registerPlaybackService(() => require('./trackPlayerService').default);
  isRegistered = true;
};
