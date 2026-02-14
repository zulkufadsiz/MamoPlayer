export type PlaybackEventType = 'play' | 'pause' | 'seek' | 'completion';

export interface PlaybackAnalyticsEvent {
  type: PlaybackEventType;
  playerType: 'simple' | 'vertical' | 'landscape';
  mediaUrl: string | null;
  currentTime?: number;
  duration?: number;
  fromTime?: number;
  toTime?: number;
}

type PlaybackAnalyticsPayload = PlaybackAnalyticsEvent & {
  timestamp: number;
};

const ANALYTICS_ENDPOINT = process.env.EXPO_PUBLIC_PLAYBACK_ANALYTICS_ENDPOINT;
const ANALYTICS_TOKEN = process.env.EXPO_PUBLIC_PLAYBACK_ANALYTICS_TOKEN;
const ANALYTICS_HEADER_NAME = process.env.EXPO_PUBLIC_PLAYBACK_ANALYTICS_HEADER_NAME;
const ANALYTICS_HEADER_VALUE = process.env.EXPO_PUBLIC_PLAYBACK_ANALYTICS_HEADER_VALUE;

const postPlaybackAnalytics = async (payload: PlaybackAnalyticsPayload) => {
  if (!ANALYTICS_ENDPOINT) return;
  if (typeof fetch !== 'function') return;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (ANALYTICS_TOKEN) {
      headers.Authorization = `Bearer ${ANALYTICS_TOKEN}`;
    }

    if (ANALYTICS_HEADER_NAME && ANALYTICS_HEADER_VALUE) {
      headers[ANALYTICS_HEADER_NAME] = ANALYTICS_HEADER_VALUE;
    }

    await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn('[PlaybackAnalytics] Failed to send event', error);
  }
};

export const trackPlaybackEvent = (event: PlaybackAnalyticsEvent) => {
  const payload: PlaybackAnalyticsPayload = {
    ...event,
    timestamp: Date.now(),
  };

  console.log('[PlaybackAnalytics]', payload);
  void postPlaybackAnalytics(payload);
};
