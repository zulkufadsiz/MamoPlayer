// TODO: Background audio transport support is deferred. This service will be wired up
// when react-native-track-player is added as a peer dependency and the audio-only
// playback mode is implemented. See docs/internal/ for scope notes.
import TrackPlayer, { Event } from 'react-native-track-player';

const playbackService = async () => {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
};

export default playbackService;
